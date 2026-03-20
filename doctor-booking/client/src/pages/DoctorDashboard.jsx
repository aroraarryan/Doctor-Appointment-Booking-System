import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import AvatarUpload from '../components/AvatarUpload';
import MedicalRecordsList from '../components/MedicalRecordsList';
import SkeletonCard from '../components/SkeletonCard';
import PrescriptionForm from '../components/PrescriptionForm';
import DoctorVerificationUpload from '../components/DoctorVerificationUpload';

const DoctorDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [verifications, setVerifications] = useState([]);
    const [activeTab, setActiveTab] = useState('active'); // 'active', 'pending', 'history'
    const [schedule, setSchedule] = useState({
        Monday: { enabled: false, start: '09:00', end: '17:00' },
        Tuesday: { enabled: false, start: '09:00', end: '17:00' },
        Wednesday: { enabled: false, start: '09:00', end: '17:00' },
        Thursday: { enabled: false, start: '09:00', end: '17:00' },
        Friday: { enabled: false, start: '09:00', end: '17:00' },
        Saturday: { enabled: false, start: '09:00', end: '17:00' },
        Sunday: { enabled: false, start: '09:00', end: '17:00' },
    });

    const [profile, setProfile] = useState({
        specialty: user?.doctorDetails?.specialty || '',
        experience: user?.doctorDetails?.experience || 0,
        fees: user?.doctorDetails?.fees || 0,
        bio: user?.doctorDetails?.bio || '',
        buffer_time_mins: user?.doctorDetails?.buffer_time_mins || 0,
        cancellation_policy_hours: user?.doctorDetails?.cancellation_policy_hours || 24
    });

    const [stats, setStats] = useState({
        totalRevenue: 0,
        pendingCount: 0,
        todayCount: 0,
        avgRating: 4.8
    });

    const [saving, setSaving] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [confirmActionId, setConfirmActionId] = useState(null);

    const fetchData = async () => {
        try {
            const [appRes, recRes, verRes] = await Promise.all([
                api.get('/appointments/doctor'),
                api.get('/upload/medical-records'),
                api.get('/verification/my-status')
            ]);
            setAppointments(appRes.data);
            setRecords(recRes.data);
            setVerifications(verRes.data);

            // Calculate Stats
            const today = new Date().toISOString().split('T')[0];
            const summary = appRes.data.reduce((acc, app) => {
                if (app.payment_status === 'paid') acc.totalRevenue += app.fees || 0;
                if (app.status === 'pending') acc.pendingCount += 1;
                if (app.appointment_date === today && app.status !== 'cancelled') acc.todayCount += 1;
                return acc;
            }, { totalRevenue: 0, pendingCount: 0, todayCount: 0 });

            setStats(prev => ({ ...prev, ...summary }));
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleStatusChange = async (id, status) => {
        try {
            await api.patch(`/appointments/${id}/status`, { status });
            setAppointments(appointments.map(a => a.id === id ? { ...a, status } : a));
            toast.success(`Appointment ${status}`);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const saveAvailability = async () => {
        setSaving(true);
        try {
            const formattedSchedule = Object.entries(schedule)
                .filter(([_, data]) => data.enabled)
                .map(([day, data]) => ({
                    day_of_week: day,
                    start_time: data.start,
                    end_time: data.end,
                    slot_duration_mins: 30
                }));

            await api.put('/availability', { schedule: formattedSchedule });
            toast.success('Availability updated!');
        } catch (error) {
            toast.error('Failed to save availability');
        } finally {
            setSaving(false);
        }
    };

    const saveProfile = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            await api.put('/doctors/profile', profile);
            toast.success('Profile updated!');
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleHideAppointment = async (id) => {
        setConfirmActionId(null);
        try {
            await api.patch(`/appointments/${id}/hide`);
            setAppointments(prev => prev.filter(a => a.id !== id));
            toast.success('Appointment hidden from view');
        } catch (error) {
            console.error('Error hiding appointment:', error);
            toast.error(error.response?.data?.error || 'Failed to hide appointment');
        }
    };

    const handleNoShow = async (appointmentId) => {
        if (window.confirm('Are you sure you want to flag this patient as a no-show?')) {
            try {
                await api.patch(`/appointments/${appointmentId}/no-show`);
                toast.success('Patient flagged as no-show.');
                fetchData();
            } catch (error) {
                toast.error('Failed to flag no-show.');
            }
        }
    };

    const handleScheduleChange = (day, field, value) => {
        setSchedule({
            ...schedule,
            [day]: { ...schedule[day], [field]: value }
        });
    };

    const getDocStatus = (type) => {
        const found = verifications.find(v => v.document_type === type);
        return found ? found.status : null;
    };

    const filteredAppointments = appointments.filter(app => {
        if (activeTab === 'active') return app.status === 'confirmed';
        if (activeTab === 'pending') return app.status === 'pending';
        if (activeTab === 'history') return ['completed', 'cancelled', 'no-show'].includes(app.status);
        return true;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4">
            {/* Header / Identity */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-10">
                <div className="flex items-center gap-8">
                    <div className="relative group">
                        <AvatarUpload
                            currentAvatar={user?.avatar_url}
                            onUploadSuccess={() => window.location.reload()}
                        />
                        {user?.doctorDetails?.is_verified && (
                            <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full border-4 border-white shadow-lg">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                            Dr. {user?.name}
                            {user?.doctorDetails?.is_verified && (
                                <span className="text-blue-500 text-[10px] font-black bg-blue-50 px-3 py-1 rounded-full border border-blue-100 uppercase tracking-widest">Verified</span>
                            )}
                        </h1>
                        <p className="text-gray-500 font-bold text-lg mt-1">{profile.specialty || 'General Practitioner'} • {profile.experience || 0} Years Experience</p>
                    </div>
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                    <button onClick={() => navigate('/security')} className="bg-white text-gray-600 border-2 border-gray-100 px-6 py-3 rounded-2xl font-black hover:bg-gray-50 transition-all text-xs uppercase tracking-widest">Security</button>
                    <button onClick={() => navigate('/payments/history')} className="bg-white text-indigo-600 border-2 border-indigo-100 px-6 py-3 rounded-2xl font-black hover:bg-indigo-50 transition-all text-xs uppercase tracking-widest">Income</button>
                    <div className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${user?.doctorDetails?.is_approved ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                        <div className={`w-2 h-2 rounded-full ${user?.doctorDetails?.is_approved ? 'bg-green-500' : 'bg-yellow-400'} animate-pulse`}></div>
                        {user?.doctorDetails?.is_approved ? 'Active' : 'Pending'}
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Revenue', value: `₹${stats.totalRevenue}`, icon: '💰', color: 'from-green-50 to-emerald-50', textColor: 'text-green-700' },
                    { label: 'Pending Requests', value: stats.pendingCount, icon: '⏳', color: 'from-orange-50 to-amber-50', textColor: 'text-orange-700' },
                    { label: "Today's Visits", value: stats.todayCount, icon: '📅', color: 'from-blue-50 to-indigo-50', textColor: 'text-blue-700' },
                    { label: 'Success Rate', value: '98%', icon: '📈', color: 'from-purple-50 to-fuchsia-50', textColor: 'text-purple-700' },
                ].map((s, i) => (
                    <div key={i} className={`bg-gradient-to-br ${s.color} p-8 rounded-[2rem] border border-white shadow-sm hover:shadow-md transition-all group`}>
                        <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{s.icon}</div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
                        <p className={`text-3xl font-black ${s.textColor} mt-1`}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-10">
                    {/* Professional Verification Banner */}
                    {!user?.doctorDetails?.is_verified && (
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl shadow-blue-100">
                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <h3 className="text-xl font-black mb-2">Complete Your Profile</h3>
                                    <p className="text-blue-100 text-sm font-bold max-w-md">Verify your credentials to increase visibility and gain patient trust with a verification badge.</p>
                                </div>
                                <button 
                                    onClick={() => document.getElementById('verification-section')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="bg-white text-blue-600 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all"
                                >
                                    Verify Now
                                </button>
                            </div>
                            <div className="absolute top-0 right-0 -mr-10 -mt-10 opacity-10">
                                <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            </div>
                        </div>
                    )}

                    {/* Main Appointments Section */}
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-2">
                             <div className="flex gap-8">
                                    {['active', 'pending', 'history'].map((tab) => (
                                           <button
                                                  key={tab}
                                                  onClick={() => setActiveTab(tab)}
                                                  className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                           >
                                                  {tab}
                                                  {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-full" />}
                                           </button>
                                    ))}
                             </div>
                             <button onClick={fetchData} className="p-2 hover:bg-gray-100 rounded-full transition-colors self-end md:self-auto text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                             </button>
                        </div>

                        <div className="grid gap-6">
                            {loading ? (
                                <SkeletonCard count={3} />
                            ) : filteredAppointments.length > 0 ? (
                                filteredAppointments.map(app => (
                                    <div key={app.id} className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-6 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 group">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center font-black text-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                                    {app.patient.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-black text-gray-900 text-xl">{app.patient.name}</h3>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    const { data } = await api.post('/messages/conversation', { participantId: app.patient_id });
                                                                    window.location.href = `/messages?convId=${data.id}`;
                                                                } catch (error) {
                                                                    toast.error('Error starting conversation');
                                                                }
                                                            }}
                                                            className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
                                                        >
                                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg">{app.appointment_date}</span>
                                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-lg">{app.time_slot.substring(0, 5)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3">
                                                <select
                                                    value={app.status}
                                                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                                    className="text-[10px] font-black uppercase tracking-widest border-2 border-gray-100 rounded-xl px-4 py-2 bg-white hover:border-indigo-200 outline-none transition-all"
                                                >
                                                    <option value="pending">Request</option>
                                                    <option value="confirmed">Confirmed</option>
                                                    <option value="cancelled">Cancelled</option>
                                                    <option value="completed">Finished</option>
                                                </select>
                                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${app.payment_status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{app.payment_status}</span>
                                                
                                                {(app.status === 'confirmed' || app.status === 'completed') && (
                                                    <button
                                                        onClick={() => { setSelectedAppointment(app); setShowPrescriptionModal(true); }}
                                                        className="flex items-center gap-2 text-[10px] font-black text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-100 transition-all uppercase tracking-widest"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        Prescribe
                                                    </button>
                                                )}

                                                {activeTab === 'history' && (
                                                    <div className="relative">
                                                        {confirmActionId === app.id ? (
                                                            <div className="flex items-center gap-2 bg-red-50 p-1.5 rounded-xl border border-red-100 animate-in fade-in zoom-in duration-200">
                                                                <button
                                                                    onClick={() => handleHideAppointment(app.id)}
                                                                    className="px-3 py-1 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-600 transition-all shadow-md shadow-red-100"
                                                                >
                                                                    OK
                                                                </button>
                                                                <button
                                                                    onClick={() => setConfirmActionId(null)}
                                                                    className="px-3 py-1 bg-white text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-gray-100 hover:bg-gray-50 transition-all"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setConfirmActionId(app.id);
                                                                }}
                                                                className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all border-2 border-transparent hover:border-red-100 flex items-center justify-center group/del"
                                                                title="Hide from history"
                                                            >
                                                                <svg className="w-4 h-4 group-hover/del:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Case History Section */}
                                        <div className="pt-6 border-t border-gray-50 bg-gray-50/30 -mx-6 md:-mx-8 px-6 md:px-8 rounded-b-[2rem]">
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Medical Records</p>
                                                {!app.no_show && app.status === 'confirmed' && (
                                                    <button onClick={() => handleNoShow(app.id)} className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest">Mark Absent</button>
                                                )}
                                            </div>
                                            <MedicalRecordsList
                                                records={records.filter(r => r.appointment_id === app.id)}
                                                canDelete={false}
                                                onRefresh={fetchData}
                                            />
                                            {records.filter(r => r.appointment_id === app.id).length === 0 && (
                                                <p className="text-xs font-bold text-gray-400 italic py-4">No records shared for this session.</p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white p-20 text-center rounded-[2.5rem] border-2 border-dashed border-gray-100">
                                    <div className="text-4xl mb-4">📭</div>
                                    <h3 className="text-xl font-black text-gray-900 capitalize">{activeTab} List Empty</h3>
                                    <p className="text-gray-400 mt-2 font-bold">No appointments found in this category.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Professional Verification Details Section */}
                    <div id="verification-section" className="space-y-6">
                        <h2 className="text-2xl font-black text-gray-900">Verification Center</h2>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                            <DoctorVerificationUpload type="medical_license" label="Medical License" currentStatus={getDocStatus('medical_license')} onUploadSuccess={fetchData} />
                            <DoctorVerificationUpload type="degree_certificate" label="Degree Cert" currentStatus={getDocStatus('degree_certificate')} onUploadSuccess={fetchData} />
                            <DoctorVerificationUpload type="id_proof" label="ID Proof" currentStatus={getDocStatus('id_proof')} onUploadSuccess={fetchData} />
                        </div>
                    </div>

                    {/* Profile Configuration */}
                    <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                            <h2 className="text-2xl font-black text-gray-900">Practice Settings</h2>
                            <p className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-4 py-2 rounded-full uppercase tracking-widest">Global Visibility</p>
                        </div>
                        <form onSubmit={saveProfile} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Specialization</label>
                                    <input type="text" value={profile.specialty} onChange={(e) => setProfile({ ...profile, specialty: e.target.value })} className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:border-indigo-400 outline-none transition-all" placeholder="e.g. Cardiologist" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Consultation Fee (₹)</label>
                                    <input type="number" value={profile.fees} onChange={(e) => setProfile({ ...profile, fees: parseFloat(e.target.value) })} className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:border-indigo-400 outline-none transition-all" placeholder="800" required />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Professional Bio</label>
                                    <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:border-indigo-400 outline-none h-40 transition-all resize-none" placeholder="Share your clinical background..." required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Buffer Time (Min)</label>
                                    <input type="number" value={profile.buffer_time_mins} onChange={(e) => setProfile({ ...profile, buffer_time_mins: parseInt(e.target.value) })} className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:border-indigo-400 outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cancel Window (Hrs)</label>
                                    <input type="number" value={profile.cancellation_policy_hours} onChange={(e) => setProfile({ ...profile, cancellation_policy_hours: parseInt(e.target.value) })} className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:border-indigo-400 outline-none transition-all" />
                                </div>
                            </div>
                            <button type="submit" disabled={savingProfile} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 disabled:opacity-50 transition-all">{savingProfile ? 'Updating Professional Profile...' : 'Update Practice Settings'}</button>
                        </form>
                    </div>
                </div>

                {/* Right Column: Schedule & Availability */}
                <div className="lg:col-span-4 space-y-10">
                    <div className="sticky top-8 space-y-8">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                            <h2 className="text-xl font-black text-gray-900 border-b border-gray-50 pb-4">Availability Shift</h2>
                            <div className="space-y-4">
                                {Object.keys(schedule).map(day => (
                                    <div key={day} className="group p-4 rounded-3xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                                        <div className="flex items-center justify-between mb-4">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={schedule[day].enabled} onChange={(e) => handleScheduleChange(day, 'enabled', e.target.checked)} className="w-6 h-6 rounded-xl border-2 border-gray-100 text-indigo-600 focus:ring-0 transition-all cursor-pointer" />
                                                <span className={`text-sm font-black transition-colors ${schedule[day].enabled ? 'text-gray-900' : 'text-gray-300'}`}>{day}</span>
                                            </label>
                                        </div>
                                        {schedule[day].enabled && (
                                            <div className="grid grid-cols-2 gap-3 pl-9">
                                                <div className="relative">
                                                    <span className="absolute -top-2.5 left-3 px-1.5 text-[8px] font-black text-gray-400 bg-white group-hover:bg-gray-50 uppercase tracking-widest">Start</span>
                                                    <input type="time" value={schedule[day].start} onChange={(e) => handleScheduleChange(day, 'start', e.target.value)} className="w-full bg-white border border-gray-100 rounded-xl p-3 text-xs font-black outline-none focus:border-indigo-400 shadow-sm" />
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute -top-2.5 left-3 px-1.5 text-[8px] font-black text-gray-400 bg-white group-hover:bg-gray-50 uppercase tracking-widest">End</span>
                                                    <input type="time" value={schedule[day].end} onChange={(e) => handleScheduleChange(day, 'end', e.target.value)} className="w-full bg-white border border-gray-100 rounded-xl p-3 text-xs font-black outline-none focus:border-indigo-400 shadow-sm" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button onClick={saveAvailability} disabled={saving} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">{saving ? 'Syncing Schedule...' : 'Publish Availability'}</button>
                            <p className="text-[10px] text-gray-400 text-center font-bold px-4 leading-relaxed italic">Changes are instantly published to the patient discovery portal.</p>
                        </div>
                    </div>
                </div>
            </div>

            {showPrescriptionModal && (
                <PrescriptionForm
                    appointment={selectedAppointment}
                    onClose={() => setShowPrescriptionModal(false)}
                    onSuccess={fetchData}
                />
            )}
        </div>
    );
};

export default DoctorDashboard;
