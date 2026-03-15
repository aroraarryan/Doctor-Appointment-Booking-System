const supabase = require('../config/supabase');
const { createNotification } = require('../utils/notifications');

// POST /api/appointments - create booking
const bookAppointment = async (req, res) => {
       const { 
              doctor_id, 
              appointment_date, 
              time_slot, 
              notes,
              is_recurring = false,
              recurrence_pattern = 'weekly',
              recurrence_count = 1
       } = req.body;

       if (!doctor_id || !appointment_date || !time_slot) {
              return res.status(400).json({ error: 'Missing required fields' });
       }

       try {
              // 1. Verification and validation
              const { data: doctor, error: doctorError } = await supabase
                     .from('doctors')
                     .select('is_approved, buffer_time_mins')
                     .eq('id', doctor_id)
                     .single();

              if (doctorError || !doctor || !doctor.is_approved) {
                     return res.status(400).json({ error: 'Doctor is not available for booking' });
              }

              const bufferMins = doctor.buffer_time_mins || 0;

              // 2. Prepare list of slots to book
              const appointmentDates = [];
              const startDate = new Date(appointment_date);
              const count = is_recurring ? Math.min(recurrence_count, 12) : 1;

              for (let i = 0; i < count; i++) {
                     const currentDate = new Date(startDate);
                     if (recurrence_pattern === 'weekly') {
                            currentDate.setDate(startDate.getDate() + (i * 7));
                     } else if (recurrence_pattern === 'bi-weekly') {
                            currentDate.setDate(startDate.getDate() + (i * 14));
                     }
                     appointmentDates.push(currentDate.toISOString().split('T')[0]);
              }

              // 3. Parallel availability checks (Optimization)
              const availabilityChecks = appointmentDates.map(dateStr => 
                     supabase.rpc('check_slot_with_buffer', {
                            p_doctor_id: doctor_id,
                            p_date: dateStr,
                            p_time_slot: time_slot,
                            p_buffer_mins: bufferMins
                     })
              );

              const checkResults = await Promise.all(availabilityChecks);

              const appointmentsToBook = [];
              for (let i = 0; i < checkResults.length; i++) {
                     const { data: isAvailable, error: slotError } = checkResults[i];
                     const dateStr = appointmentDates[i];

                     if (slotError || !isAvailable) {
                            return res.status(400).json({ 
                                   error: `Slot on ${dateStr} at ${time_slot} is not available (considering buffer time). All slots must be available for recurring booking.` 
                            });
                     }

                     appointmentsToBook.push({
                            patient_id: req.user.id,
                            doctor_id,
                            appointment_date: dateStr,
                            time_slot,
                            notes,
                            status: 'pending',
                            is_recurring,
                            recurrence_pattern: is_recurring ? recurrence_pattern : null
                     });
              }

              // 4. Batch Insert (Supabase handles this)
              const { data, error } = await supabase
                     .from('appointments')
                     .insert(appointmentsToBook)
                     .select();

              if (error) throw error;

              // 5. Link recurring appointments if needed
              if (is_recurring && data.length > 1) {
                     const parentId = data[0].id;
                     const otherIds = data.slice(1).map(a => a.id);
                     await supabase
                            .from('appointments')
                            .update({ parent_appointment_id: parentId })
                            .in('id', otherIds);
              }

              // 6. Schedule Reminders for each created appointment
              for (const appt of data) {
                     await scheduleReminders(appt.id, appt.appointment_date, appt.time_slot);
              }

              // 7. Notify doctor
              await createNotification(
                     doctor_id,
                     is_recurring ? 'New Recurring Appointment' : 'New Appointment Booked',
                     `You have ${data.length} new appointment request(s) starting ${appointment_date} at ${time_slot}.`,
                     'appointment_booked',
                     data[0].id
              );

              res.status(201).json(data);
       } catch (error) {
              res.status(400).json({ error: error.message });
       }
};

// GET /api/appointments/patient - get patient's appointments
const getPatientAppointments = async (req, res) => {
       try {
              const { data, error } = await supabase
                     .from('appointments')
                     .select(`
                            *,
                            doctor:doctor_id (
                                   specialty,
                                   profile:profiles (name, avatar_url)
                            )
                     `)
                     .eq('patient_id', req.user.id)
                     .order('appointment_date', { ascending: false });

              if (error) throw error;
              res.status(200).json(data);
       } catch (error) {
              res.status(400).json({ error: error.message });
       }
};

