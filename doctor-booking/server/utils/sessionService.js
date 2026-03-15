const uap = require('ua-parser-js');
const geoip = require('geoip-lite');
const crypto = require('crypto');
const supabase = require('../config/supabase');

const parseDeviceInfo = (userAgent) => {
    const parser = new uap(userAgent);
    const result = parser.getResult();
    
    let deviceType = result.device.type || 'desktop';
    if (!['desktop', 'mobile', 'tablet'].includes(deviceType)) {
        deviceType = 'unknown';
    }

    return {
        browser: `${result.browser.name} ${result.browser.version}`,
        os: `${result.os.name} ${result.os.version}`,
        deviceName: result.device.model || result.os.name || 'Unknown Device',
        deviceType: deviceType
    };
};

const getLocationFromIP = (ip) => {
    // For localhost/testing, geoip-lite might return null.
    if (ip === '::1' || ip === '127.0.0.1') return 'Localhost';
    
    const geo = geoip.lookup(ip);
    if (!geo) return 'Unknown Location';
    
    return `${geo.city}, ${geo.country}`;
};

const createSession = async (userId, req) => {
    const userAgent = req.headers['user-agent'];
    const ip = req.ip || req.connection.remoteAddress;
    
    const deviceInfo = parseDeviceInfo(userAgent);
    const location = getLocationFromIP(ip);
    const sessionToken = crypto.randomBytes(32).toString('hex');

    const { data, error } = await supabase
        .from('user_sessions')
        .insert([{
            user_id: userId,
            session_token: sessionToken,
            device_name: deviceInfo.deviceName,
            device_type: deviceInfo.deviceType,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            ip_address: ip,
            location: location,
            is_active: true
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

const updateSessionActivity = async (sessionToken) => {
    const { error } = await supabase
        .from('user_sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('session_token', sessionToken)
        .eq('is_active', true);

    if (error) console.error('Update session activity error:', error);
};

module.exports = {
    parseDeviceInfo,
    getLocationFromIP,
    createSession,
    updateSessionActivity
};
