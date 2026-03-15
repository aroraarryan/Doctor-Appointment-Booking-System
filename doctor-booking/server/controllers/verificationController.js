const supabase = require('../config/supabase');
const { createNotification } = require('../utils/notifications');

// POST /api/verification/upload (protected, doctor only)
const uploadVerificationDoc = async (req, res) => {
       const { documentType, documentUrl } = req.body;
       const doctorId = req.user.id;

       try {
              // 1. Insert into doctor_verifications
              const { data: verification, error } = await supabase
                     .from('doctor_verifications')
                     .insert([{
                            doctor_id: doctorId,
                            document_type: documentType,
                            document_url: documentUrl,
                            status: 'pending'
                     }])
                     .select()
                     .single();

              if (error) throw error;

              // 2. Notify admin
              // Find admin users
              const { data: admins } = await supabase
                     .from('profiles')
                     .select('id')
                     .eq('role', 'admin');

              if (admins) {
                     for (const admin of admins) {
                            await createNotification(
                                   admin.id,
                                   'New Verification Request',
                                   `A doctor has submitted a new ${documentType} for verification.`,
                                   'verification_request',
                                   verification.id
                            );
                     }
              }

              res.status(201).json(verification);

       } catch (error) {
              console.error('Upload Verification Error:', error);
              res.status(500).json({ error: error.message });
       }
};

// GET /api/verification/my-status (protected, doctor only)
const getMyVerificationStatus = async (req, res) => {
       const doctorId = req.user.id;

       try {
              const { data: verifications, error } = await supabase
                     .from('doctor_verifications')
                     .select('*')
                     .eq('doctor_id', doctorId)
                     .order('uploaded_at', { ascending: false });

              if (error) throw error;

              res.status(200).json(verifications);

       } catch (error) {
              console.error('Get Verification Status Error:', error);
              res.status(500).json({ error: error.message });
       }
};

// GET /api/admin/verifications (protected, admin only)
const getPendingVerifications = async (req, res) => {
       try {
              const { data: verifications, error } = await supabase
                     .from('doctor_verifications')
                     .select(`
                *,
                doctor:profiles!doctor_id (name, email)
            `)
                     .eq('status', 'pending')
                     .order('uploaded_at', { ascending: false });

              if (error) throw error;

              res.status(200).json(verifications);

       } catch (error) {
              console.error('Get Pending Verifications Error:', error);
              res.status(500).json({ error: error.message });
       }
};

// PATCH /api/admin/verifications/:id (protected, admin only)
const updateVerificationStatus = async (req, res) => {
       const { id } = req.params;
       const { status, rejection_reason } = req.body;
       const adminId = req.user.id;

       try {
              // 1. Update verification record
              const { data: verification, error: updateError } = await supabase
                     .from('doctor_verifications')
                     .update({
                            status,
                            rejection_reason: status === 'rejected' ? rejection_reason : null,
                            reviewed_by: adminId,
                            reviewed_at: new Date().toISOString()
                     })
                     .eq('id', id)
                     .select()
                     .single();

              if (updateError) throw updateError;

              // 2. If approved, update doctor's verified status
              if (status === 'approved') {
                     const { error: doctorUpdateError } = await supabase
                            .from('doctors')
                            .update({
                                   is_verified: true,
                                   verification_badge: 'Verified Professional'
                            })
                            .eq('id', verification.doctor_id);

                     if (doctorUpdateError) throw doctorUpdateError;
              }

              // 3. Notify doctor
              await createNotification(
                     verification.doctor_id,
                     'Verification Update',
                     `Your verification request has been ${status}. ${rejection_reason ? 'Reason: ' + rejection_reason : ''}`,
                     status === 'approved' ? 'verification_approved' : 'verification_rejected',
                     id
              );

              res.status(200).json(verification);

       } catch (error) {
              console.error('Update Verification Status Error:', error);
              res.status(500).json({ error: error.message });
       }
};

module.exports = {
       uploadVerificationDoc,
       getMyVerificationStatus,
       getPendingVerifications,
       updateVerificationStatus
};
