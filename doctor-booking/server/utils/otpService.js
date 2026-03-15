const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const createOTP = async (userId, email, type) => {
    const plainOTP = generateOTP();
    // In many cases, we don't hash short-lived 6-digit OTPs because the entropy is low, 
    // but the requirement asks for hashing with bcrypt.
    const hashedOTP = await bcrypt.hash(plainOTP, 10);
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const { error } = await supabase
        .from('otp_verifications')
        .insert([{
            user_id: userId,
            email,
            otp_code: hashedOTP,
            otp_type: type,
            expires_at: expiresAt,
        }]);

    if (error) throw error;
    
    return plainOTP;
};

const verifyOTP = async (userId, plainOTP, type) => {
    const { data: otps, error } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('user_id', userId)
        .eq('otp_type', type)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) throw error;
    if (!otps || otps.length === 0) {
        return { valid: false, message: 'OTP expired or not found' };
    }

    const otpRecord = otps[0];

    if (otpRecord.attempts >= 3) {
        // Invalidate all OTPs for this user
        await supabase
            .from('otp_verifications')
            .update({ is_used: true })
            .eq('user_id', userId);
        return { valid: false, message: 'Max attempts exceeded. Please request a new OTP.', maxAttempts: true };
    }

    const isValid = await bcrypt.compare(plainOTP, otpRecord.otp_code);

    if (isValid) {
        await supabase
            .from('otp_verifications')
            .update({ is_used: true })
            .eq('id', otpRecord.id);
        return { valid: true, message: 'OTP verified successfully' };
    } else {
        const newAttempts = otpRecord.attempts + 1;
        await supabase
            .from('otp_verifications')
            .update({ attempts: newAttempts })
            .eq('id', otpRecord.id);
            
        return { 
            valid: false, 
            message: 'Invalid OTP', 
            attemptsRemaining: 3 - newAttempts 
        };
    }
};

module.exports = {
    generateOTP,
    createOTP,
    verifyOTP
};
