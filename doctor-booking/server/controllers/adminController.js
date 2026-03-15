const supabase = require('../config/supabase');
const { createNotification } = require('../utils/notifications');

// GET /api/admin/stats
const getStats = async (req, res) => {
       try {
              const { data, error } = await supabase
                     .from('admin_stats')
                     .select('*')
                     .single();

              if (error) throw error;
              res.status(200).json(data);
       } catch (error) {
              console.error('Admin Stats Error:', error);
              res.status(500).json({ error: error.message });
       }
};

// GET /api/admin/appointments-by-day
const getAppointmentsByDay = async (req, res) => {
       const days = req.query.days || 30;
       try {
              // We'll calculate this in JS since cross-platform date grouping in SQL can be tricky via Supabase JS
              const { data, error } = await supabase
                     .from('appointments')
                     .select('created_at')
                     .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

              if (error) throw error;

              const counts = data.reduce((acc, appt) => {
                     const date = appt.created_at.split('T')[0];
                     acc[date] = (acc[date] || 0) + 1;
                     return acc;
              }, {});

              const formattedData = Object.keys(counts).sort().map(date => ({
                     date,
                     count: counts[date]
              }));

              res.status(200).json(formattedData);
       } catch (error) {
              res.status(500).json({ error: error.message });
       }
};

// GET /api/admin/revenue-by-month
const getRevenueByMonth = async (req, res) => {
       const months = req.query.months || 6;
       try {
              const { data, error } = await supabase
                     .from('payments')
                     .select('amount, created_at')
                     .eq('status', 'paid')
                     .gte('created_at', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString());

              if (error) throw error;

              const revenue = data.reduce((acc, pay) => {
                     const month = pay.created_at.substring(0, 7); // YYYY-MM
                     acc[month] = (acc[month] || 0) + parseFloat(pay.amount);
                     return acc;
              }, {});

              const formattedData = Object.keys(revenue).sort().map(month => ({
                     month,
                     revenue: revenue[month]
              }));

              res.status(200).json(formattedData);
       } catch (error) {
              res.status(500).json({ error: error.message });
       }
};

// GET /api/admin/specialty-breakdown
const getSpecialtyBreakdown = async (req, res) => {
       try {
              const { data, error } = await supabase
                     .from('appointments')
                     .select(`
                id,
                doctor:doctors (
                    specialty
                )
            `);

              if (error) throw error;

              const breakdown = data.reduce((acc, appt) => {
                     const spec = appt.doctor.specialty;
                     acc[spec] = (acc[spec] || 0) + 1;
                     return acc;
              }, {});

              const formattedData = Object.keys(breakdown).map(name => ({
                     name,
                     value: breakdown[name]
              }));

              res.status(200).json(formattedData);
       } catch (error) {
              res.status(500).json({ error: error.message });
       }
};

// GET /api/admin/doctors
const getDoctors = async (req, res) => {
       const { status } = req.query;
       try {
              let query = supabase
                     .from('doctors')
                     .select(`
                *,
                profile:profiles (*)
            `);

              if (status === 'pending') {
                     query = query.eq('is_approved', false);
              } else if (status === 'approved') {
                     query = query.eq('is_approved', true);
              }

              const { data, error } = await query;
              if (error) throw error;
              res.status(200).json(data);
       } catch (error) {
              res.status(500).json({ error: error.message });
       }
};

// PATCH /api/admin/doctors/:id/approve
const approveDoctor = async (req, res) => {
       const { id } = req.params;
       try {
              const { error } = await supabase
                     .from('doctors')
                     .update({ is_approved: true })
                     .eq('id', id);

              if (error) throw error;

              await createNotification(
                     id,
                     'Profile Approved',
                     'Your doctor profile has been approved! You can now start receiving appointments.',
                     'doctor_approved'
              );

              res.status(200).json({ message: 'Doctor approved successfully' });
       } catch (error) {
              res.status(500).json({ error: error.message });
       }
};

