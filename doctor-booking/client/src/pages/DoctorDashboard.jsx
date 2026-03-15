import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import AvatarUpload from '../components/AvatarUpload';
import MedicalRecordsList from '../components/MedicalRecordsList';
import SkeletonCard from '../components/SkeletonCard';

import DoctorVerificationUpload from '../components/DoctorVerificationUpload';

const DoctorDashboard = () => {
       const { user } = useAuth();
       const navigate = useNavigate();
       const [appointments, setAppointments] = useState([]);
       const [records, setRecords] = useState([]);
       const [loading, setLoading] = useState(true);
       const [verifications, setVerifications] = useState([]);
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

       const [saving, setSaving] = useState(false);
       const [savingProfile, setSavingProfile] = useState(false);

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

       return (
              <div className="max-w-7xl mx-auto space-y-12 pb-20">
                     {/* Header / Identity */}
                     <div className="bg-white p-10 rounded-3xl shadow-md border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-10">
                            <div className="flex items-center gap-8">
                                   <div className="relative">
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
                                          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                                                 Dr. {user?.name}
                                                 {user?.doctorDetails?.is_verified && (
                                                        <span className="text-blue-500 text-sm font-bold bg-blue-50 px-3 py-1 rounded-full border border-blue-100 uppercase tracking-tighter">Verified</span>
                                                 )}
                                          </h1>
                                          <p className="text-gray-500 font-medium text-lg mt-1">{profile.specialty || 'General Practitioner'} • {profile.experience || 0} Years Experience</p>
                                   </div>
                            </div>
                            <div className="flex gap-4">
                                   <button
                                          onClick={() => navigate('/security')}
                                          className="bg-white text-gray-600 border-2 border-gray-100 px-8 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm"
                                   >
                                          Security
                                   </button>
                                   <button
                                          onClick={() => navigate('/payments/history')}
                                          className="bg-white text-indigo-600 border-2 border-indigo-100 px-8 py-3 rounded-2xl font-bold hover:bg-indigo-50 transition-all shadow-sm"
                                   >
                                          Income History
                                   </button>
                                   <div className={`px-6 py-3 rounded-2xl text-sm font-extrabold uppercase tracking-widest flex items-center gap-2 ${user?.doctorDetails?.is_approved ? 'bg-green-100 text-green-700 shadow-inner' : 'bg-yellow-100 text-yellow-700 shadow-inner'}`}>
                                          <div className={`w-2 h-2 rounded-full ${user?.doctorDetails?.is_approved ? 'bg-green-500' : 'bg-yellow-400'} animate-pulse`}></div>
                                          {user?.doctorDetails?.is_approved ? 'Active Practitioner' : 'Verification Pending'}
                                   </div>
                            </div>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                            <div className="lg:col-span-8 space-y-12">
                                   {/* Professional Verification Section */}
                                   {!user?.doctorDetails?.is_verified && (
                                          <div className="space-y-6">
                                                 <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
                                                        <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                                                        Professional Verification
                                                 </h2>
                                                 <div className="bg-blue-50/50 p-8 rounded-3xl border border-blue-100 relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                                               <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 20 20">
                                                                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                               </svg>
                                                        </div>
                                                        <div className="max-w-xl mb-8">
                                                               <h3 className="text-xl font-bold text-gray-800 mb-2">Build Patient Trust</h3>
                                                               <p className="text-gray-500 text-sm leading-relaxed">Verified doctors receive 3x more bookings on average. Upload your professional certifications to get the blue verification badge on your profile.</p>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                               <DoctorVerificationUpload
                                                                      type="medical_license"
                                                                      label="Medical License"
                                                                      currentStatus={getDocStatus('medical_license')}
                                                                      onUploadSuccess={fetchData}
                                                               />
                                                               <DoctorVerificationUpload
                                                                      type="degree_certificate"
                                                                      label="Degree Certificate"
                                                                      currentStatus={getDocStatus('degree_certificate')}
                                                                      onUploadSuccess={fetchData}
                                                               />
                                                               <DoctorVerificationUpload
                                                                      type="id_proof"
                                                                      label="Identity Proof"
                                                                      currentStatus={getDocStatus('id_proof')}
                                                                      onUploadSuccess={fetchData}
                                                               />
                                                        </div>
                                                 </div>
                                          </div>
                                   )}

                                   {/* Profile Settings */}
                                   <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm space-y-8">
                                          <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                                                 <h2 className="text-2xl font-extrabold text-gray-900">Profile Configuration</h2>
                                                 <p className="text-[10px] font-extrabold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">Public View</p>
                                          </div>
                                          <form onSubmit={saveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                 <div className="space-y-2">
                                                        <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest pl-1">Primary Specialty</label>
                                                        <input
                                                               type="text"
                                                               value={profile.specialty}
                                                               onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}
                                                               className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-0 focus:border-indigo-400 outline-none transition-all"
                                                               placeholder="e.g. Cardiologist"
                                                               required
                                                        />
                                                 </div>
                                                 <div className="space-y-2">
                                                        <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest pl-1">Consultation Fees (₹)</label>
                                                        <input
                                                               type="number"
                                                               value={profile.fees}
                                                               onChange={(e) => setProfile({ ...profile, fees: parseFloat(e.target.value) })}
                                                               className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-0 focus:border-indigo-400 outline-none transition-all"
                                                               placeholder="800"
                                                               required
                                                        />
                                                 </div>
                                                 <div className="md:col-span-2 space-y-2">
                                                        <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest pl-1">Professional Bio</label>
                                                        <textarea
                                                               value={profile.bio}
                                                               onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                                               className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-0 focus:border-indigo-400 outline-none h-32 transition-all resize-none"
                                                               placeholder="Tell patients about your background and expertise..."
                                                               required
                                                        />
                                                 </div>
                                                               <div className="pt-6 border-t border-gray-100">
                                                                      <h4 className="text-lg font-extrabold text-gray-900 mb-6">Scheduling Logic</h4>
                                                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                                             <div>
                                                                                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Buffer Time (Mins)</label>
                                                                                    <input
                                                                                           type="number"
                                                                                           className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-bold text-gray-700"
                                                                                           value={profile.buffer_time_mins}
                                                                                           onChange={(e) => setProfile({ ...profile, buffer_time_mins: parseInt(e.target.value) || 0 })}
                                                                                    />
                                                                                    <p className="mt-2 text-xs text-gray-400 font-medium italic">Gap between appointments</p>
                                                                             </div>
                                                                             <div>
                                                                                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Cancellation Window (Hrs)</label>
                                                                                    <input
                                                                                           type="number"
                                                                                           className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-bold text-gray-700"
                                                                                           value={profile.cancellation_policy_hours}
                                                                                           onChange={(e) => setProfile({ ...profile, cancellation_policy_hours: parseInt(e.target.value) || 24 })}
                                                                                    />
                                                                                    <p className="mt-2 text-xs text-gray-400 font-medium italic">Penalty-free cancellation limit</p>
                                                                             </div>
                                                                      </div>
                                                               </div>

                                                 <button
                                                        type="submit"
                                                        disabled={savingProfile}
                                                        className="md:col-span-2 bg-indigo-600 text-white py-4 rounded-2xl font-extrabold hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-100 transition-all hover:-translate-y-0.5"
                                                 >
                                                        {savingProfile ? 'Synchronizing...' : 'Save Changes'}
                                                 </button>
                                          </form>
                                   </div>

                                   {/* Recent Appointments */}
                                   <div className="space-y-6">
                                          <div className="flex items-center justify-between">
                                                 <h2 className="text-2xl font-extrabold text-gray-900">Patient Engagements</h2>
                                                 <button onClick={fetchData} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                 </button>
                                          </div>
                                          <div className="grid gap-6">
                                                 {loading ? (
                                                        <SkeletonCard count={3} />
                                                 ) : appointments.length > 0 ? (
                                                        appointments.map(app => (
                                                               <div key={app.id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-6 hover:shadow-xl transition-all duration-300 group">
                                                                      <div className="flex items-start justify-between">
                                                                             <div className="flex items-center gap-4">
                                                                                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center font-extrabold text-indigo-600 group-hover:scale-110 transition-transform">
                                                                                           {app.patient.name.charAt(0)}
                                                                                    </div>
                                                                                    <div>
                                                                                           <div className="flex items-center gap-2">
                                                                                                  <p className="font-extrabold text-gray-900 text-lg">{app.patient.name}</p>
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
                                                                                                         title="Secure Message"
                                                                                                  >
                                                                                                         <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                                                                         </svg>
                                                                                                  </button>
                                                                    {!app.no_show && app.status === 'confirmed' && (
                                                                           <button
                                                                                  onClick={() => handleNoShow(app.id)}
                                                                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition-all ml-1"
                                                                                  title="Flag No-Show"
                                                                           >
                                                                                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                                                           </button>
                                                                    )}

                                                                                           </div>
                                                                                           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{app.appointment_date} @ {app.time_slot.substring(0, 5)}</p>
                                                                                    </div>
                                                                             </div>
                                                                             <div className="flex flex-col items-end gap-2">
                                                                                    <select
                                                                                           value={app.status}
                                                                                           onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                                                                           className="text-[10px] font-extrabold uppercase tracking-widest border-2 border-gray-100 rounded-xl px-4 py-2 outline-none focus:border-indigo-400 bg-white shadow-sm transition-all"
                                                                                    >
                                                                                           <option value="pending">Pending</option>
                                                                                           <option value="confirmed">Confirmed</option>
                                                                                           <option value="cancelled">Cancelled</option>
                                                                                           <option value="completed">Completed</option>
                                                                                    </select>
                                                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${app.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'
                                                                                           }`}>
                                                                                           {app.payment_status}
                                                                                    </span>
                                                                             </div>
                                                                      </div>

                                                                      {/* Linked Medical Records */}
                                                                      <div className="pt-6 border-t border-gray-50">
                                                                             <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-4">Patient Case History</p>
                                                                             <MedicalRecordsList
                                                                                    records={records.filter(r => r.appointment_id === app.id)}
                                                                                    canDelete={false}
                                                                                    onRefresh={fetchData}
                                                                             />
                                                                             {records.filter(r => r.appointment_id === app.id).length === 0 && (
                                                                                    <p className="text-xs font-bold text-gray-300 italic">No records shared for this visit.</p>
                                                                             )}
                                                                      </div>
                                                               </div>
                                                        ))
                                                 ) : (
                                                        <div className="bg-white p-20 text-center rounded-3xl border border-dashed border-gray-200">
                                                               <h3 className="text-xl font-extrabold text-gray-700">Waiting for patients</h3>
                                                               <p className="text-gray-400 mt-2">New appointments will appear here as soon as they are booked.</p>
                                                        </div>
                                                 )}
                                          </div>
                                   </div>
                            </div>

                            {/* Right Column: Schedule */}
                            <div className="lg:col-span-4 space-y-12">
                                   <div className="space-y-6">
                                          <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
                                                 <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                                                 Shift Schedule
                                          </h2>
                                          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                                                 {Object.keys(schedule).map(day => (
                                                        <div key={day} className="py-4 border-b border-gray-50 last:border-0 group">
                                                               <div className="flex items-center justify-between mb-3">
                                                                      <label className="flex items-center gap-3 cursor-pointer">
                                                                             <input
                                                                                    type="checkbox"
                                                                                    checked={schedule[day].enabled}
                                                                                    onChange={(e) => handleScheduleChange(day, 'enabled', e.target.checked)}
                                                                                    className="w-5 h-5 rounded-lg border-2 border-gray-200 text-indigo-600 focus:ring-0 transition-all checked:bg-indigo-600 checked:border-indigo-600"
                                                                             />
                                                                             <span className={`text-sm font-extrabold ${schedule[day].enabled ? 'text-gray-900' : 'text-gray-400'} group-hover:text-indigo-600 transition-colors`}>{day}</span>
                                                                      </label>
                                                                      {!schedule[day].enabled && (
                                                                             <span className="text-[10px] font-extrabold text-gray-300 uppercase tracking-widest">Off Duty</span>
                                                                      )}
                                                               </div>
                                                               {schedule[day].enabled && (
                                                                      <div className="flex items-center gap-3 pl-8">
                                                                             <div className="flex-1 relative">
                                                                                    <span className="absolute -top-3 left-2 px-1 text-[8px] font-extrabold text-gray-400 bg-white uppercase">Start</span>
                                                                                    <input
                                                                                           type="time"
                                                                                           value={schedule[day].start}
                                                                                           onChange={(e) => handleScheduleChange(day, 'start', e.target.value)}
                                                                                           className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-indigo-400"
                                                                                    />
                                                                             </div>
                                                                             <div className="text-gray-300">→</div>
                                                                             <div className="flex-1 relative">
                                                                                    <span className="absolute -top-3 left-2 px-1 text-[8px] font-extrabold text-gray-400 bg-white uppercase">End</span>
                                                                                    <input
                                                                                           type="time"
                                                                                           value={schedule[day].end}
                                                                                           onChange={(e) => handleScheduleChange(day, 'end', e.target.value)}
                                                                                           className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-indigo-400"
                                                                                    />
                                                                             </div>
                                                                      </div>
                                                               )}
                                                        </div>
                                                 ))}
                                                 <button
                                                        onClick={saveAvailability}
                                                        disabled={saving}
                                                        className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-extrabold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100' hover:-translate-y-0.5 mt-4"
                                                 >
                                                        {saving ? 'Syncing...' : 'Publish Availability'}
                                                 </button>
                                                 <p className="text-[10px] text-gray-400 text-center mt-4 italic font-medium px-4">Changes will be visible to patients browsing the discovery platform instantly.</p>
                                          </div>
                                   </div>
                            </div>
                     </div>
              </div>
       );
};

export default DoctorDashboard;
