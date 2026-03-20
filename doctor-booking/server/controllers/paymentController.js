const Razorpay = require('razorpay');
const crypto = require('crypto');
const https = require('https');
const supabase = require('../config/supabase');
const { createNotification } = require('../utils/notifications');
const { generateInvoice } = require('../utils/invoiceGenerator');

const razorpay = new Razorpay({
       key_id: process.env.RAZORPAY_KEY_ID,
       key_secret: process.env.RAZORPAY_KEY_SECRET
});

// POST /api/payments/create-order
const createOrder = async (req, res) => {
       const { appointmentId, couponCode, insuranceProvider, policyNumber, insuranceAmount = 0 } = req.body;
       const patientId = req.user.id;

       try {
              // 1. Fetch appointment details
              const { data: appointment, error: apptError } = await supabase
                     .from('appointments')
                     .select(`
                  *,
                  doctor:doctors (
                      id,
                      fees,
                      profile:profiles (name, specialty)
                  )
              `)
                     .eq('id', appointmentId)
                     .single();

              if (apptError || !appointment) {
                     return res.status(404).json({ error: 'Appointment not found' });
              }

              const doctorId = appointment.doctor_id;
              let originalAmount = appointment.fees ?? appointment.doctor.fees;
              let discount = 0;
              let finalAmount = originalAmount;
              let couponId = null;

               // 2. Validate Coupon if provided
               if (couponCode) {
                      const { data: coupon, error: couponError } = await supabase
                             .from('coupons')
                             .select('*')
                             .eq('code', couponCode)
                             .eq('is_active', true)
                             .single();

                      if (coupon && !couponError) {
                             // Basic rules check
                             const now = new Date();
                             const isValid = (!coupon.valid_from || new Date(coupon.valid_from) <= now) &&
                                            (!coupon.valid_until || new Date(coupon.valid_until) >= now) &&
                                            (!coupon.usage_limit || coupon.used_count < coupon.usage_limit) &&
                                            (coupon.applicable_to !== 'specific_doctor' || coupon.doctor_id === doctorId);

                             if (isValid) {
                                    if (coupon.discount_type === 'percentage') {
                                           discount = (originalAmount * coupon.discount_value) / 100;
                                           if (coupon.max_discount_amount) {
                                                discount = Math.min(discount, coupon.max_discount_amount);
                                           }
                                    } else {
                                           discount = Math.min(coupon.discount_value, originalAmount);
                                    }
                                    couponId = coupon.id;
                                    finalAmount -= discount;
                             }
                      }
               }

              // 3. Apply Insurance
              finalAmount -= insuranceAmount;
              finalAmount = Math.max(finalAmount, 0); // Ensure not negative

              // 4. Create Razorpay order
              const options = {
                     amount: Math.round(finalAmount * 100), // amount in paise
                     currency: 'INR',
                     receipt: appointmentId,
                     payment_capture: 1,
                     notes: {
                            appointmentId,
                            patientId,
                            doctorId,
                            couponCode,
                            insuranceProvider,
                            insuranceAmount
                     }
              };

              const order = await razorpay.orders.create(options);

              // 5. Insert pending payment record
              const { data: payment, error: payError } = await supabase
                     .from('payments')
                     .insert([{
                            appointment_id: appointmentId,
                            patient_id: patientId,
                            doctor_id: doctorId,
                            amount: finalAmount,
                            currency: 'INR',
                            razorpay_order_id: order.id,
                            status: 'pending'
                     }])
                     .select()
                     .single();

              if (payError) throw payError;

              // 6. Record Insurance Claim if applicable (pre-emptive or link after payment)
              if (insuranceProvider && policyNumber) {
                     await supabase.from('insurance_claims').insert({
                            patient_id: patientId,
                            appointment_id: appointmentId,
                            payment_id: payment.id,
                            insurance_provider: insuranceProvider,
                            policy_number: policyNumber,
                            covered_amount: insuranceAmount,
                            patient_amount: finalAmount
                     });
              }

              res.status(200).json({
                     orderId: order.id,
                     amount: order.amount,
                     currency: order.currency,
                     doctorName: appointment.doctor.profile.name,
                     keyId: process.env.RAZORPAY_KEY_ID
              });

       } catch (error) {
              console.error('Create Order Error:', error);
              res.status(500).json({ error: error.message });
       }
};

