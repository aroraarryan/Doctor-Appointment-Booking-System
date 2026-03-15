const supabase = require('../config/supabase');

// GET /api/notifications - get current user's notifications
const getNotifications = async (req, res) => {
       try {
              const { data, error } = await supabase
                     .from('notifications')
                     .select('*')
                     .eq('user_id', req.user.id)
                     .order('created_at', { ascending: false })
                     .limit(20);

              if (error) throw error;

              res.status(200).json(data);
       } catch (error) {
              res.status(400).json({ error: error.message });
       }
};

// PATCH /api/notifications/:id/read - mark one as read
const markAsRead = async (req, res) => {
       const { id } = req.params;
       try {
              const { data, error } = await supabase
                     .from('notifications')
                     .update({ is_read: true })
                     .eq('id', id)
                     .eq('user_id', req.user.id)
                     .select()
                     .single();

              if (error) throw error;

              res.status(200).json(data);
       } catch (error) {
              res.status(400).json({ error: error.message });
       }
};

// PATCH /api/notifications/read-all - mark all as read
const markAllAsRead = async (req, res) => {
       try {
              const { data, error } = await supabase
                     .from('notifications')
                     .update({ is_read: true })
                     .eq('user_id', req.user.id)
                     .eq('is_read', false)
                     .select();

              if (error) throw error;

              res.status(200).json({ message: 'All notifications marked as read', count: data.length });
       } catch (error) {
              res.status(400).json({ error: error.message });
       }
};

// GET /api/notifications/unread-count - get count of unread
const getUnreadCount = async (req, res) => {
       try {
              const { count, error } = await supabase
                     .from('notifications')
                     .select('*', { count: 'exact', head: true })
                     .eq('user_id', req.user.id)
                     .eq('is_read', false);

              if (error) throw error;

              res.status(200).json({ unreadCount: count || 0 });
       } catch (error) {
              res.status(400).json({ error: error.message });
       }
};

module.exports = {
       getNotifications,
       markAsRead,
       markAllAsRead,
       getUnreadCount
};
