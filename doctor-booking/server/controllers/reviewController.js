const supabase = require('../config/supabase');
const { createNotification } = require('../utils/notifications');

// POST /api/reviews
const createReview = async (req, res) => {
       const { appointmentId, rating, comment } = req.body;
       const patientId = req.user.id;

       try {
              // 1. Validate appointment
              const { data: appointment, error: apptError } = await supabase
                     .from('appointments')
                     .select('*')
                     .eq('id', appointmentId)
                     .eq('patient_id', patientId)
                     .single();

              if (apptError || !appointment) {
                     return res.status(404).json({ error: 'Appointment not found' });
              }

              if (appointment.status !== 'completed') {
                     return res.status(400).json({ error: 'You can only review completed appointments' });
              }

              // 2. Check if review already exists
              const { data: existingReview, error: reviewCheckError } = await supabase
                     .from('reviews')
                     .select('id')
                     .eq('appointment_id', appointmentId)
                     .single();

              if (existingReview) {
                     return res.status(400).json({ error: 'Review already exists for this appointment' });
              }

              // 3. Insert review
              const { data: review, error: insertError } = await supabase
                     .from('reviews')
                     .insert([{
                            appointment_id: appointmentId,
                            patient_id: patientId,
                            doctor_id: appointment.doctor_id,
                            rating,
                            comment,
                            is_visible: true
                     }])
                     .select()
                     .single();

              if (insertError) throw insertError;

              // 4. Send notification to doctor
              await createNotification(
                     appointment.doctor_id,
                     'New Review Received',
                     `A patient has left a ${rating}-star review for your appointment.`,
                     'new_review',
                     appointmentId
              );

              res.status(201).json(review);

       } catch (error) {
              console.error('Create Review Error:', error);
              res.status(500).json({ error: error.message });
       }
};

// GET /api/reviews/doctor/:doctorId
const getDoctorReviews = async (req, res) => {
       const { doctorId } = req.params;
       const { page = 1, limit = 10 } = req.query;
       const offset = (page - 1) * limit;

       try {
              // 1. Get reviews with patient profiles
              const { data: reviews, error, count } = await supabase
                     .from('reviews')
                     .select(`
                *,
                patient:profiles!patient_id (name, avatar_url)
            `, { count: 'exact' })
                     .eq('doctor_id', doctorId)
                     .eq('is_visible', true)
                     .order('created_at', { ascending: false })
                     .range(offset, offset + limit - 1);

              if (error) throw error;

              // 2. Get average rating and count
              const { data: doctor, error: doctorError } = await supabase
                     .from('doctors')
                     .select('rating, total_reviews')
                     .eq('id', doctorId)
                     .single();

              res.status(200).json({
                     reviews,
                     totalCount: count,
                     averageRating: doctor?.rating || 0,
                     totalReviews: doctor?.total_reviews || 0,
                     currentPage: parseInt(page),
                     totalPages: Math.ceil(count / limit)
              });

       } catch (error) {
              console.error('Get Doctor Reviews Error:', error);
              res.status(500).json({ error: error.message });
       }
};

// DELETE /api/reviews/:id
const deleteReview = async (req, res) => {
       const { id } = req.params;
       const userId = req.user.id;
       const role = req.user.role;

       try {
              const { data: review, error: fetchError } = await supabase
                     .from('reviews')
                     .select('*')
                     .eq('id', id)
                     .single();

              if (fetchError || !review) {
                     return res.status(404).json({ error: 'Review not found' });
              }

              // Only patient who created or admin can delete
              if (role !== 'admin' && review.patient_id !== userId) {
                     return res.status(403).json({ error: 'Unauthorized to delete this review' });
              }

              if (role === 'admin') {
                     // Admin soft delete
                     const { error: updateError } = await supabase
                            .from('reviews')
                            .update({ is_visible: false })
                            .eq('id', id);
                     if (updateError) throw updateError;
              } else {
                     // Patient hard delete
                     const { error: deleteError } = await supabase
                            .from('reviews')
                            .delete()
                            .eq('id', id);
                     if (deleteError) throw deleteError;
              }

              res.status(200).json({ success: true, message: 'Review deleted successfully' });

       } catch (error) {
              console.error('Delete Review Error:', error);
              res.status(500).json({ error: error.message });
       }
};

module.exports = {
       createReview,
       getDoctorReviews,
       deleteReview
};
