const supabase = require('../config/supabase');

const getSessions = async (req, res) => {
    try {
        const { data: sessions, error } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('user_id', req.user.id)
            .eq('is_active', true)
            .order('last_active_at', { ascending: false });

        if (error) throw error;

        const formattedSessions = sessions.map(s => ({
            ...s,
            isCurrent: s.session_token === req.sessionToken
        }));

        res.status(200).json(formattedSessions);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const revokeSession = async (req, res) => {
    const { id } = req.params;
    
    try {
        // 1. Check if it's the current session
        const { data: session, error: getError } = await supabase
            .from('user_sessions')
            .select('session_token')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (getError || !session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (session.session_token === req.sessionToken) {
            return res.status(400).json({ error: 'Cannot revoke current session. Use logout instead.' });
        }

        // 2. Revoke
        const { error } = await supabase
            .from('user_sessions')
            .update({ is_active: false })
            .eq('id', id)
            .eq('user_id', req.user.id);

        if (error) throw error;

        res.status(200).json({ message: 'Session revoked successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const revokeAllOthers = async (req, res) => {
    try {
        const { error } = await supabase
            .from('user_sessions')
            .update({ is_active: false })
            .eq('user_id', req.user.id)
            .neq('session_token', req.sessionToken);

        if (error) throw error;

        res.status(200).json({ message: 'All other sessions revoked successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getSessions,
    revokeSession,
    revokeAllOthers
};
