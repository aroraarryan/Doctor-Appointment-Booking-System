import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  MegaphoneIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  RocketLaunchIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('/announcements');
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/announcements/${id}/read`);
      setAnnouncements(prev => prev.map(ann => 
        ann.id === id ? { ...ann, is_read: true } : ann
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getAnnouncementIcon = (type) => {
    switch (type) {
      case 'urgent': return <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />;
      case 'warning': return <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />;
      case 'maintenance': return <RocketLaunchIcon className="h-6 w-6 text-indigo-500" />;
      default: return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <MegaphoneIcon className="h-8 w-8 mr-3 text-primary-600" />
            Announcements
          </h1>
          <p className="mt-2 text-gray-600">Stay updated with the latest news and alerts from our team.</p>
        </div>
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <CheckCircleIcon className="h-16 w-16 mx-auto text-gray-300" />
          <p className="mt-4 text-gray-500 text-lg">No active announcements at the moment.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {announcements.map((ann) => (
            <div 
              key={ann.id} 
              className={`bg-white rounded-xl shadow-sm border-l-4 p-6 transition-all hover:shadow-md ${
                ann.is_read ? 'border-gray-200 opacity-75' : 
                ann.type === 'urgent' ? 'border-red-500' :
                ann.type === 'warning' ? 'border-amber-500' :
                ann.type === 'maintenance' ? 'border-indigo-500' : 'border-primary-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${
                    ann.type === 'urgent' ? 'bg-red-50' :
                    ann.type === 'warning' ? 'bg-amber-50' :
                    ann.type === 'maintenance' ? 'bg-indigo-50' : 'bg-blue-50'
                  }`}>
                    {getAnnouncementIcon(ann.type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className={`text-xl font-bold ${ann.is_read ? 'text-gray-600' : 'text-gray-900'}`}>
                        {ann.title}
                      </h2>
                      {!ann.is_read && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          New
                        </span>
                      )}
                    </div>
                    <div className="flex items-center mt-1 text-sm text-gray-500 space-x-4">
                      <span className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {format(new Date(ann.created_at), 'MMM dd, yyyy p')}
                      </span>
                      {ann.type !== 'info' && (
                        <span className={`capitalize font-medium ${
                          ann.type === 'urgent' ? 'text-red-600' :
                          ann.type === 'warning' ? 'text-amber-600' : 'text-indigo-600'
                        }`}>
                          {ann.type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!ann.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(ann.id)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Mark as read
                  </button>
                )}
              </div>
              <div className="mt-4 text-gray-700 whitespace-pre-wrap leading-relaxed">
                {ann.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Announcements;
