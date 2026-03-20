const supabase = require('../config/supabase');

// POST /api/insurance/claim
const createClaim = async (req, res) => {
    try {
        const { error } = await supabase
            .from('insurance_claims')
            .insert([{ ...req.body, patient_id: req.user.id }]);

        if (error) throw error;
        res.status(201).json({ message: 'Insurance claim submitted successfully' });
    } catch (error) {
        console.error('Create Claim Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET /api/insurance/my
const getMyClaims = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('insurance_claims')
            .select('*, appointment:appointments(appointment_date, time_slot)')
            .eq('patient_id', req.user.id)
            .order('submitted_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        console.error('Get My Claims Error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createClaim,
    getMyClaims
};
