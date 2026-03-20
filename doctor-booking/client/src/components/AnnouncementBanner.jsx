import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { MegaphoneIcon, XMarkIcon, ExclamationTriangleIcon, InformationCircleIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { user } = useAuth();
  const { supabase } = useRealtime();
  const navigate = useNavigate();

  const fetchAnnouncements = async () => {
    if (!user) return;
    try {
      const response = await api.get('/announcements');
      // Filter out dismissed announcements from local storage for this session/user
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
      // Also add to local dismissed list to avoid refetching showing it again before state updates
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

  const getStyles = (type) => {
    switch (type) {
      case 'urgent':
        return {
          bg: 'bg-red-600',
          hover: 'hover:bg-red-700',
          icon: <ExclamationTriangleIcon className="h-5 w-5 text-white" />,
          label: 'URGENT'
        };
      case 'warning':
        return {
          bg: 'bg-amber-500',
          hover: 'hover:bg-amber-600',
          icon: <ExclamationTriangleIcon className="h-5 w-5 text-white" />,
          label: 'WARNING'
        };
      case 'maintenance':
        return {
          bg: 'bg-indigo-600',
          hover: 'hover:bg-indigo-700',
          icon: <RocketLaunchIcon className="h-5 w-5 text-white" />,
          label: 'MAINTENANCE'
        };
      default:
        return {
          bg: 'bg-primary-600',
          hover: 'hover:bg-primary-700',
          icon: <InformationCircleIcon className="h-5 w-5 text-white" />,
          label: 'ANNOUNCEMENT'
        };
    }
  };

  const styles = getStyles(current.type);

  return (
    <div className={`relative ${styles.bg} text-white px-4 py-3 shadow-md transition-all duration-300 animate-slide-down`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap">
        <div className="w-0 flex-1 flex items-center">
          <span className="flex p-2 rounded-lg bg-white/20">
            {styles.icon}
          </span>
          <p className="ml-3 font-medium truncate">
            <span className="md:hidden">[{styles.label}] {current.title}</span>
            <span className="hidden md:inline">
              <strong className="font-bold mr-2">{styles.label}:</strong>
              {current.title} — {current.content.substring(0, 100)}{current.content.length > 100 ? '...' : ''}
            </span>
          </p>
        </div>
        <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
          <button
            onClick={() => navigate('/announcements')}
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-100 transition-colors"
          >
            Learn more
          </button>
        </div>
        <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
          <button
            type="button"
            onClick={(e) => handleDismiss(e, current.id)}
            className="-mr-1 flex p-2 rounded-md hover:bg-white/20 focus:outline-none transition-colors"
          >
            <span className="sr-only">Dismiss</span>
            <XMarkIcon className="h-5 w-5 text-white" aria-hidden="true" />
          </button>
        </div>
      </div>
      {announcements.length > 1 && (
        <div className="flex justify-center space-x-2 mt-1">
          {announcements.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 w-1.5 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementBanner;
