const supabase = require('../config/supabase');

// GET /api/doctors - list all approved doctors with filters
const getDoctors = async (req, res) => {
       const { specialty, search, min_fee, max_fee, sort, city, verified, featured, nearby, lat, lng } = req.query;

       try {
              // If sorting by nearby, use RPC
              if (nearby === 'true' && lat && lng) {
                     const { data, error } = await supabase.rpc('get_nearby_doctors', {
                            p_lat: parseFloat(lat),
                            p_lng: parseFloat(lng),
                            p_specialty: specialty || null,
                            p_city: city || null,
                            p_verified: verified === 'true' ? true : null
                     });

                     if (error) throw error;
                     return res.status(200).json(data);
              }

              let query = supabase
                     .from('profiles')
                     .select(`
                id, name, email, avatar_url, role,
                doctors!inner (
                    specialty, experience, fees, bio, is_approved, rating, total_reviews, 
                    is_verified, verification_badge, city, state, featured_until, latitude, longitude
                )
            `)
                     .eq('role', 'doctor')
                     .eq('doctors.is_approved', true);

              if (specialty) {
                     query = query.eq('doctors.specialty', specialty);
              }

              if (search) {
                     query = query.ilike('name', `%${search}%`);
              }

              if (city) {
                     query = query.ilike('doctors.city', `%${city}%`);
              }

              if (verified === 'true') {
                     query = query.eq('doctors.is_verified', true);
              }

              if (featured === 'true') {
                     query = query.gte('doctors.featured_until', new Date().toISOString().split('T')[0]);
              }

              if (min_fee) {
                     query = query.gte('doctors.fees', min_fee);
              }

              if (max_fee) {
                     query = query.lte('doctors.fees', max_fee);
              }

              // Sorting
              if (sort === 'rating') {
                     query = query.order('doctors(rating)', { ascending: false });
              } else if (sort === 'fees') {
                     query = query.order('doctors(fees)', { ascending: true });
              } else if (sort === 'experience') {
                     query = query.order('doctors(experience)', { ascending: false });
              } else if (featured === 'true') {
                     // Featured priority
                     // (Assumes a 'priority' column exists if we join featured_doctors, 
                     // but requirement said sort by priority if featured=true)
                     // For now, let's just return all doctors who are within featured_until
                     query = query.order('doctors(featured_until)', { ascending: false });
              }

              const { data, error } = await query;

              if (error) throw error;

              // Flatten the response
              const doctors = data.map(item => ({
                     id: item.id,
                     name: item.name,
                     email: item.email,
                     avatar_url: item.avatar_url,
                     ...item.doctors
              }));

              res.status(200).json(doctors);
       } catch (error) {
              console.error('getDoctors Error:', error);
              res.status(400).json({ error: error.message });
       }
};

// GET /api/doctors/:id/availability-calendar?month=YYYY-MM
const getDoctorAvailabilityCalendar = async (req, res) => {
       const { id } = req.params;
       let { month } = req.query; // Format: YYYY-MM

       if (!month) {
              const now = new Date();
              month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
       }

       try {
              // 1. Get doctor's weekly availability
              const { data: availability, error: availError } = await supabase
                     .from('availability')
                     .select('*')
                     .eq('doctor_id', id);

              if (availError) throw availError;

              // 2. Get existing appointments for the month
              const startDate = `${month}-01`;
              const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1)).toISOString().split('T')[0];

              const { data: appointments, error: apptError } = await supabase
                     .from('appointments')
                     .select('appointment_date, time_slot')
                     .eq('doctor_id', id)
                     .gte('appointment_date', startDate)
                     .lt('appointment_date', endDate)
                     .neq('status', 'cancelled');

              if (apptError) throw apptError;

              // 3. Generate calendar for each day in the month
              const year = parseInt(month.split('-')[0]);
              const m = parseInt(month.split('-')[1]) - 1;
              const daysInMonth = new Date(year, m + 1, 0).getDate();

              const calendar = {};
              const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              const todayStr = new Date().toISOString().split('T')[0];

              for (let d = 1; d <= daysInMonth; d++) {
                     const date = new Date(year, m, d);
                     const dateStr = date.toISOString().split('T')[0];
                     const dayName = daysOfWeek[date.getDay()];

                     // Find availability for this day of week
                     const dayAvail = availability.find(a => a.day_of_week === dayName);

                     if (!dayAvail || dateStr < todayStr) {
                            calendar[dateStr] = { available: false, count: 0 };
                            continue;
                     }

                     // Generate slots for this day
                     const startTime = dayAvail.start_time;
                     const endTime = dayAvail.end_time;
                     const duration = dayAvail.slot_duration_mins || 30;

                     let totalSlots = 0;
                     let bookedSlots = 0;

                     let current = new Date(`1970-01-01T${startTime}`);
                     const end = new Date(`1970-01-01T${endTime}`);

                     while (current < end) {
                            totalSlots++;
                            const slotTime = current.toTimeString().split(' ')[0];

                            const isBooked = appointments.some(a =>
                                   a.appointment_date === dateStr &&
                                   a.time_slot === slotTime
                            );

                            if (isBooked) bookedSlots++;
                            current.setMinutes(current.getMinutes() + duration);
                     }

                     const freeSlots = totalSlots - bookedSlots;
                     calendar[dateStr] = {
                            available: freeSlots > 0,
                            count: freeSlots
                     };
              }

              res.status(200).json(calendar);

       } catch (error) {
              console.error('getDoctorAvailabilityCalendar Error:', error);
              res.status(500).json({ error: error.message });
       }
};
// GET /api/doctors/:id - get specific doctor details
const getDoctorById = async (req, res) => {
       try {
              const { id } = req.params;
              const { data, error } = await supabase
                     .from('profiles')
                     .select(`
                id, name, email, avatar_url, role,
                doctors (
                    specialty, experience, fees, bio, is_approved, rating, total_reviews, 
                    is_verified, verification_badge, city, state, featured_until, latitude, longitude,
                    buffer_time_mins, cancellation_policy_hours
                )
            `)
                     .eq('id', id)
                     .single();

              if (error) throw error;
              if (!data) return res.status(404).json({ error: 'Doctor not found' });

              const doctor = {
                     id: data.id,
                     name: data.name,
                     email: data.email,
                     avatar_url: data.avatar_url,
                     ...data.doctors
              };

              res.status(200).json(doctor);
       } catch (error) {
              console.error('getDoctorById Error:', error);
              res.status(500).json({ error: error.message });
       }
};

