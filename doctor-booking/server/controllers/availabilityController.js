const supabase = require('../config/supabase');

// GET /api/availability/:doctorId?date=YYYY-MM-DD
const getSlots = async (req, res) => {
       const { doctorId } = req.params;
       const { date } = req.query;

       if (!date) {
              return res.status(400).json({ error: 'Date is required' });
       }

       try {
              const { data, error } = await supabase.rpc('get_available_slots', {
                     p_doctor_id: doctorId,
                     p_date: date
              });

              if (error) throw error;

              res.status(200).json(data.map(d => d.slot_time));
       } catch (error) {
              console.error('getSlots Error:', error);
              res.status(400).json({ error: error.message });
       }
};

// PUT /api/availability - set weekly schedule
const setAvailability = async (req, res) => {
       const { schedule } = req.body; // Array of { day_of_week, start_time, end_time, slot_duration_mins }

       if (!schedule || !Array.isArray(schedule)) {
              return res.status(400).json({ error: 'Schedule array is required' });
       }

       try {
              // Delete existing availability
              const { error: deleteError } = await supabase
                     .from('availability')
                     .delete()
                     .eq('doctor_id', req.user.id);

              if (deleteError) throw deleteError;

              // Insert new schedule
              const newSchedule = schedule.map(item => ({
                     ...item,
                     doctor_id: req.user.id
              }));

              const { error: insertError } = await supabase
                     .from('availability')
                     .insert(newSchedule);

              if (insertError) throw insertError;

              res.status(200).json({ message: 'Availability updated successfully' });
       } catch (error) {
              res.status(400).json({ error: error.message });
       }
};

module.exports = { getSlots, setAvailability };