// PATCH /api/admin/doctors/:id/reject
const rejectDoctor = async (req, res) => {
       const { id } = req.params;
       try {
              // We delete the doctor record. 
              // Note: we might want to keep the profile but set role back to patient, 
              // but typically a rejected doctor registration means they shouldn't be a doctor.
              const { error } = await supabase
                     .from('doctors')
                     .delete()
                     .eq('id', id);

              if (error) throw error;

              // Optionally update profile role to patient
              await supabase
                     .from('profiles')
                     .update({ role: 'patient' })
                     .eq('id', id);

              res.status(200).json({ message: 'Doctor rejected' });
       } catch (error) {
              res.status(500).json({ error: error.message });
       }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
       const page = parseInt(req.query.page) || 1;
       const limit = parseInt(req.query.limit) || 10;
       const offset = (page - 1) * limit;

       try {
              const { data, error, count } = await supabase
                     .from('profiles')
                     .select('*', { count: 'exact' })
                     .range(offset, offset + limit - 1)
                     .order('created_at', { ascending: false });

              if (error) throw error;

              res.status(200).json({
                     users: data,
                     total: count,
                     pages: Math.ceil(count / limit)
              });
       } catch (error) {
              res.status(500).json({ error: error.message });
       }
};

// PATCH /api/admin/users/:id/suspend
const toggleUserStatus = async (req, res) => {
       const { id } = req.params;
       const { suspended } = req.body;
       try {
              const { error } = await supabase
                     .from('profiles')
                     .update({ is_suspended: suspended })
                     .eq('id', id);

              if (error) throw error;
              res.status(200).json({ message: `User ${suspended ? 'suspended' : 'unsuspended'} successfully` });
       } catch (error) {
              res.status(500).json({ error: error.message });
       }
};

// GET /api/admin/featured
const getFeaturedDoctors = async (req, res) => {
       try {
              const { data, error } = await supabase
                     .from('featured_doctors')
                     .select(`
                *,
                doctor:doctors!doctor_id (
                    id,
                    profile:profiles (name, avatar_url)
                )
            `)
                     .order('priority', { ascending: false });

              if (error) throw error;
              res.status(200).json(data);
       } catch (error) {
              res.status(500).json({ error: error.message });
       }
};

// POST /api/admin/featured
const addFeaturedDoctor = async (req, res) => {
       const { doctorId, priority, startDate, endDate } = req.body;
       const adminId = req.user.id;

       try {
              // 1. Insert into featured_doctors
              const { data, error } = await supabase
                     .from('featured_doctors')
                     .upsert([{
                            doctor_id: doctorId,
                            priority: priority || 0,
                            start_date: startDate,
                            end_date: endDate,
                            created_by: adminId
                     }], { onConflict: 'doctor_id' })
                     .select()
                     .single();

              if (error) throw error;

              // 2. Update doctors table cache
              const { error: doctorUpdateError } = await supabase
                     .from('doctors')
                     .update({ featured_until: endDate })
                     .eq('id', doctorId);

              if (doctorUpdateError) throw doctorUpdateError;

              // 3. Notify doctor
              await createNotification(
                     doctorId,
                     'Profile Featured',
                     `Congratulations! Your profile is now featured until ${endDate}.`,
                     'doctor_featured'
              );

              res.status(201).json(data);
       } catch (error) {
              res.status(500).json({ error: error.message });
       }
};

// DELETE /api/admin/featured/:id
const removeFeaturedDoctor = async (req, res) => {
       const { id } = req.params;
       try {
              // 1. Get doctor_id before deleting
              const { data: featured } = await supabase
                     .from('featured_doctors')
                     .select('doctor_id')
                     .eq('id', id)
                     .single();

              // 2. Delete record
              const { error } = await supabase
                     .from('featured_doctors')
                     .delete()
                     .eq('id', id);

              if (error) throw error;

              // 3. Update doctors table
              if (featured) {
                     await supabase
                            .from('doctors')
                            .update({ featured_until: null })
                            .eq('id', featured.doctor_id);
              }

              res.status(200).json({ message: 'Featured status removed' });
       } catch (error) {
              res.status(500).json({ error: error.message });
       }
};