// POST /api/payments/verify
const verifyPayment = async (req, res) => {
       const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointmentId } = req.body;

       try {
              // 1. Verify signature
              const body = razorpay_order_id + "|" + razorpay_payment_id;
              const expectedSignature = crypto
                     .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                     .update(body.toString())
                     .digest('hex');

              if (expectedSignature !== razorpay_signature) {
                     await supabase.from('payments').update({ status: 'failed' }).eq('razorpay_order_id', razorpay_order_id);
                     return res.status(400).json({ success: false, message: 'Payment verification failed' });
              }

              // 2. Update payment status
              const { data: payment, error: payUpdateError } = await supabase
                     .from('payments')
                     .update({
                            status: 'paid',
                            razorpay_payment_id,
                            razorpay_signature
                     })
                     .eq('razorpay_order_id', razorpay_order_id)
                     .select(`
                *,
                patient:profiles!patient_id (name, email),
                doctor:doctors (
                    id,
                    specialty,
                    profile:profiles (name)
                ),
                appointment:appointments (*)
            `)
                     .single();

              if (payUpdateError) throw payUpdateError;

              // 3. Update appointment status
              await supabase
                     .from('appointments')
                     .update({ status: 'confirmed', payment_status: 'paid' })
                     .eq('id', appointmentId);

              // 4. Calculate Earnings (Net = Gross - 10% Platform Fee)
              const platformFee = payment.amount * 0.10;
              const netAmount = payment.amount - platformFee;

              await supabase.from('doctor_earnings').insert({
                     doctor_id: payment.doctor_id,
                     payment_id: payment.id,
                     gross_amount: payment.amount,
                     platform_fee_amount: platformFee,
                     net_amount: netAmount,
                     status: 'pending'
              });

              // 5. Generate Invoice & Upload to Storage
              const invoiceNum = `INV-${Date.now()}`;
              const { data: claim } = await supabase.from('insurance_claims').select('*').eq('payment_id', payment.id).maybeSingle();
              
              const invoiceData = {
                     invoice_number: invoiceNum,
                     issued_at: new Date().toISOString(),
                     doctor_name: payment.doctor.profile.name,
                     doctor_specialty: payment.doctor.specialty,
                     patient_name: payment.patient.name,
                     patient_email: payment.patient.email,
                     subtotal: payment.appointment.fees || payment.amount,
                     discount_amount: 0, // In a real app, track this in payments table
                     insurance_covered: claim ? claim.covered_amount : 0,
                     insurance_provider: claim ? claim.insurance_provider : '',
                     tax_amount: payment.amount * 0.18, // Simplified
                     total_amount: payment.amount,
                     razorpay_payment_id,
                     status: 'paid',
                     appointment_date: payment.appointment.appointment_date,
                     appointment_time: payment.appointment.time_slot
              };

              const pdfBuffer = await generateInvoice(invoiceData);
              const fileName = `invoices/${invoiceNum}.pdf`;
              
              const { error: uploadError } = await supabase.storage
                     .from('medical-records') // Reuse bucket or specify new one
                     .upload(fileName, pdfBuffer, { contentType: 'application/pdf' });

              if (!uploadError) {
                     const { data: { publicUrl } } = supabase.storage.from('medical-records').getPublicUrl(fileName);
                     
                     await supabase.from('invoices').insert({
                            invoice_number: invoiceNum,
                            appointment_id: appointmentId,
                            payment_id: payment.id,
                            patient_id: payment.patient_id,
                            doctor_id: payment.doctor_id,
                            subtotal: invoiceData.subtotal,
                            total_amount: payment.amount,
                            tax_amount: invoiceData.tax_amount,
                            pdf_url: publicUrl,
                            status: 'paid'
                     });
              }

              // 6. Notifications
              await createNotification(payment.patient_id, 'Payment Successful', `Invoice ${invoiceNum} generated.`, 'payment_received', appointmentId);
              await createNotification(payment.doctor_id, 'New Appointment Confirmed', `Earnings updated.`, 'payment_received', appointmentId);

              res.status(200).json({ success: true, message: 'Payment verified, invoice generated, and earnings recorded' });
              
       } catch (error) {
              console.error('Verify Payment Error:', error);
              res.status(500).json({ error: error.message });
       }
};

// Internal Helper for local status updates
const updateLocalStatus = async (appointmentId, paymentId) => {
    // 1. Update Payment
    const { error: payError } = await supabase.from('payments').update({ status: 'refunded' }).eq('id', paymentId);
    if (payError) {
        console.error('Local Status Update (Payment) Error:', payError);
        throw payError;
    }
    
    // 2. Update Appointment
    const { error: apptError } = await supabase.from('appointments').update({ 
        status: 'cancelled', 
        payment_status: 'refunded',
        cancelled_reason: 'refunded'
    }).eq('id', appointmentId);
    if (apptError) {
        console.error('Local Status Update (Appointment) Error:', apptError);
        throw apptError;
    }
};