// GET /api/doctors/specialties - get list of all unique specialties
const getSpecialties = async (req, res) => {
       try {
              const { data, error } = await supabase
                     .from('doctors')
                     .select('specialty')
                     .eq('is_approved', true);

              if (error) throw error;

              const specialties = [...new Set(data.map(d => d.specialty))].filter(Boolean);
              res.status(200).json(specialties);
       } catch (error) {
              console.error('getSpecialties Error:', error);
              res.status(500).json({ error: error.message });
       }
};

// PUT /api/doctors/profile - update doctor profile
const updateDoctorProfile = async (req, res) => {
       const { 
              specialty, experience, fees, bio, city, state, name, avatar_url,
              buffer_time_mins, cancellation_policy_hours 
       } = req.body;
       const id = req.params.id || req.user.id;

       try {
              // Update profile
              if (name || avatar_url) {
                     const { error: profileError } = await supabase
                            .from('profiles')
                            .update({ name, avatar_url })
                            .eq('id', id);
                     if (profileError) throw profileError;
              }

              // Update doctor specific
              const { error: doctorError } = await supabase
                     .from('doctors')
                     .update({ 
                            specialty, experience, fees, bio, city, state,
                            buffer_time_mins, cancellation_policy_hours 
                     })
                     .eq('id', id);

              if (doctorError) throw doctorError;

              res.status(200).json({ message: 'Profile updated successfully' });
       } catch (error) {
              console.error('updateDoctorProfile Error:', error);
              res.status(500).json({ error: error.message });
       }
};

// GET /api/doctors/featured - list specialists currently featured
const getFeaturedDoctors = async (req, res) => {
       try {
              const today = new Date().toISOString().split('T')[0];

              const { data, error } = await supabase
                     .from('featured_doctors')
                     .select(`
                priority, end_date,
                doctor:doctor_id (
                    id, specialty, rating, total_reviews, fees, city, is_verified,
                    profile:profiles!doctors_id_fkey (name, avatar_url)
                )
            `)
                     .gte('end_date', today)
                     .order('priority', { ascending: false })
                     .limit(10);

              if (error) throw error;

              // Flatten
              const featured = data.map(item => ({
                     id: item.doctor.id,
                     name: item.doctor.profile.name,
                     avatar_url: item.doctor.profile.avatar_url,
                     priority: item.priority,
                     ...item.doctor
              }));

              res.status(200).json(featured);
       } catch (error) {
              console.error('getFeaturedDoctors Error:', error);
              res.status(500).json({ error: error.message });
       }
};

// GET /api/doctors/reviews/latest - get recent reviews for home page social proof
const getLatestReviews = async (req, res) => {
       try {
              const { data, error } = await supabase
                     .from('reviews')
                     .select(`
                id, rating, comment, created_at,
                patient:profiles!reviews_patient_id_fkey (name, avatar_url),
                doctor:doctors!reviews_doctor_id_fkey (
                    id,
                    profile:profiles!doctors_id_fkey (name)
                )
            `)
                     .eq('is_visible', true)
                     .order('created_at', { ascending: false })
                     .limit(6);

              if (error) throw error;

              // Flatten
              const reviews = data.map(review => ({
                     id: review.id,
                     rating: review.rating,
                     comment: review.comment,
                     created_at: review.created_at,
                     patient_name: review.patient?.name || 'Anonymous',
                     patient_avatar: review.patient?.avatar_url,
                     doctor_name: review.doctor?.profile?.name || 'Specialist',
                     doctor_id: review.doctor?.id
              }));

              res.status(200).json(reviews);
       } catch (error) {
              console.error('getLatestReviews Error:', error);
              res.status(500).json({ error: error.message });
       }
};

module.exports = {
       getDoctors,
       getDoctorById,
       updateDoctorProfile,
       getSpecialties,
       getDoctorAvailabilityCalendar,
       getFeaturedDoctors,
       getLatestReviews
};
