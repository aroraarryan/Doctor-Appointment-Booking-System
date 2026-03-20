const supabase = require('../config/supabase');

// POST /api/waitlist - join waitlist (patient only)
const joinWaitlist = async (req, res) => {
    const { doctorId, preferred_date, preferred_time_start, preferred_time_end, notes, priority = 0 } = req.body;

    if (!doctorId || !preferred_date || !preferred_time_start || !preferred_time_end) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // 1. Check if already on waitlist for this doctor/date
        const { data: existing, error: checkError } = await supabase
            .from('waitlist')
            .select('id')
            .eq('patient_id', req.user.id)
            .eq('doctor_id', doctorId)
            .eq('preferred_date', preferred_date)
            .eq('status', 'waiting')
            .maybeSingle();

        if (existing) {
            return res.status(400).json({ error: 'You are already on the waitlist for this doctor and date' });
        }

        // 2. Insert into waitlist
        const { data, error } = await supabase
            .from('waitlist')
            .insert([{
                patient_id: req.user.id,
                doctor_id: doctorId,
                preferred_date,
                preferred_time_start,
                preferred_time_end,
                notes,
                status: 'waiting',
                priority
            }])
            .select()
            .single();

        if (error) {
            console.error('Waitlist Insert Error:', error);
            throw error;
        }

        // 3. Get position in queue
        const { count, error: countError } = await supabase
            .from('waitlist')
            .select('*', { count: 'exact', head: true })
            .eq('doctor_id', doctorId)
            .eq('preferred_date', preferred_date)
            .eq('status', 'waiting')
            .lte('created_at', data.created_at);

        res.status(201).json({ 
            message: 'Added to waitlist', 
            data,
            position: count || 1
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// GET /api/waitlist/my - patient's waitlist
const getMyWaitlist = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('waitlist')
            .select(`
                *,
                doctor:doctor_id (
                    id,
                    specialty,
                    profile:profiles (name, avatar_url)
                )
            `)
            .eq('patient_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// GET /api/waitlist/doctor/:doctorId - doctor sees their waitlist
const getDoctorWaitlist = async (req, res) => {
    const { doctorId } = req.params;
    
    // Ensure doctor matches logged in user or is authorized
    if (req.user.role !== 'doctor' || req.user.id !== doctorId) {
        // Still allow admin or check if doctor is actually the doctor
        const { data: doctorProfile } = await supabase.from('doctors').select('id').eq('id', req.user.id).maybeSingle();
        if (!doctorProfile) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
    }

    try {
        const { data, error } = await supabase
            .from('waitlist')
            .select(`
                *,
                patient:patient_id (name, avatar_url, email)
            `)
            .eq('doctor_id', doctorId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// DELETE /api/waitlist/:id - leave waitlist
const leaveWaitlist = async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase
            .from('waitlist')
            .delete()
            .eq('id', id)
            .eq('patient_id', req.user.id);

        if (error) throw error;
        res.status(200).json({ message: 'Removed from waitlist' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    joinWaitlist,
    getMyWaitlist,
    getDoctorWaitlist,
    leaveWaitlist
};
