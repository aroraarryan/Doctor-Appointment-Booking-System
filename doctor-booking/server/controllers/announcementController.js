const supabase = require('../config/supabase');

// POST /api/announcements (Admin only)
const createAnnouncement = async (req, res) => {
    const { title, content, type, target_role, expires_at } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }

    try {
        // 1. Insert announcement
        const { data: announcement, error: createError } = await supabase
            .from('announcements')
            .insert([{
                title,
                content,
                type: type || 'info',
                target_role: target_role || 'all',
                expires_at,
                created_by: req.user.id
            }])
            .select()
            .single();

        if (createError) throw createError;

        // 2. Send in-app notifications to target users
        let query = supabase.from('profiles').select('id');
        if (target_role !== 'all') {
            query = query.eq('role', target_role);
        }

        const { data: users, error: userError } = await query;
        if (!userError && users.length > 0) {
            const notifications = users.map(user => ({
                user_id: user.id,
                title: `New Announcement: ${title}`,
                message: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                type: 'appointment_booked' // Using existing type for now as placeholder
            }));

            // Bulk insert notifications (Supabase handles up to 1000 at once well)
            await supabase.from('notifications').insert(notifications);
        }

        res.status(201).json(announcement);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// GET /api/announcements
const getAnnouncements = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('announcements')
            .select(`
                *,
                announcement_reads!left(user_id)
            `)
            .eq('is_active', true)
            .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
            .or(`target_role.eq.all,target_role.eq.${req.user.role}`)
            .order('type', { ascending: false }) // Urgent/urgent first? Depends on alphabetical order but urgent > info
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Add is_read flag
        const formattedAnnouncements = data.map(ann => ({
            ...ann,
            is_read: ann.announcement_reads.some(read => read.user_id === req.user.id)
        }));

        res.status(200).json(formattedAnnouncements);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// PATCH /api/announcements/:id/read
const markAsRead = async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .from('announcement_reads')
            .upsert([{
                announcement_id: id,
                user_id: req.user.id
            }], { onConflict: 'announcement_id,user_id' });

        if (error) throw error;
        res.status(200).json({ message: 'Marked as read' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// PATCH /api/announcements/:id (Admin only)
const updateAnnouncement = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const { data, error } = await supabase
            .from('announcements')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// DELETE /api/announcements/:id (Admin only)
const deleteAnnouncement = async (req, res) => {
    const { id } = req.params;
    try {
        // Soft delete
        const { data, error } = await supabase
            .from('announcements')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;
        res.status(200).json({ message: 'Announcement deactivated' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    createAnnouncement,
    getAnnouncements,
    markAsRead,
    updateAnnouncement,
    deleteAnnouncement
};
