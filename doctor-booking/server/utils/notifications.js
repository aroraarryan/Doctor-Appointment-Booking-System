const supabase = require('../config/supabase');

/**
 * Creates a notification for a user.
 * @param {string} userId - The ID of the user to notify.
 * @param {string} title - The title of the notification.
 * @param {string} message - The notification message.
 * @param {string} type - The type of notification.
 * @param {string} relatedId - Optional ID of the related object (e.g., appointment_id).
 */
const createNotification = async (userId, title, message, type, relatedId = null) => {
       try {
              const { error } = await supabase
                     .from('notifications')
                     .insert([
                            {
                                   user_id: userId,
                                   title,
                                   message,
                                   type,
                                   related_id: relatedId,
                                   is_read: false
                            }
                     ]);

              if (error) {
                     console.error('Error creating notification:', error);
                     return { success: false, error };
              }

              return { success: true };
       } catch (error) {
              console.error('Notification system error:', error);
              return { success: false, error };
       }
};

module.exports = { createNotification };
