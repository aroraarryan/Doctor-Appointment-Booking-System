import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

const RealtimeContext = createContext();

export const RealtimeProvider = ({ children }) => {
       const { user } = useAuth();
       const [notifications, setNotifications] = useState([]);
       const [unreadCount, setUnreadCount] = useState(0);
       const [latestMessage, setLatestMessage] = useState(null);

       const fetchNotifications = useCallback(async () => {
              if (!user) return;
              try {
                     const { data } = await api.get('/notifications');
                     setNotifications(data);
              } catch (error) {
                     console.error('Error fetching notifications:', error);
              }
       }, [user]);

       const fetchUnreadCount = useCallback(async () => {
              if (!user) return;
              try {
                     const { data } = await api.get('/notifications/unread-count');
                     setUnreadCount(data.unreadCount);
              } catch (error) {
                     console.error('Error fetching unread count:', error);
              }
       }, [user]);

       const markAsRead = async (id) => {
              try {
                     await api.patch(`/notifications/${id}/read`);
                     setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
                     setUnreadCount(prev => Math.max(0, prev - 1));
              } catch (error) {
                     console.error('Error marking notification as read:', error);
              }
       };

       const markAllAsRead = async () => {
              try {
                     await api.patch('/notifications/read-all');
                     setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                     setUnreadCount(0);
              } catch (error) {
                     console.error('Error marking all as read:', error);
              }
       };

       useEffect(() => {
              if (!user) {
                     setNotifications([]);
                     setUnreadCount(0);
                     return;
              }

              fetchNotifications();
              fetchUnreadCount();

              // Subscribe to notifications
              const notificationChannel = supabase
                     .channel(`public:notifications:user_id=eq.${user.id}`)
                     .on(
                            'postgres_changes',
                            {
                                   event: 'INSERT',
                                   schema: 'public',
                                   table: 'notifications',
                                   filter: `user_id=eq.${user.id}`
                            },
                            (payload) => {
                                   setNotifications(prev => [payload.new, ...prev].slice(0, 20));
                                   setUnreadCount(prev => prev + 1);
                                   toast.success(payload.new.title || 'New Notification', {
                                          duration: 4000,
                                          icon: '🔔'
                                   });
                                   console.log('New notification received:', payload.new);
                            }
                     )
                     .subscribe();

              // Subscribe to messages for real-time chat updates
              const messageChannel = supabase
                     .channel(`public:messages:receiver_id=eq.${user.id}`)
                     .on(
                            'postgres_changes',
                            {
                                   event: 'INSERT',
                                   schema: 'public',
                                   table: 'messages',
                                   filter: `receiver_id=eq.${user.id}`
                            },
                            (payload) => {
                                   setLatestMessage(payload.new);
                                   if (window.location.pathname !== '/messages') {
                                          toast('New message received!', {
                                                 icon: '💬',
                                                 duration: 4000
                                          });
                                   }
                                   console.log('New message received:', payload.new);
                            }
                     )
                     .subscribe();

              return () => {
                     supabase.removeChannel(notificationChannel);
                     supabase.removeChannel(messageChannel);
              };
       }, [user, fetchNotifications, fetchUnreadCount]);

       return (
              <RealtimeContext.Provider value={{
                     notifications,
                     unreadCount,
                     latestMessage,
                     markAsRead,
                     markAllAsRead,
                     fetchNotifications
              }}>
                     {children}
              </RealtimeContext.Provider>
       );
};

export const useRealtime = () => useContext(RealtimeContext);