// GET /api/appointments/doctor - get doctor's appointments
const getDoctorAppointments = async (req, res) => {
       try {
              const { data, error } = await supabase
                     .from('appointments')
                     .select(`
                            *,
                            patient:patient_id (name, avatar_url)
                     `)
                     .eq('doctor_id', req.user.id)
                     .order('appointment_date', { ascending: false });

              if (error) throw error;
              res.status(200).json(data);
       } catch (error) {
              res.status(400).json({ error: error.message });
       }
};

// PATCH /api/appointments/:id/status - update status
const updateStatus = async (req, res) => {
       const { id } = req.params;
       const { status } = req.body;

       if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
              return res.status(400).json({ error: 'Invalid status' });
       }

       try {
              const { data, error } = await supabase
                     .from('appointments')
                     .update({ status })
                     .eq('id', id)
                     .eq('doctor_id', req.user.id) // Ensure doctor owns this appointment
                     .select()
                     .single();

              if (error) throw error;

              // Notify patient
              let title = '';
              let message = '';
              let type = '';

              if (status === 'confirmed') {
                     title = 'Appointment Confirmed';
                     message = `Your appointment for ${data.appointment_date} has been confirmed.`;
                     type = 'appointment_confirmed';
              } else if (status === 'cancelled') {
                     title = 'Appointment Cancelled';
                     message = `Your appointment for ${data.appointment_date} has been cancelled by the doctor.`;
                     type = 'appointment_cancelled';
              } else if (status === 'completed') {
                     title = 'Appointment Completed';
                     message = `Your appointment for ${data.appointment_date} is marked as completed.`;
                     type = 'appointment_completed';
              }

              await createNotification(data.patient_id, title, message, type, data.id);

              res.status(200).json(data);
       } catch (error) {
              res.status(400).json({ error: error.message });
       }
};

// DELETE /api/appointments/:id - cancel (patient only)
const cancelAppointment = async (req, res) => {
       const { id } = req.params;

       try {
              // First get the appointment details to know who to notify
              const { data: appointment, error: getError } = await supabase
                     .from('appointments')
                     .select('*')
                     .eq('id', id)
                     .single();

              if (getError) throw getError;

              const { error } = await supabase
                     .from('appointments')
                     .delete()
                     .eq('id', id)
                     .eq('patient_id', req.user.id)
                     .eq('status', 'pending'); // Only pending can be deleted

              if (error) throw error;

              // Notify doctor
              await createNotification(
                     appointment.doctor_id,
                     'Appointment Cancelled',
                     `An appointment for ${appointment.appointment_date} has been cancelled by the patient.`,
                     'appointment_cancelled',
                     appointment.id
              );

              res.status(200).json({ message: 'Appointment cancelled' });
       } catch (error) {
              res.status(400).json({ error: error.message });
       }
};

