const Razorpay = require('razorpay');
const crypto = require('crypto');
const https = require('https');
const supabase = require('../config/supabase');
const { createNotification } = require('../utils/notifications');

const razorpay = new Razorpay({
       key_id: process.env.RAZORPAY_KEY_ID,
       key_secret: process.env.RAZORPAY_KEY_SECRET
});

// POST /api/payments/create-order
const createOrder = async (req, res) => {
       const { appointmentId } = req.body;
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
                     profile:profiles (name)
                 )
             `)
                     .eq('id', appointmentId)
                     .single();

              if (apptError || !appointment) {
                     return res.status(404).json({ error: 'Appointment not found' });
              }

              const doctorId = appointment.doctor_id;
              const amount = appointment.fees ?? appointment.doctor.fees;
              const doctorName = appointment.doctor.profile.name;

              // 2. Create Razorpay order
              const options = {
                     amount: Math.round(amount * 100), // amount in paise
                     currency: 'INR',
                     receipt: appointmentId,
                     payment_capture: 1, // Auto-capture payments
                     notes: {
                            appointmentId,
                            patientId,
                            doctorId
                     }
              };

              const order = await razorpay.orders.create(options);

              // 3. Insert pending payment record
              const { error: payError } = await supabase
                     .from('payments')
                     .insert([{
                            appointment_id: appointmentId,
                            patient_id: patientId,
                            doctor_id: doctorId,
                            amount: amount,
                            currency: 'INR',
                            razorpay_order_id: order.id,
                            status: 'pending'
                     }]);

              if (payError) throw payError;

              res.status(200).json({
                     orderId: order.id,
                     amount: order.amount,
                     currency: order.currency,
                     doctorName,
                     appointmentDate: appointment.appointment_date,
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

              const isValid = expectedSignature === razorpay_signature;

              if (isValid) {
                     // 2. Update payment status
                     const { data: payment, error: payUpdateError } = await supabase
                            .from('payments')
                            .update({
                                   status: 'paid',
                                   razorpay_payment_id,
                                   razorpay_signature
                            })
                            .eq('razorpay_order_id', razorpay_order_id)
                            .select()
                            .single();

                     if (payUpdateError) throw payUpdateError;

                     // 3. Update appointment status
                     const { error: apptUpdateError } = await supabase
                            .from('appointments')
                            .update({
                                   status: 'confirmed',
                                   payment_status: 'paid'
                            })
                            .eq('id', appointmentId);

                     if (apptUpdateError) throw apptUpdateError;

                     // 4. Create notifications
                     await createNotification(
                            payment.patient_id,
                            'Payment Successful',
                            `Your payment for appointment with Dr. ${payment.doctor_id} has been confirmed.`,
                            'payment_received',
                            appointmentId
                     );

                     await createNotification(
                            payment.doctor_id,
                            'New Appointment Confirmed',
                            `A new appointment has been confirmed and paid for by a patient.`,
                            'payment_received',
                            appointmentId
                     );

                     res.status(200).json({ success: true, message: 'Payment verified and appointment confirmed' });
              } else {
                     await supabase
                            .from('payments')
                            .update({ status: 'failed' })
                            .eq('razorpay_order_id', razorpay_order_id);

                     res.status(400).json({ success: false, message: 'Payment verification failed' });
              }
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
