const supabase = require('../config/supabase');

// GET /api/earnings/stats
const getEarningsStats = async (req, res) => {
    const doctorId = req.user.id;

    try {
        const { data: earnings, error } = await supabase
            .from('doctor_earnings')
            .select('*')
            .eq('doctor_id', doctorId);

        if (error) throw error;

        const totalGross = earnings.reduce((sum, e) => sum + Number(e.gross_amount), 0);
        const totalNet = earnings.reduce((sum, e) => sum + Number(e.net_amount), 0);
        const pending = earnings.filter(e => e.status === 'pending').reduce((sum, e) => sum + Number(e.net_amount), 0);
        const available = earnings.filter(e => e.status === 'available').reduce((sum, e) => sum + Number(e.net_amount), 0);

        res.status(200).json({
            total_gross: totalGross,
            total_net: totalNet,
            pending_payout: pending,
            available_payout: available,
            history: earnings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        });
    } catch (error) {
        console.error('Earnings Stats Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// POST /api/earnings/withdraw (Mock)
const withdrawEarnings = async (req, res) => {
    const doctorId = req.user.id;
    try {
        const { error } = await supabase
            .from('doctor_earnings')
            .update({ status: 'withdrawn' })
            .eq('doctor_id', doctorId)
            .eq('status', 'available');

        if (error) throw error;
        res.status(200).json({ message: 'Withdrawal request initiated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getEarningsStats, withdrawEarnings };