// PATCH /api/appointments/:id/reschedule (patient only)
const rescheduleAppointment = async (req, res) => {
       const { id } = req.params;
       const { new_date, new_time_slot } = req.body;

       try {
              // 1. Fetch original appointment and doctor's policy
              const { data: appointment, error: getError } = await supabase
                     .from('appointments')
                     .select(`
                            *,
                            doctor:doctor_id (
                                   id,
                                   cancellation_policy_hours,
                                   buffer_time_mins
                            )
                     `)
                     .eq('id', id)
                     .eq('patient_id', req.user.id)
                     .single();

              if (getError || !appointment) {
                     return res.status(404).json({ error: 'Appointment not found' });
              }

              if (appointment.status !== 'pending' && appointment.status !== 'confirmed') {
                     return res.status(400).json({ error: 'Can only reschedule pending or confirmed appointments' });
              }

              if (appointment.is_rescheduled) {
                     return res.status(400).json({ error: 'Appointment has already been rescheduled' });
              }

              // 2. Validate cancellation/reschedule window
              const policyHours = appointment.doctor.cancellation_policy_hours || 24;
              const appointmentTime = new Date(`${appointment.appointment_date}T${appointment.time_slot}`);
              const now = new Date();
              const hoursDiff = (appointmentTime - now) / (1000 * 60 * 60);

              if (hoursDiff < policyHours) {
                     return res.status(400).json({ 
                            error: `Rescheduling is only allowed at least ${policyHours} hours before the appointment.` 
                     });
              }

              // 3. Check availability for new slot (including buffer)
              const { data: isAvailable, error: bufferError } = await supabase.rpc('check_slot_with_buffer', {
                     p_doctor_id: appointment.doctor_id,
                     p_date: new_date,
                     p_time_slot: new_time_slot,
                     p_buffer_mins: appointment.doctor.buffer_time_mins || 0
              });

              if (bufferError || !isAvailable) {
                     return res.status(400).json({ error: 'Selected slot is not available considering doctor buffer time' });
              }

              // 4. Create new appointment
              const { data: newAppointment, error: insertError } = await supabase
                     .from('appointments')
                     .insert([{
                            patient_id: req.user.id,
                            doctor_id: appointment.doctor_id,
                            appointment_date: new_date,
                            time_slot: new_time_slot,
                            notes: appointment.notes,
                            status: 'pending',
                            rescheduled_from: id
                     }])
                     .select()
                     .single();

              if (insertError) throw insertError;

              // 5. Update original appointment
              await supabase
                     .from('appointments')
                     .update({
                            status: 'cancelled',
                            cancelled_reason: 'rescheduled',
                            is_rescheduled: true
                     })
                     .eq('id', id);

              // 6. Schedule reminders for new appointment
              await scheduleReminders(newAppointment.id, new_date, new_time_slot);

              // 7. Notify doctor
              await createNotification(
                     appointment.doctor_id,
                     'Appointment Rescheduled',
                     `An appointment for ${appointment.appointment_date} has been rescheduled to ${new_date} at ${new_time_slot}.`,
                      'appointment_rescheduled',
                     newAppointment.id
              );

              res.status(200).json(newAppointment);
       } catch (error) {
              res.status(400).json({ error: error.message });
       }
};

// PATCH /api/appointments/:id/no-show (doctor only)
const flagNoShow = async (req, res) => {
       const { id } = req.params;

       try {
              const { data: appointment, error: getError } = await supabase
                     .from('appointments')
                     .select('*')
                     .eq('id', id)
                     .eq('doctor_id', req.user.id)
                     .single();

              if (getError || !appointment) {
                     return res.status(404).json({ error: 'Appointment not found' });
              }

              // Update as no-show
              const { data, error } = await supabase
                     .from('appointments')
                     .update({
                            no_show: true,
                            no_show_flagged_at: new Date().toISOString()
                     })
                     .eq('id', id)
                     .select()
                     .single();

              if (error) throw error;

              // Check patient's no-show count in last 90 days
              const ninetyDaysAgo = new Date();
              ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

              const { count, error: countError } = await supabase
                     .from('appointments')
                     .select('*', { count: 'exact', head: true })
                     .eq('patient_id', appointment.patient_id)
                     .eq('no_show', true)
                     .gte('no_show_flagged_at', ninetyDaysAgo.toISOString());

              if (count >= 3) {
                     await createNotification(
                            appointment.patient_id,
                            'Account Flagged: Multiple No-Shows',
                            'You have been flagged for 3 or more no-shows in the last 90 days. Please be mindful of your scheduled appointments.',
                            'warning'
                     );
              }

              res.status(200).json(data);
       } catch (error) {
              res.status(400).json({ error: error.message });
       }
};

// Internal Helper for Reminder Scheduling
const scheduleReminders = async (appointmentId, date, time) => {
    const appointmentTime = new Date(`${date}T${time}`);
    
    const reminders = [];
    
    // 24h reminder
    const send24h = new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000);
    if (send24h > new Date()) {
        reminders.push({
            appointment_id: appointmentId,
            reminder_type: '24h',
            send_at: send24h.toISOString(),
            channel: 'both'
        });
    }

    // 1h reminder
    const send1h = new Date(appointmentTime.getTime() - 1 * 60 * 60 * 1000);
    if (send1h > new Date()) {
        reminders.push({
            appointment_id: appointmentId,
            reminder_type: '1h',
            send_at: send1h.toISOString(),
            channel: 'both'
        });
    }

    if (reminders.length > 0) {
        await supabase.from('appointment_reminders').insert(reminders);
    }
};

module.exports = { 
    bookAppointment, 
    getPatientAppointments, 
    getDoctorAppointments, 
    updateStatus, 
    cancelAppointment,
    rescheduleAppointment,
    flagNoShow
};
