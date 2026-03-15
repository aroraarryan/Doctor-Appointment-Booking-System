const supabase = require('../config/supabase');

/**
 * Deletes expired OTP records from the database.
 * This helps prevent the otp_verifications table from growing indefinitely.
 */
const cleanupExpiredOTPs = async () => {
    try {
        console.log('[Cleanup] Starting expired OTP cleanup...');
        
        const now = new Date().toISOString();
        
        const { count, error } = await supabase
            .from('otp_verifications')
            .delete({ count: 'exact' })
            .lt('expires_at', now);

        if (error) {
            console.error('[Cleanup] Error cleaning up expired OTPs:', error);
            return;
        }

        console.log(`[Cleanup] Successfully removed ${count || 0} expired OTP records.`);
    } catch (error) {
        console.error('[Cleanup] Unexpected error during OTP cleanup:', error);
    }
};

/**
 * Initializes the cleanup service to run at a regular interval.
 * @param {number} intervalMs - Interval in milliseconds (default: 1 hour)
 */
const initCleanupService = (intervalMs = 3600000) => {
    // Run once on initialization
    cleanupExpiredOTPs();
    
    // Set up recurring interval
    setInterval(cleanupExpiredOTPs, intervalMs);
    
    console.log(`[Cleanup] Cleanup service initialized to run every ${intervalMs / 60000} minutes.`);
};

module.exports = { initCleanupService, cleanupExpiredOTPs };
