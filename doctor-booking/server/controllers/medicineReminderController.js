const supabase = require('../config/supabase');
const { createNotification } = require('./notificationController'); // Assuming it's in notificationController or utils/notifications

// Helper to get today's day name
const getTodayDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
};

// POST /api/medicine-reminders
const createMedicineReminder = async (req, res) => {
    try {
        const patientId = req.user.id;
        const { 
            medicine_name, 
            dosage, 
            reminder_times, 
            days_of_week, 
            start_date, 
            end_date, 
            prescription_id 
        } = req.body;

        if (!medicine_name || !dosage || !reminder_times || !start_date || !end_date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data: reminder, error } = await supabase
            .from('medicine_reminders')
            .insert({
                patient_id: patientId,
                medicine_name,
                dosage,
                reminder_times,
                days_of_week: days_of_week || ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
                start_date,
                end_date,
                prescription_id: prescription_id || null
            })
            .select()
            .single();

        if (error) throw error;

        // In a real app, we'd schedule actual push/email notifications here.
        // For now, we rely on the frontend fetching "Today's Schedule".
        
        res.status(201).json(reminder);
    } catch (error) {
        console.error('createMedicineReminder Error:', error);
        res.status(400).json({ error: error.message });
    }
};

// GET /api/medicine-reminders (All active)
const getActiveReminders = async (req, res) => {
    try {
        const patientId = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('medicine_reminders')
            .select('*')
            .eq('patient_id', patientId)
            .eq('is_active', true)
            .lte('start_date', today)
            .gte('end_date', today);

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        console.error('getActiveReminders Error:', error);
        res.status(400).json({ error: error.message });
    }
};

// POST /api/medicine-reminders/:id/log
const logMedicineIntake = async (req, res) => {
    try {
        const patientId = req.user.id;
        const reminderId = req.params.id;
        const { status, scheduled_time, notes } = req.body;

        if (!status || !scheduled_time) {
            return res.status(400).json({ error: 'Status and scheduled_time are required' });
        }

        const { data, error } = await supabase
            .from('medicine_logs')
            .insert({
                reminder_id: reminderId,
                patient_id: patientId,
                scheduled_time,
                taken_at: status === 'taken' ? new Date().toISOString() : null,
                status,
                notes
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('logMedicineIntake Error:', error);
        res.status(400).json({ error: error.message });
    }
};

// GET /api/medicine-reminders/today
const getTodaySchedule = async (req, res) => {
    try {
        const patientId = req.user.id;
        const todayName = getTodayDayName();
        const todayDate = new Date().toISOString().split('T')[0];

        // 1. Get active reminders for today
        console.log(`Fetching today schedule for patient: ${patientId}`);
        const { data: reminders, error: remError } = await supabase
            .from('medicine_reminders')
            .select('*')
            .eq('patient_id', patientId)
            .eq('is_active', true)
            .lte('start_date', todayDate)
            .gte('end_date', todayDate);

        if (remError) {
            console.error('Reminders Fetch Error:', remError);
            throw remError;
        }

        // Filter reminders by day of week
        const filteredReminders = reminders.filter(r => r.days_of_week.includes(todayName));

        // 2. Get today's logs
        const { data: logs, error: logError } = await supabase
            .from('medicine_logs')
            .select('*')
            .eq('patient_id', patientId)
            .gte('scheduled_time', todayDate + 'T00:00:00Z')
            .lte('scheduled_time', todayDate + 'T23:59:59Z');

        if (logError) throw logError;

        // 3. Build schedule
        const schedule = [];
        filteredReminders.forEach(rem => {
            rem.reminder_times.forEach(time => {
                const scheduledTimeISO = `${todayDate}T${time}`;
                const log = logs.find(l => 
                    l.reminder_id === rem.id && 
                    new Date(l.scheduled_time).toTimeString().split(' ')[0].startsWith(time.substring(0, 5))
                );

                schedule.push({
                    id: rem.id,
                    medicine_name: rem.medicine_name,
                    dosage: rem.dosage,
                    scheduled_time: scheduledTimeISO,
                    display_time: time,
                    status: log ? log.status : (new Date(scheduledTimeISO) < new Date() ? 'missed' : 'pending'),
                    log_id: log ? log.id : null
                });
            });
        });

        // Sort by time
        schedule.sort((a, b) => a.display_time.localeCompare(b.display_time));

        // 4. Calculate adherence for last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: recentLogs, error: adherenceError } = await supabase
            .from('medicine_logs')
            .select('status')
            .eq('patient_id', patientId)
            .gte('scheduled_time', sevenDaysAgo.toISOString());

        if (adherenceError) throw adherenceError;

        const takenCount = recentLogs.filter(l => l.status === 'taken').length;
        const totalLogged = recentLogs.length;
        const adherenceRate = totalLogged > 0 ? Math.round((takenCount / totalLogged) * 100) : 100;

        res.status(200).json({ schedule, adherenceRate });
    } catch (error) {
        console.error('getTodaySchedule Error:', error);
        res.status(400).json({ error: error.message });
    }
};

// DELETE /api/medicine-reminders/:id (Deactivate)
const deactivateReminder = async (req, res) => {
    try {
        const patientId = req.user.id;
        const { id } = req.params;

        const { data, error } = await supabase
            .from('medicine_reminders')
            .update({ is_active: false })
            .eq('id', id)
            .eq('patient_id', patientId)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json({ message: 'Reminder deactivated', data });
    } catch (error) {
        console.error('deactivateReminder Error:', error);
        res.status(400).json({ error: error.message });
    }
};

// GET /api/medicine-reminders/adherence
const getAdherenceStats = async (req, res) => {
    try {
        const patientId = req.user.id;
        const { days = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        // Get all logs for the period
        const { data: logs, error } = await supabase
            .from('medicine_logs')
            .select('status, scheduled_time')
            .eq('patient_id', patientId)
            .gte('scheduled_time', startDate.toISOString());

        if (error) throw error;

        const takenCount = logs.filter(l => l.status === 'taken').length;
        const missedCount = logs.filter(l => l.status === 'missed').length;
        const totalLogged = logs.length;
        const adherenceRate = totalLogged > 0 ? Math.round((takenCount / totalLogged) * 100) : 100;

        // Group by day for a trend chart
        const dailyStats = logs.reduce((acc, log) => {
            const date = log.scheduled_time.split('T')[0];
            if (!acc[date]) acc[date] = { date, taken: 0, total: 0 };
            acc[date].total++;
            if (log.status === 'taken') acc[date].taken++;
            return acc;
        }, {});

        const trend = Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
            date: d.date,
            rate: Math.round((d.taken / d.total) * 100)
        }));

        res.status(200).json({
            adherenceRate,
            takenCount,
            missedCount,
            totalLogged,
            trend
        });
    } catch (error) {
        console.error('getAdherenceStats Error:', error);
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    createMedicineReminder,
    getActiveReminders,
    logMedicineIntake,
    getTodaySchedule,
    getAdherenceStats,
    deactivateReminder
};