// GET /api/admin/verifications - list verification requests
const getVerifications = async (req, res) => {
       try {
              const { status } = req.query;
              let query = supabase
                     .from('doctor_verifications')
                     .select(`
                *,
                doctor:doctors!doctor_id (
                    id,
                    profile:profiles (name, email, avatar_url)
                )
            `)
                     .order('uploaded_at', { ascending: false });

              if (status) {
                     query = query.eq('status', status);
              }

              const { data, error } = await query;
              if (error) throw error;
              res.status(200).json(data);
       } catch (error) {
              res.status(500).json({ error: error.message });
       }
};

// PATCH /api/admin/verifications/:id - approve/reject document
const updateVerificationStatus = async (req, res) => {
       const { id } = req.params;
       const { status, rejection_reason } = req.body;
       const adminId = req.user.id;

       try {
              // 1. Update verification record
              const { data: vData, error: vError } = await supabase
                     .from('doctor_verifications')
                     .update({
                            status,
                            rejection_reason,
                            reviewed_by: adminId,
                            reviewed_at: new Date().toISOString()
                     })
                     .eq('id', id)
                     .select('doctor_id')
                     .single();

              if (vError) throw vError;

              // 2. If approved, check if all 3 documents for this doctor are approved
              if (status === 'approved') {
                     const { data: allDocs, error: checkError } = await supabase
                            .from('doctor_verifications')
                            .select('status')
                            .eq('doctor_id', vData.doctor_id);

                     if (checkError) throw checkError;

                     const approvedCount = allDocs.filter(d => d.status === 'approved').length;

                     // If we have at least 3 approved docs (Medical License, Degree, ID Proof)
                     if (approvedCount >= 3) {
                            await supabase
                                   .from('doctors')
                                   .update({ is_verified: true })
                                   .eq('id', vData.doctor_id);

                            await createNotification(
                                   vData.doctor_id,
                                   'Verified Badge Earned',
                                   'All your documents have been approved! You now have a verified specialist badge.',
                                   'verification_complete'
                            );
                     }
              } else if (status === 'rejected') {
                     await createNotification(
                            vData.doctor_id,
                            'Document Rejected',
                            `A document was rejected: ${rejection_reason}. Please re-upload in the dashboard.`,
                            'verification_rejected'
                     );
              }

              res.status(200).json({ message: 'Status updated successfully' });
       } catch (error) {
              res.status(500).json({ error: error.message });
       }
};

// GET /api/admin/no-shows
const getNoShows = async (req, res) => {
       try {
              const { data, error } = await supabase
                     .from('appointments')
                     .select(`
                id,
                appointment_date,
                time_slot,
                no_show_flagged_at,
                patient:profiles!patient_id (name),
                doctor:doctors!doctor_id (
                    profile:profiles (name)
                )
            `)
                     .eq('no_show', true)
                     .order('no_show_flagged_at', { ascending: false });

              if (error) throw error;

              const formattedData = data.map(app => ({
                     id: app.id,
                     appointment_date: app.appointment_date,
                     time_slot: app.time_slot,
                     no_show_flagged_at: app.no_show_flagged_at,
                     patient_name: app.patient.name,
                     doctor_name: app.doctor.profile.name
              }));

              res.status(200).json(formattedData);
       } catch (error) {
              res.status(500).json({ error: error.message });
       }
};

module.exports = {
       getStats,
       getAppointmentsByDay,
       getRevenueByMonth,
       getSpecialtyBreakdown,
       getDoctors,
       approveDoctor,
       rejectDoctor,
       getUsers,
       toggleUserStatus,
       getFeaturedDoctors,
       addFeaturedDoctor,
       removeFeaturedDoctor,
       getVerifications,
       updateVerificationStatus,
       getNoShows
};
