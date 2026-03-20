import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import AvatarUpload from '../components/AvatarUpload';
import MedicalRecordUpload from '../components/MedicalRecordUpload';
import MedicalRecordsList from '../components/MedicalRecordsList';
import SkeletonCard from '../components/SkeletonCard';

import LeaveReviewModal from '../components/LeaveReviewModal';

const PatientDashboard = () => {
       const { user } = useAuth();
       const navigate = useNavigate();
       const [appointments, setAppointments] = useState([]);
       const [records, setRecords] = useState([]);
       const [loading, setLoading] = useState(true);
       const [recordsLoading, setRecordsLoading] = useState(true);
       const [selectedAppointment, setSelectedAppointment] = useState(null);
       const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
       const [showRescheduleModal, setShowRescheduleModal] = useState(false);
       const [rescheduleData, setRescheduleData] = useState({ date: '', slot: '' });
       const [availableSlots, setAvailableSlots] = useState([]);

       const fetchRecords = async () => {
              try {
                     const { data } = await api.get('/upload/medical-records');
                     setRecords(data);
              } catch (error) {
                     console.error('Fetch records error:', error);
              } finally {
                     setRecordsLoading(false);
              }
       };

       const fetchAppointments = async () => {
              try {
                     setLoading(true);
                     const { data } = await api.get('/appointments/patient');
                     setAppointments(data);
              } catch (error) {
                     console.error('Fetch appointments error:', error);
              } finally {
                     setLoading(false);
              }
       };

       useEffect(() => {
              fetchAppointments();
              fetchRecords();
       }, []);

       const handleCancel = async (id) => {
              if (window.confirm('Are you sure you want to cancel this appointment?')) {
                     try {
                            await api.delete(`/appointments/${id}`);
                            toast.success('Appointment cancelled.');
                            fetchAppointments(); // Refresh from server to ensure sync
                     } catch (error) {
                            const message = error.response?.data?.error || 'Failed to cancel appointment.';
                            toast.error(message);
                     }
              }
       };

       const handleReschedule = async () => {
              if (!rescheduleData.date || !rescheduleData.slot) {
                     toast.error('Please select both date and time');
                     return;
              }
              try {
                     await api.patch(`/appointments/${selectedAppointment.id}/reschedule`, {
                            new_date: rescheduleData.date,
                            new_time_slot: rescheduleData.slot
                     });
                     toast.success('Appointment rescheduled successfully!');
                     setShowRescheduleModal(false);
                     fetchAppointments();
              } catch (error) {
                     const message = error.response?.data?.error || 'Failed to reschedule';
                     toast.error(message);
              }
       };

       const fetchAvailableSlots = async (date, doctorId) => {
              try {
                     const { data } = await api.get(`/availability/${doctorId}?date=${date}`);
                     setAvailableSlots(data);
              } catch (error) {
                     toast.error('Failed to fetch available slots');
              }
       };

       const upcoming = appointments.filter(a => ['pending', 'confirmed'].includes(a.status));
       const past = appointments.filter(a => ['completed', 'cancelled'].includes(a.status));

       return (
               <div className="max-w-6xl mx-auto space-y-8 md:space-y-12 pb-20 px-4 md:px-0">
                       <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col xl:flex-row justify-between items-center gap-8">
                            <div className="flex items-center gap-8">
                                   <AvatarUpload
                                          currentAvatar={user?.avatar_url}
                                          onUploadSuccess={() => window.location.reload()}
                                   />
                                    <div className="text-center md:text-left">
                                           <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Health Dashboard</h1>
                                           <p className="text-gray-500 font-medium text-base md:text-lg mt-1">Hello, {user?.name.split(' ')[0]}! Ready for your checkup?</p>
                                    </div>
                             </div>
                             
                       <div className="flex flex-wrap justify-center xl:justify-end gap-2 md:gap-3 w-full xl:w-auto">
                             <button
                                    onClick={() => navigate('/waitlist')}
                                    className="flex-1 sm:flex-none bg-blue-50 text-blue-600 border-2 border-blue-100 px-4 md:px-6 py-2.5 rounded-2xl font-bold hover:bg-blue-100 transition-all shadow-sm text-sm"
                             >
                                    My Waitlists
                             </button>
                             <button
                                    onClick={() => navigate('/security')}
                                    className="flex-1 sm:flex-none bg-white text-gray-600 border-2 border-gray-100 px-4 md:px-6 py-2.5 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm text-sm"
                             >
                                    Security
                             </button>
                             <button
                                    onClick={() => navigate('/payments/history')}
                                    className="flex-1 sm:flex-none bg-white text-indigo-600 border-2 border-indigo-100 px-4 md:px-6 py-2.5 rounded-2xl font-bold hover:bg-indigo-50 transition-all shadow-sm text-sm"
                             >
                                    Payments
                             </button>
                             <button
                                    onClick={() => navigate('/health')}
                                    className="flex-1 sm:flex-none bg-indigo-50 text-indigo-600 border-2 border-indigo-100 px-4 md:px-6 py-2.5 rounded-2xl font-bold hover:bg-indigo-100 transition-all shadow-sm text-sm"
                             >
                                    Health Tools
                             </button>
                             <button
                                    onClick={() => navigate('/doctors')}
                                    className="flex-1 sm:flex-none bg-indigo-600 text-white px-6 md:px-8 py-2.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 text-sm"
                             >
                                    Book New
                             </button>
                      </div>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Medical Records Section */}
                            <div className="lg:col-span-2 space-y-6">
                                    <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 flex items-center gap-3">
                                           <div className="w-1.5 md:w-2 h-6 md:h-8 bg-indigo-600 rounded-full"></div>
                                           Digital Health Vault
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 bg-white p-5 md:p-8 rounded-3xl border border-gray-100 shadow-sm transition-all duration-300">
                                          <div className="md:col-span-4 bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200">
                                                 <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">New Entry</h3>
                                                 <MedicalRecordUpload onUploadSuccess={fetchRecords} />
                                          </div>
                                          <div className="md:col-span-8">
                                                 <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">Saved Records</h3>
                                                 <MedicalRecordsList
                                                        records={records}
                                                        onRefresh={fetchRecords}
                                                 />
                                          </div>
                                   </div>
                            </div>

                            {/* Upcoming Appointments */}
                            <div className="space-y-6">
                                    <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 flex items-center gap-3">
                                           <div className="w-1.5 md:w-2 h-6 md:h-8 bg-indigo-600 rounded-full"></div>
                                           Upcoming Visits
                                    </h2>
                                    {loading ? (
                                           <div className="space-y-4">
                                                  <SkeletonCard count={2} />
                                           </div>
                                    ) : upcoming.length > 0 ? (
                                           <div className="space-y-4 md:space-y-6">
                                                  {upcoming.map(app => (
                                                         <div key={app.id} className="bg-white p-5 md:p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row items-center gap-5 md:gap-6 group relative overflow-hidden text-center sm:text-left">
                                                               <div className={`absolute top-0 left-0 w-1.5 h-full ${app.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-400'}`}></div>
                                                               <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center text-indigo-600 font-extrabold text-2xl group-hover:scale-110 transition-transform">
                                                                      {app.doctor.profile.name.charAt(0)}
                                                               </div>
                                                               <div className="flex-1">
                                                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                                             <div className="flex items-center gap-2">
                                                                                    <h3 className="font-extrabold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">Dr. {app.doctor.profile.name}</h3>
                                                                                    <button
                                                                                           onClick={async () => {
                                                                                                  try {
                                                                                                         const { data } = await api.post('/messages/conversation', { participantId: app.doctor_id });
                                                                                                         navigate(`/messages?convId=${data.id}`);
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
                                                                             </div>
                                                                             <span className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest ${app.status === 'confirmed' ? 'bg-green-100 text-green-700 shadow-inner' : 'bg-yellow-100 text-yellow-700 shadow-inner'}`}>
                                                                                    {app.status}
                                                                             </span>
                                                                      </div>
                                                                      <p className="text-sm font-bold text-indigo-500 mb-4">{app.doctor.specialty}</p>
                                                                      <div className="flex flex-wrap items-center gap-6">
                                                                             <div className="flex items-center gap-2 text-gray-500 text-sm bg-gray-50 px-3 py-1 rounded-lg">
                                                                                    <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                                    <span className="font-medium">{app.appointment_date}</span>
                                                                             </div>
                                                                             <div className="flex items-center gap-2 text-gray-500 text-sm bg-gray-50 px-3 py-1 rounded-lg">
                                                                                    <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                                    <span className="font-medium">{app.time_slot.substring(0, 5)}</span>
                                                                             </div>
                                                                      </div>
                                                               </div>
                                                               {app.status !== 'cancelled' && (
                                                                      <div className="flex flex-col gap-2">
                                                                             <button
                                                                                    onClick={() => {
                                                                                           setSelectedAppointment(app);
                                                                                           setRescheduleData({ date: '', slot: '' });
                                                                                           setShowRescheduleModal(true);
                                                                                    }}
                                                                                    className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all"
                                                                             >
                                                                                    Reschedule
                                                                             </button>
                                                                             <button
                                                                                    onClick={() => handleCancel(app.id)}
                                                                                    className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-all"
                                                                             >
                                                                                    Cancel
                                                                             </button>
                                                                      </div>
                                                               )}
                                                        </div>
                                                 ))}
                                          </div>
                                   ) : (
                                          <div className="bg-white p-16 text-center rounded-3xl border border-dashed border-gray-200">
                                                 <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                                        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                 </div>
                                                 <h3 className="text-xl font-extrabold text-gray-700">All clear!</h3>
                                                 <p className="text-gray-400 mt-2">No upcoming visits. Book one whenever you need help.</p>
                                          </div>
                                   )}
                            </div>

                            {/* History */}
                            <div className="space-y-6">
                                   <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
                                          <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                                          Appointment History
                                   </h2>
                                   {past.length > 0 ? (
                                          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                                 <div className="overflow-x-auto">
                                                        <table className="w-full text-left">
                                                               <thead className="bg-gray-50 text-gray-400 font-extrabold text-[10px] uppercase tracking-widest border-b border-gray-100">
                                                                      <tr>
                                                                             <th className="px-8 py-5">Specialist</th>
                                                                             <th className="px-8 py-5">Visit Date</th>
                                                                             <th className="px-8 py-5">Status</th>
                                                                             <th className="px-8 py-5 text-right">Feedback</th>
                                                                      </tr>
                                                               </thead>
                                                               <tbody className="divide-y divide-gray-50">
                                                                      {past.map(app => (
                                                                             <tr key={app.id} className="hover:bg-gray-50/50 transition-colors group">
                                                                                    <td className="px-8 py-6">
                                                                                           <div className="flex items-center gap-3">
                                                                                                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-sm">
                                                                                                         {app.doctor.profile.name.charAt(0)}
                                                                                                  </div>
                                                                                                  <div>
                                                                                                         <p className="font-extrabold text-gray-900">Dr. {app.doctor.profile.name}</p>
                                                                                                         <p className="text-xs text-gray-400 font-bold">{app.doctor.specialty}</p>
                                                                                                  </div>
                                                                                           </div>
                                                                                    </td>
                                                                                    <td className="px-8 py-6 text-sm font-bold text-gray-500">{app.appointment_date}</td>
                                                                                    <td className="px-8 py-6 text-sm">
                                                                                           <span className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest ${app.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-600'
                                                                                                  }`}>
                                                                                                  {app.status}
                                                                                           </span>
                                                                                    </td>
                                                                                    <td className="px-8 py-6 text-right">
                                                                                           {app.status === 'completed' && (
                                                                                                  <button
                                                                                                         onClick={() => {
                                                                                                                setSelectedAppointment(app);
                                                                                                                setIsReviewModalOpen(true);
                                                                                                         }}
                                                                                                         className="text-indigo-600 font-extrabold text-xs bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                                                                  >
                                                                                                         Rate Visit
                                                                                                  </button>
                                                                                           )}
                                                                                    </td>
                                                                             </tr>
                                                                      ))}
                                                               </tbody>
                                                        </table>
                                                 </div>
                                          </div>
                                   ) : (
                                          <div className="bg-white p-20 text-center rounded-3xl border border-gray-100 shadow-sm">
                                                 <h3 className="text-xl font-extrabold text-gray-700">Journey begins here</h3>
                                                 <p className="text-gray-400 mt-2">Your consultation history will appear here.</p>
                                          </div>
                                   )}
                            </div>
                     </div>

                     {selectedAppointment && (
                            <LeaveReviewModal
                                   isOpen={isReviewModalOpen}
                                   onClose={() => {
                                          setIsReviewModalOpen(false);
                                          setSelectedAppointment(null);
                                   }}
                                   appointment={selectedAppointment}
                                   onReviewSubmitted={fetchAppointments}
                            />
                     )}

                     {showRescheduleModal && (
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                   <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl scale-in-center">
                                          <h3 className="text-2xl font-extrabold text-gray-900 mb-6">Reschedule Visit</h3>
                                          <div className="space-y-6">
                                                 <div>
                                                        <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Select New Date</label>
                                                        <input
                                                               type="date"
                                                               min={new Date().toISOString().split('T')[0]}
                                                               className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:outline-none transition-all font-bold"
                                                               onChange={(e) => {
                                                                      setRescheduleData({ ...rescheduleData, date: e.target.value, slot: '' });
                                                                      fetchAvailableSlots(e.target.value, selectedAppointment.doctor_id);
                                                               }}
                                                        />
                                                 </div>
                                                 <div>
                                                        <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Available Slots</label>
                                                        <div className="grid grid-cols-3 gap-3">
                                                               {availableSlots.map(slot => (
                                                                      <button
                                                                             key={slot}
                                                                             onClick={() => setRescheduleData({ ...rescheduleData, slot })}
                                                                             className={`py-3 rounded-xl font-bold text-sm transition-all ${rescheduleData.slot === slot
                                                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                                                                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                                                                    }`}
                                                                      >
                                                                             {slot.substring(0, 5)}
                                                                      </button>
                                                               ))}
                                                        </div>
                                                 </div>
                                                 <div className="flex gap-4 pt-4">
                                                        <button
                                                               onClick={() => setShowRescheduleModal(false)}
                                                               className="flex-1 px-6 py-4 rounded-2xl font-extrabold text-gray-400 hover:bg-gray-50 transition-all border-2 border-transparent"
                                                        >
                                                               Close
                                                        </button>
                                                        <button
                                                               onClick={handleReschedule}
                                                               className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-extrabold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                                        >
                                                               Confirm
                                                        </button>
                                                 </div>
                                          </div>
                                   </div>
                            </div>
                     )}
              </div>
       );
};

export default PatientDashboard;