// POST /api/payments/refund
const refundPayment = async (req, res) => {
       const { appointmentId } = req.body;
       const userId = req.user.id;

       try {
              // 1. Fetch appointment and payment details
              const { data: appointment, error: apptError } = await supabase
                     .from('appointments')
                     .select(`
                 *,
                 payments (*)
             `)
                     .eq('id', appointmentId)
                     .eq('patient_id', userId)
                     .single();

              if (apptError || !appointment) {
                     console.error('Refund: Appointment fetch error:', apptError);
                     return res.status(404).json({ error: 'Appointment or paid payment not found' });
              }

              // FIND THE PAID PAYMENT
              const payments = Array.isArray(appointment.payments) ? appointment.payments : (appointment.payments ? [appointment.payments] : []);
              const payment = payments.find(p => p.status === 'paid');

              if (!payment) {
                     console.error('Refund: No paid payment found. Found payments:', payments);
                     return res.status(400).json({ error: 'No confirmed payment found for this appointment. Current status: ' + (appointment.payment_status || 'unpaid') });
              }

              if (!payment.razorpay_payment_id) {
                     console.error('Refund: Missing razorpay_payment_id for payment:', payment.id);
                     return res.status(400).json({ error: 'Payment record is missing internal Razorpay ID' });
              }

              // 2. Call Razorpay refund API via direct HTTPS
              try {
                     const amountInPaise = Math.round(Number(payment.amount) * 100);
                     const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
                     const postData = JSON.stringify({ amount: amountInPaise });

                     const options = {
                            hostname: 'api.razorpay.com',
                            port: 443,
                            path: `/v1/payments/${payment.razorpay_payment_id}/refund`,
                            method: 'POST',
                            headers: {
                                   'Content-Type': 'application/json',
                                   'Authorization': `Basic ${auth}`,
                                   'Content-Length': postData.length
                            }
                     };

                     await new Promise((resolve, reject) => {
                            const req = https.request(options, (res) => {
                                   res.on('data', () => {}); // Consume data to prevent hanging
                                   res.on('end', () => {
                                          if (res.statusCode >= 200 && res.statusCode < 300) {
                                                 resolve();
                                          } else {
                                                 reject(new Error('Razorpay API Error'));
                                          }
                                   });
                            });
                            req.on('error', (e) => reject(e));
                            req.write(postData);
                            req.end();
                     });

                     // 3. Update database
                     await updateLocalStatus(appointmentId, payment.id);

                     // 4. Notifications
                     await createNotification(
                            appointment.patient_id,
                            'Refund Processed',
                            `Your refund for the appointment has been initiated successfully.`,
                            'payment_refunded',
                            appointmentId
                     );

                     await createNotification(
                            appointment.doctor_id,
                            'Appointment Cancelled',
                            `An appointment has been cancelled and a refund has been issued to the patient.`,
                            'appointment_cancelled',
                            appointmentId
                     );

                     return res.status(200).json({ success: true, message: 'Refund initiated successfully' });

              } catch (rzpError) {
                     console.error('Refund: API error:', rzpError);
                     return res.status(500).json({ error: `Refund processing failed.` });
              }

       } catch (error) {
              console.error('Refund: Global error:', error);
              res.status(500).json({ error: error.message || 'Server error processing refund' });
       }
};

// GET /api/payments/history
const getPaymentHistory = async (req, res) => {
       const userId = req.user.id;
       const role = req.user.role;

       try {
              let query = supabase
                     .from('payments')
                     .select(`
                 *,
                 appointment:appointments (
                     appointment_date,
                     time_slot,
                     status
                 ),
                 patient:profiles!patient_id (name, email),
                 doctor:profiles!doctor_id (name, email)
             `)
                     .order('created_at', { ascending: false });

              if (role === 'patient') {
                     query = query.eq('patient_id', userId);
              } else if (role === 'doctor') {
                     query = query.eq('doctor_id', userId);
              }

              const { data, error } = await query;
              if (error) throw error;
              res.status(200).json(data);
       } catch (error) {
              console.error('Payment History Error:', error);
              res.status(500).json({ error: error.message });
       }
};

module.exports = {
       createOrder,
       verifyPayment,
       refundPayment,
       getPaymentHistory
};
