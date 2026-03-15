const supabase = require('../config/supabase');
const { createOTP, verifyOTP } = require('../utils/otpService');
const { sendOTPEmail } = require('../utils/emailService');

const enable2FA = async (req, res) => {
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('email, name')
            .eq('id', req.user.id)
            .single();

        const otp = await createOTP(req.user.id, profile.email, 'login'); // Using 'login' type for simplicity
        await sendOTPEmail(profile.email, otp, profile.name);

        res.status(200).json({ message: 'OTP sent to your email' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const confirmEnable2FA = async (req, res) => {
    const { otp } = req.body;
    
    try {
        const result = await verifyOTP(req.user.id, otp, 'login');
        if (!result.valid) {
            return res.status(401).json({ error: result.message });
        }

        const { error } = await supabase
            .from('profiles')
            .update({ two_fa_enabled: true })
            .eq('id', req.user.id);

        if (error) throw error;

        res.status(200).json({ message: 'Two-factor authentication enabled successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const disable2FA = async (req, res) => {
    const { otp } = req.body;

    try {
        const result = await verifyOTP(req.user.id, otp, 'login');
        if (!result.valid) {
            return res.status(401).json({ error: result.message });
        }

        const { error } = await supabase
            .from('profiles')
            .update({ two_fa_enabled: false })
            .eq('id', req.user.id);

        if (error) throw error;

        res.status(200).json({ message: 'Two-factor authentication disabled successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    enable2FA,
    confirmEnable2FA,
    disable2FA
};
