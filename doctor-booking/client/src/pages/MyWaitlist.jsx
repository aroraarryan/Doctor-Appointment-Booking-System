import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

const MyWaitlist = () => {
    const [waitlist, setWaitlist] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWaitlist = async () => {
            try {
                const { data } = await api.get('/waitlist/my');
                setWaitlist(data);
            } catch (error) {
                console.error('Fetch waitlist error:', error);
                toast.error('Failed to load waitlist');
            } finally {
                setLoading(false);
            }
        };
        fetchWaitlist();
    }, []);

    const handleLeaveWaitlist = async (id) => {
        if (!window.confirm('Are you sure you want to leave this waitlist?')) return;
        
        try {
            await api.delete(`/waitlist/${id}`);
            setWaitlist(waitlist.filter(item => item.id !== id));
            toast.success('Left waitlist successfully');
        } catch (error) {
            toast.error('Failed to leave waitlist');
        }
    };

    if (loading) return (
        <div className="max-w-4xl mx-auto py-20 text-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">Loading your waitlists...</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">My Waitlists</h1>
                    <p className="text-gray-500 mt-1">Track your position for specialized slots.</p>
                </div>
            </div>

            {waitlist.length > 0 ? (
                <div className="grid gap-6">
                    {waitlist.map((item) => (
                        <div key={item.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6 group hover:border-indigo-100 transition-all">
                            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-extrabold text-2xl">
                                #{item.position}
                            </div>
                            
                            <div className="flex-1 space-y-1 text-center md:text-left">
                                <h3 className="text-xl font-bold text-gray-900">Dr. {item.doctor_name}</h3>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-500 font-medium">
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        {item.preferred_date}
                                    </span>
                                    <span className="flex items-center gap-1 uppercase tracking-wider text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                                        {item.status}
                                    </span>
                                    {item.priority > 0 && (
                                        <span className="flex items-center gap-1 uppercase tracking-wider text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">
                                            URGENT
                                        </span>
                                    )}
                                </div>
                                {item.notes && (
                                    <p className="text-xs text-gray-400 italic mt-2">"{item.notes}"</p>
                                )}
                            </div>

                            <button
                                onClick={() => handleLeaveWaitlist(item.id)}
                                className="px-6 py-3 rounded-2xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all active:scale-95"
                            >
                                Leave Waitlist
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-400 font-display">No active waitlists</h3>
                    <p className="text-gray-400 mt-2 max-w-xs mx-auto">You're not currently waiting for any appointments. Join a waitlist from a specialist's profile if they're fully booked.</p>
                </div>
            )}
        </div>
    );
};

export default MyWaitlist;
