import React, { useState, useEffect } from 'react';
import {
       LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
       XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const AdminDashboard = () => {
       const [activeTab, setActiveTab] = useState('overview');
       const [stats, setStats] = useState(null);
       const [lineData, setLineData] = useState([]);
       const [barData, setBarData] = useState([]);
       const [pieData, setPieData] = useState([]);
       const [pendingDoctors, setPendingDoctors] = useState([]);
       const [approvedDoctors, setApprovedDoctors] = useState([]);
       const [users, setUsers] = useState([]);
       const [verifications, setVerifications] = useState([]);
       const [featuredDoctors, setFeaturedDoctors] = useState([]);
       const [noShowAppointments, setNoShowAppointments] = useState([]);
       const [announcements, setAnnouncements] = useState([]);
       const [loading, setLoading] = useState(true);
       const [page, setPage] = useState(1);
       const [totalPages, setTotalPages] = useState(1);

       useEffect(() => {
              fetchInitialData();
       }, []);

       const fetchInitialData = async () => {
              setLoading(true);
              try {
                     const [s, l, b, p] = await Promise.all([
                            api.get('/admin/stats'),
                            api.get('/admin/appointments-by-day'),
                            api.get('/admin/revenue-by-month'),
                            api.get('/admin/specialty-breakdown')
                     ]);
                     setStats(s.data);
                     setLineData(l.data);
                     setBarData(b.data);
                     setPieData(p.data);
              } catch (error) {
                     toast.error('Failed to fetch dashboard data');
              } finally {
                     setLoading(false);
              }
       };

       const fetchDoctors = async (status) => {
              try {
                     const { data } = await api.get(`/admin/doctors?status=${status}`);
                     if (status === 'pending') setPendingDoctors(data);
                     else setApprovedDoctors(data);
              } catch (error) {
                     toast.error('Failed to fetch doctors');
              }
       };

       const fetchUsers = async () => {
              try {
                     const { data } = await api.get(`/admin/users?page=${page}`);
                     setUsers(data.users);
                     setTotalPages(data.pages);
              } catch (error) {
                     toast.error('Failed to fetch users');
              }
       };

       const fetchVerifications = async () => {
              try {
                     const { data } = await api.get('/admin/verifications?status=pending');
                     setVerifications(data);
              } catch (error) {
                     toast.error('Failed to fetch verifications');
              }
       };

       const fetchFeatured = async () => {
              try {
                     const { data } = await api.get('/admin/featured');
                     setFeaturedDoctors(data);
              } catch (error) {
                     toast.error('Failed to fetch featured doctors');
              }
       };

        const fetchNoShows = async () => {
               try {
                      const { data } = await api.get('/admin/no-shows');
                      setNoShowAppointments(data);
               } catch (error) {
                      toast.error('Failed to fetch no-show report');
               }
        };

         const fetchAnnouncements = async () => {
                try {
                       const { data } = await api.get('/announcements');
                       setAnnouncements(data);
                } catch (error) {
                       toast.error('Failed to fetch announcements');
                }
         };


       useEffect(() => {
              if (activeTab === 'doctors') {
                     fetchDoctors('pending');
                     fetchDoctors('approved');
              } else if (activeTab === 'users') {
                     fetchUsers();
              } else if (activeTab === 'verifications') {
                     fetchVerifications();
              } else if (activeTab === 'featured') {
                      fetchFeatured();
               } else if (activeTab === 'no-shows') {
                      fetchNoShows();
               } else if (activeTab === 'announcements') {
                      fetchAnnouncements();
               }
       }, [activeTab, page]);

       const handleApprove = async (id) => {
              try {
                     await api.patch(`/admin/doctors/${id}/approve`);
                     toast.success('Doctor approved');
                     fetchDoctors('pending');
                     fetchDoctors('approved');
              } catch (error) {
                     toast.error('Approval failed');
              }
       };

       const handleReject = async (id) => {
              if (!window.confirm('Are you sure you want to reject/delete this doctor?')) return;
              try {
                     await api.patch(`/admin/doctors/${id}/reject`);
                     toast.success('Doctor rejected');
                     fetchDoctors('pending');
              } catch (error) {
                     toast.error('Rejection failed');
              }
       };

       const handleUpdateVerification = async (id, status) => {
              let reason = '';
              if (status === 'rejected') {
                     reason = window.prompt('Please enter rejection reason:');
                     if (!reason) return;
              }

              try {
                     await api.patch(`/admin/verifications/${id}`, { status, rejection_reason: reason });
                     toast.success(`Document ${status}`);
                     fetchVerifications();
              } catch (error) {
                     toast.error('Update failed');
              }
       };

       // Added handleFeatureDoctor
       const handleFeatureDoctor = async (doctorId) => {
              const priority = window.prompt('Enter priority (0-10):', '0');
              const days = window.prompt('Feature for how many days?', '7');
              if (priority === null || days === null) return;

              const endDate = new Date();
              endDate.setDate(endDate.getDate() + parseInt(days));

              try {
                     await api.post('/admin/featured', {
                            doctorId,
                            priority: parseInt(priority),
                            endDate: endDate.toISOString().split('T')[0]
                     });
                     toast.success('Doctor featured successfully!');
                     fetchFeatured();
                     fetchDoctors('approved'); // Refresh approved doctors to show featured status if applicable
              } catch (error) {
                     toast.error('Failed to feature doctor');
              }
       };

       // Added handleRemoveFeatured
       const handleRemoveFeatured = async (featuredId) => {
              if (!window.confirm('Remove from featured list?')) return;
              try {
                     await api.delete(`/admin/featured/${featuredId}`);
                     toast.success('Removed from featured');
                     fetchFeatured();
                     fetchDoctors('approved'); // Refresh approved doctors
              } catch (error) {
                     toast.error('Failed to remove');
              }
       };

        const handleCreateAnnouncement = async (e) => {
               e.preventDefault();
               const formData = new FormData(e.target);
               const data = Object.fromEntries(formData.entries());
               
               try {
                      await api.post('/announcements', data);
                      toast.success('Announcement created!');
                      e.target.reset();
                      fetchAnnouncements();
               } catch (error) {
                      toast.error('Failed to create announcement');
               }
        };

        const handleDeleteAnnouncement = async (id) => {
               if (!window.confirm('Delete this announcement?')) return;
               try {
                      await api.delete(`/announcements/${id}`);
                      toast.success('Announcement deleted');
                      fetchAnnouncements();
               } catch (error) {
                      toast.error('Failed to delete');
               }
        };

       const handleToggleSuspend = async (user) => {
              try {
                     const newStatus = !user.is_suspended;
                     await api.patch(`/admin/users/${user.id}/suspend`, { suspended: newStatus });
                     toast.success(`User ${newStatus ? 'suspended' : 'unsuspended'}`);
                     fetchUsers();
              } catch (error) {
                     toast.error('Status update failed');
              }
       };

       if (loading && activeTab === 'overview') {
              return <div className="p-8 text-center animate-pulse">Loading Analytics...</div>;
       }

       return (
              <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
                     <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Control Panel</h1>
                            <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto max-w-full">
                                   {['overview', 'doctors', 'users', 'verifications', 'featured', 'no-shows', 'announcements'].map(tab => (
                                          <button
                                                 key={tab}
                                                 onClick={() => setActiveTab(tab)}
                                                 className={`px-6 py-2 rounded-md text-sm font-semibold transition-all shrink-0 ${activeTab === tab
                                                        ? 'bg-white text-indigo-600 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700'
                                                        }`}
                                          >
                                                 {tab.replace('-', ' ').charAt(0).toUpperCase() + tab.replace('-', ' ').slice(1)}
                                          </button>
                                   ))}
                            </div>
                     </div>

                     {activeTab === 'overview' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                   {/* Stat Cards */}
                                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                          {[
                                                 { label: 'Total Patients', value: stats?.total_patients, color: 'indigo' },
                                                 { label: 'Total Doctors', value: stats?.total_doctors, color: 'green' },
                                                 { label: 'Monthly Appts', value: stats?.appointments_this_month, color: 'blue' },
                                                 { label: 'Monthly Revenue', value: `₹${stats?.revenue_this_month || 0}`, color: 'amber' }
                                          ].map((s, i) => (
                                                 <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                                                        <p className="text-sm font-medium text-gray-500 mb-1">{s.label}</p>
                                                        <p className={`text-3xl font-bold text-${s.color}-600`}>{s.value}</p>
                                                 </div>
                                          ))}
                                   </div>

                                   {/* Charts Row 1 */}
                                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                                 <h3 className="text-lg font-bold text-gray-800 mb-6">Appointments (Last 30 Days)</h3>
                                                 <div className="h-[300px]">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                               <LineChart data={lineData}>
                                                                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                                                      <YAxis tick={{ fontSize: 12 }} />
                                                                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                                      <Line type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#4F46E5' }} activeDot={{ r: 6 }} />
                                                               </LineChart>
                                                        </ResponsiveContainer>
                                                 </div>
                                          </div>

                                          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                                 <h3 className="text-lg font-bold text-gray-800 mb-6">Revenue (Last 6 Months)</h3>
                                                 <div className="h-[300px]">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                               <BarChart data={barData}>
                                                                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                                                      <YAxis tick={{ fontSize: 12 }} />
                                                                      <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                                      <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                                                               </BarChart>
                                                        </ResponsiveContainer>
                                                 </div>
                                          </div>
                                   </div>

                                   {/* Charts Row 2 */}
                                   <div className="max-w-2xl mx-auto">
                                          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                                 <h3 className="text-lg font-bold text-gray-800 mb-6 text-center">Appointment Specialty Distribution</h3>
                                                 <div className="h-[300px]">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                               <PieChart>
                                                                      <Pie
                                                                             data={pieData}
                                                                             cx="50%"
                                                                             cy="50%"
                                                                             innerRadius={60}
                                                                             outerRadius={100}
                                                                             paddingAngle={5}
                                                                             dataKey="value"
                                                                      >
                                                                             {pieData.map((entry, index) => (
                                                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                             ))}
                                                                      </Pie>
                                                                      <Tooltip />
                                                                      <Legend verticalAlign="bottom" height={36} />
                                                               </PieChart>
                                                        </ResponsiveContainer>
                                                 </div>
                                          </div>
                                   </div>
                            </div>
                     )}

                     {activeTab === 'doctors' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                   <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                                 <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                                                        Pending Approvals ({pendingDoctors.length})
                                                 </h3>
                                          </div>
                                          <div className="overflow-x-auto">
                                                 {pendingDoctors.length > 0 ? (
                                                        <table className="w-full text-left">
                                                               <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                                                                      <tr>
                                                                             <th className="px-6 py-4">Doctor</th>
                                                                             <th className="px-6 py-4">Specialty</th>
                                                                             <th className="px-6 py-4">Experience</th>
                                                                             <th className="px-6 py-4 text-right">Actions</th>
                                                                      </tr>
                                                               </thead>
                                                               <tbody className="divide-y divide-gray-100">
                                                                      {pendingDoctors.map(doc => (
                                                                             <tr key={doc.id} className="hover:bg-gray-50/50">
                                                                                    <td className="px-6 py-4">
                                                                                           <div className="font-semibold text-gray-900">{doc.profile.name}</div>
                                                                                           <div className="text-xs text-gray-500">{doc.profile.email}</div>
                                                                                    </td>
                                                                                    <td className="px-6 py-4 text-sm text-gray-600">{doc.specialty}</td>
                                                                                    <td className="px-6 py-4 text-sm text-gray-600">{doc.experience} Yrs</td>
                                                                                    <td className="px-6 py-4 text-right space-x-2">
                                                                                           <button
                                                                                                  onClick={() => handleApprove(doc.id)}
                                                                                                  className="text-xs font-bold text-green-600 hover:text-green-700 bg-green-50 px-3 py-1.5 rounded-md"
                                                                                           >
                                                                                                  Approve
                                                                                           </button>
                                                                                           <button
                                                                                                  onClick={() => handleReject(doc.id)}
                                                                                                  className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-md"
                                                                                           >
                                                                                                  Reject
                                                                                           </button>
                                                                                    </td>
                                                                             </tr>
                                                                      ))}
                                                               </tbody>
                                                        </table>
                                                 ) : (
                                                        <div className="p-12 text-center text-gray-400 italic">No pending approvals.</div>
                                                 )}
                                          </div>
                                   </div>

                                   <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                          <div className="p-6 border-b border-gray-100">
                                                 <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                        Active Doctors ({approvedDoctors.length})
                                                 </h3>
                                          </div>
                                          <div className="overflow-x-auto">
                                                 <table className="w-full text-left">
                                                        <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                                                               <tr>
                                                                      <th className="px-6 py-4">Doctor</th>
                                                                      <th className="px-6 py-4">Specialty</th>
                                                                      <th className="px-6 py-4 text-center">Badges</th>
                                                                      <th className="px-6 py-4 text-right">Actions</th>
                                                               </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                               {approvedDoctors.map(doc => (
                                                                      <tr key={doc.id} className="hover:bg-gray-50/50">
                                                                             <td className="px-6 py-4">
                                                                                    <div className="font-semibold text-gray-900">{doc.profile.name}</div>
                                                                                    <div className="text-xs text-gray-500">{doc.profile.email}</div>
                                                                             </td>
                                                                             <td className="px-6 py-4 text-sm text-gray-600">{doc.specialty}</td>
                                                                             <td className="px-6 py-4 text-center">
                                                                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase mb-1 block">
                                                                                           Approved
                                                                                    </span>
                                                                                    {doc.featured_until && (
                                                                                           <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Featured</span>
                                                                                    )}
                                                                             </td>
                                                                             <td className="px-6 py-4 text-right space-x-2">
                                                                                    <button
                                                                                           onClick={() => handleFeatureDoctor(doc.id)}
                                                                                           className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-md hover:bg-indigo-100 transition-colors"
                                                                                    >
                                                                                           {doc.featured_until ? 'Update Feature' : 'Promote'}
                                                                                    </button>
                                                                                    <button
                                                                                           onClick={() => handleReject(doc.id)}
                                                                                           className="text-[10px] font-bold text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-md transition-colors"
                                                                                    >
                                                                                           Revoke
                                                                                    </button>
                                                                             </td>
                                                                      </tr>
                                                               ))}
                                                        </tbody>
                                                 </table>
                                          </div>
                                   </div>
                            </div>
                     )}

                     {activeTab === 'users' && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                                   <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                          <h3 className="text-lg font-bold text-gray-800">User Management</h3>
                                   </div>
                                   <div className="overflow-x-auto">
                                          <table className="w-full text-left">
                                                 <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                                                        <tr>
                                                               <th className="px-6 py-4">User</th>
                                                               <th className="px-6 py-4">Role</th>
                                                               <th className="px-6 py-4">Joined</th>
                                                               <th className="px-6 py-4 text-right">Actions</th>
                                                        </tr>
                                                 </thead>
                                                 <tbody className="divide-y divide-gray-100">
                                                        {users.map(u => (
                                                               <tr key={u.id} className="hover:bg-gray-50/50">
                                                                      <td className="px-6 py-4">
                                                                             <div className="font-semibold text-gray-900">{u.name}</div>
                                                                             <div className="text-xs text-gray-500">{u.email}</div>
                                                                      </td>
                                                                      <td className="px-6 py-4">
                                                                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${u.role === 'admin' ? 'bg-red-100 text-red-700' :
                                                                                    u.role === 'doctor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                                                                    }`}>
                                                                                    {u.role}
                                                                             </span>
                                                                      </td>
                                                                      <td className="px-6 py-4 text-sm text-gray-500">
                                                                             {new Date(u.created_at).toLocaleDateString()}
                                                                      </td>
                                                                      <td className="px-6 py-4 text-right">
                                                                             {u.role !== 'admin' && (
                                                                                    <button
                                                                                           onClick={() => handleToggleSuspend(u)}
                                                                                           className={`text-xs font-bold px-3 py-1.5 rounded-md transition ${u.is_suspended
                                                                                                  ? 'bg-green-50 text-green-600 hover:text-green-700'
                                                                                                  : 'bg-red-50 text-red-600 hover:text-red-700'
                                                                                                  }`}
                                                                                    >
                                                                                           {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                                                                                    </button>
                                                                             )}
                                                                      </td>
                                                               </tr>
                                                        ))}
                                                 </tbody>
                                          </table>
                                   </div>
                                   {totalPages > 1 && (
                                          <div className="p-4 bg-gray-50 flex justify-center gap-2">
                                                 <button
                                                        disabled={page === 1}
                                                        onClick={() => setPage(p => p - 1)}
                                                        className="px-3 py-1 border rounded bg-white disabled:opacity-50 text-sm"
                                                 >
                                                        Prev
                                                 </button>
                                                 <span className="text-sm self-center">Page {page} of {totalPages}</span>
                                                 <button
                                                        disabled={page === totalPages}
                                                        onClick={() => setPage(p => p + 1)}
                                                        className="px-3 py-1 border rounded bg-white disabled:opacity-50 text-sm"
                                                 >
                                                        Next
                                                 </button>
                                          </div>
                                   )}
                            </div>
                     )}
                     {activeTab === 'verifications' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                   <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                                 <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                                        Pending Verifications ({verifications.length})
                                                 </h3>
                                          </div>
                                          <div className="overflow-x-auto">
                                                 {verifications.length > 0 ? (
                                                        <table className="w-full text-left">
                                                               <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                                                                      <tr>
                                                                             <th className="px-6 py-4">Doctor</th>
                                                                             <th className="px-6 py-4">Document Type</th>
                                                                             <th className="px-6 py-4">Uploaded</th>
                                                                             <th className="px-6 py-4 text-right">Actions</th>
                                                                      </tr>
                                                               </thead>
                                                               <tbody className="divide-y divide-gray-100">
                                                                      {verifications.map(v => (
                                                                             <tr key={v.id} className="hover:bg-gray-50/50">
                                                                                    <td className="px-6 py-4">
                                                                                           <div className="font-semibold text-gray-900">{v.doctor.profile.name}</div>
                                                                                           <div className="text-xs text-gray-500">{v.doctor.profile.email}</div>
                                                                                    </td>
                                                                                    <td className="px-6 py-4">
                                                                                           <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                                                                                  {v.document_type.replace('_', ' ')}
                                                                                           </span>
                                                                                    </td>
                                                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                                                           {new Date(v.uploaded_at).toLocaleString()}
                                                                                    </td>
                                                                                    <td className="px-6 py-4 text-right space-x-3">
                                                                                           <a
                                                                                                  href={v.document_url}
                                                                                                  target="_blank"
                                                                                                  rel="noopener noreferrer"
                                                                                                  className="text-xs font-bold text-blue-600 hover:underline"
                                                                                           >
                                                                                                  View Doc
                                                                                           </a>
                                                                                           <button
                                                                                                  onClick={() => handleUpdateVerification(v.id, 'approved')}
                                                                                                  className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-md hover:bg-green-100"
                                                                                           >
                                                                                                  Approve
                                                                                           </button>
                                                                                           <button
                                                                                                  onClick={() => handleUpdateVerification(v.id, 'rejected')}
                                                                                                  className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-md hover:bg-red-100"
                                                                                           >
                                                                                                  Reject
                                                                                           </button>
                                                                                    </td>
                                                                             </tr>
                                                                      ))}
                                                               </tbody>
                                                        </table>
                                                 ) : (
                                                        <div className="p-12 text-center text-gray-400 italic">No pending verifications.</div>
                                                 )}
                                          </div>
                                   </div>
                            </div>
                     )}
                     {activeTab === 'featured' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                   <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                                 <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                                        Currently Featured Specialists ({featuredDoctors.length}/10)
                                                 </h3>
                                          </div>
                                          <div className="overflow-x-auto">
                                                 {featuredDoctors.length > 0 ? (
                                                        <table className="w-full text-left">
                                                               <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                                                                      <tr>
                                                                             <th className="px-6 py-4">Doctor</th>
                                                                             <th className="px-6 py-4">Priority</th>
                                                                             <th className="px-6 py-4">Ends On</th>
                                                                             <th className="px-6 py-4 text-right">Actions</th>
                                                                      </tr>
                                                               </thead>
                                                               <tbody className="divide-y divide-gray-100">
                                                                      {featuredDoctors.map(f => (
                                                                             <tr key={f.id} className="hover:bg-gray-50/50">
                                                                                    <td className="px-6 py-4">
                                                                                           <div className="flex items-center gap-3">
                                                                                                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center font-bold text-indigo-600">
                                                                                                         {f.doctor.profile.name.charAt(0)}
                                                                                                  </div>
                                                                                                  <div className="font-semibold text-gray-900">Dr. {f.doctor.profile.name}</div>
                                                                                           </div>
                                                                                    </td>
                                                                                    <td className="px-6 py-4">
                                                                                           <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                                                                                                  Level {f.priority}
                                                                                           </span>
                                                                                    </td>
                                                                                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                                                                           {new Date(f.end_date).toLocaleDateString(undefined, {
                                                                                                  month: 'short',
                                                                                                  day: 'numeric',
                                                                                                  year: 'numeric'
                                                                                           })}
                                                                                    </td>
                                                                                    <td className="px-6 py-4 text-right">
                                                                                           <button
                                                                                                  onClick={() => handleRemoveFeatured(f.id)}
                                                                                                  className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-md hover:bg-red-100 transition-colors"
                                                                                           >
                                                                                                  Remove
                                                                                           </button>
                                                                                    </td>
                                                                             </tr>
                                                                      ))}
                                                               </tbody>
                                                        </table>
                                                 ) : (
                                                        <div className="p-16 text-center text-gray-400 italic">No doctors are currently featured.</div>
                                                 )}
                                          </div>
                                   </div>
                            </div>
                     )}
              
                     {activeTab === 'no-shows' && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                                   <div className="p-6 border-b border-gray-100">
                                          <h3 className="text-lg font-bold text-gray-800">Patient No-Show Report</h3>
                                   </div>
                                   <div className="overflow-x-auto">
                                          {noShowAppointments.length > 0 ? (
                                                 <table className="w-full text-left">
                                                        <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                                                               <tr>
                                                                      <th className="px-6 py-4">Patient</th>
                                                                      <th className="px-6 py-4">Doctor</th>
                                                                      <th className="px-6 py-4">Appt Date</th>
                                                                      <th className="px-6 py-4">Flagged At</th>
                                                               </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                               {noShowAppointments.map(app => (
                                                                      <tr key={app.id} className="hover:bg-gray-50/50">
                                                                             <td className="px-6 py-4">
                                                                                    <div className="font-semibold text-gray-900">{app.patient_name}</div>
                                                                             </td>
                                                                             <td className="px-6 py-4">
                                                                                    <div className="text-sm text-gray-600">Dr. {app.doctor_name}</div>
                                                                             </td>
                                                                             <td className="px-6 py-4 text-sm text-gray-500">
                                                                                    {app.appointment_date} @ {app.time_slot.substring(0, 5)}
                                                                             </td>
                                                                             <td className="px-6 py-4 text-sm text-gray-500">
                                                                                    {new Date(app.no_show_flagged_at).toLocaleString()}
                                                                             </td>
                                                                      </tr>
                                                               ))}
                                                        </tbody>
                                                 </table>
                                          ) : (
                                                 <div className="p-16 text-center text-gray-400 italic">No patient no-shows recorded.</div>
                                          )}
                                   </div>
                            </div>
                     )}
</div>
       );
};

export default AdminDashboard;
