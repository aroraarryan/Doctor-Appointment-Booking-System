import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { user } = useAuth();
  const { supabase } = useRealtime();

  const fetchAnnouncements = async () => {
    if (!user) return;
    try {
      const response = await api.get('/announcements');
      const dismissedIds = JSON.parse(localStorage.getItem(`dismissed_announcements_${user.id}`) || '[]');
      const active = response.data.filter(a => !a.is_read && !dismissedIds.includes(a.id));
      setAnnouncements(active);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [user]);

  useEffect(() => {
    if (!supabase || !user) return;

    const channel = supabase
      .channel('announcements_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        fetchAnnouncements();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user]);

  const handleDismiss = async (e, id) => {
    e.stopPropagation();
    try {
      await api.patch(`/announcements/${id}/read`);
      const dismissedIds = JSON.parse(localStorage.getItem(`dismissed_announcements_${user.id}`) || '[]');
      localStorage.setItem(`dismissed_announcements_${user.id}`, JSON.stringify([...dismissedIds, id]));
      
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      if (currentIndex >= announcements.length - 1) {
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Error dismissing announcement:', error);
    }
  };

  if (!user || announcements.length === 0) return null;

  const current = announcements[currentIndex];

  const getStyle = (type) => {
    switch (type) {
      case 'urgent': return 'bg-[#D94F33] text-cream'; // A more muted deep red
      case 'warning': return 'bg-accent-lime text-forest';
      default: return 'bg-forest text-cream';
    }
  };

  return (
    <div className={`${getStyle(current.type)} px-6 py-2.5 text-center relative overflow-hidden transition-all duration-500`}>
      <div className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-[0.3em]">
        <span className="opacity-50">[{current.type}]</span>
        <span className="max-w-screen-md truncate">{current.title} — {current.content}</span>
        <button onClick={(e) => handleDismiss(e, current.id)} className="opacity-40 hover:opacity-100 transition-opacity ml-4 leading-none">✕</button>
      </div>
      
      {announcements.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-1.5">
          {announcements.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-0.5 transition-all ${idx === currentIndex ? 'bg-current w-4' : 'bg-current/20 w-2'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementBanner;
