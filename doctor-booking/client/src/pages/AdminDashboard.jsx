import React, { useState, useEffect } from 'react';
import {
       LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
       XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { 
    UsersIcon, 
    StarIcon, 
    CalendarDaysIcon, 
    BanknotesIcon,
    ArrowTrendingUpIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

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
       const [analyticsData, setAnalyticsData] = useState(null);
       const [loading, setLoading] = useState(true);
       const [page, setPage] = useState(1);
       const [totalPages, setTotalPages] = useState(1);
       const [revenueStats, setRevenueStats] = useState(null);

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

        const fetchAnalytics = async () => {
                setLoading(true);
                try {
                        const { data } = await api.get('/analytics/admin');
                        setAnalyticsData(data);
                } catch (error) {
                        toast.error('Failed to fetch analytics');
                } finally {
                        setLoading(false);
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
                } else if (activeTab === 'analytics') {
                        fetchAnalytics();
                } else if (activeTab === 'revenue') {
                        fetchRevenue();
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

        const fetchRevenue = async () => {
                setLoading(true);
                try {
                        const { data } = await api.get('/admin/revenue-stats');
                        setRevenueStats(data);
                } catch (error) {
                        toast.error('Failed to fetch revenue data');
                } finally {
                        setLoading(false);
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
                     fetchDoctors('approved');
              } catch (error) {
                     toast.error('Failed to feature doctor');
              }
       };

       const handleRemoveFeatured = async (featuredId) => {
              if (!window.confirm('Remove from featured list?')) return;
              try {
                     await api.delete(`/admin/featured/${featuredId}`);
                     toast.success('Removed from featured');
                     fetchFeatured();
                     fetchDoctors('approved');
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

       // Sorting logic for Analytics
       const [sortConfig, setSortConfig] = useState({ key: 'total_earned', direction: 'desc' });
       
       const sortedDoctors = analyticsData?.doctor_performance ? [...analyticsData.doctor_performance].sort((a, b) => {
              if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
              if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
              return 0;
       }) : [];

       const requestSort = (key) => {
              let direction = 'desc';
              if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
              setSortConfig({ key, direction });
       };

       if (loading && (activeTab === 'overview' || activeTab === 'analytics' || activeTab === 'revenue')) {
              return (
                     <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                            <p className="text-gray-500 font-medium tracking-tight">Gathering Platform Intelligence...</p>
                     </div>
              );
       }

       return (
              <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 bg-gray-50 min-h-screen">
                     <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                   <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin Console</h1>
                                   <p className="text-sm text-gray-500 font-medium">Platform operations and growth insights</p>
                            </div>
                            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 overflow-x-auto max-w-full">
                                   {['overview', 'analytics', 'revenue', 'doctors', 'users', 'verifications', 'featured', 'announcements'].map(tab => (
                                          <button
                                                 key={tab}
                                                 onClick={() => setActiveTab(tab)}
                                                 className={`px-5 py-2 rounded-lg text-sm font-bold transition-all shrink-0 ${activeTab === tab
                                                        ? 'bg-indigo-600 text-white shadow-md'
                                                        : 'text-gray-500 hover:bg-gray-50'
                                                        }`}
                                          >
                                                 {tab === 'verifications' ? 'Verification' : tab.replace('-', ' ').charAt(0).toUpperCase() + tab.replace('-', ' ').slice(1)}
                                          </button>
                                   ))}
                            </div>
                     </div>

                     {activeTab === 'overview' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                   {/* Stat Cards */}
                                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                          {[
                                                 { label: 'Total Patients', value: stats?.total_patients, color: 'indigo', icon: UsersIcon },
                                                 { label: 'Total Doctors', value: stats?.total_doctors, color: 'green', icon: StarIcon },
                                                 { label: 'Monthly Appts', value: stats?.appointments_this_month, color: 'blue', icon: CalendarDaysIcon },
                                                 { label: 'Monthly Revenue', value: `₹${stats?.revenue_this_month || 0}`, color: 'amber', icon: BanknotesIcon }
                                          ].map((s, i) => (
                                                 <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
                                                        <div className={`p-3 rounded-xl bg-${s.color}-50`}>
                                                               <s.icon className={`h-6 w-6 text-${s.color}-600`} />
                                                        </div>
                                                        <div>
                                                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{s.label}</p>
                                                               <p className="text-2xl font-black text-gray-900 leading-none">{s.value}</p>
                                                        </div>
                                                 </div>
                                          ))}
                                   </div>

                                   {/* Charts Row 1 */}
                                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                                 <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                                        <ArrowTrendingUpIcon className="h-5 w-5 text-indigo-500" />
                                                        Appointments (Last 30 Days)
                                                 </h3>
                                                 <div className="h-[300px]">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                               <LineChart data={lineData}>
                                                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                                      <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                                                      <YAxis tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                                                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                                                      <Line type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                                                               </LineChart>
                                                        </ResponsiveContainer>
                                                 </div>
                                          </div>

                                          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                                 <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                                        <BanknotesIcon className="h-5 w-5 text-green-500" />
                                                        Revenue (Last 6 Months)
                                                 </h3>
                                                 <div className="h-[300px]">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                               <BarChart data={barData}>
                                                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                                      <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                                                      <YAxis tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                                                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                                                      <Bar dataKey="revenue" fill="#10B981" radius={[6, 6, 0, 0]} />
                                                               </BarChart>
                                                        </ResponsiveContainer>
                                                 </div>
                                          </div>
                                   </div>

                                   {/* Specialty Distribution CTA */}
                                   <div className="bg-indigo-600 p-8 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between shadow-xl shadow-indigo-100">
                                            <div className="mb-4 md:mb-0">
                                                    <h3 className="text-xl font-black mb-1">Deep Dive into Platform Growth</h3>
                                                    <p className="text-indigo-100 text-sm">View retention rates, doctor performance, and future revenue forecasts.</p>
                                            </div>
                                            <button 
                                                    onClick={() => setActiveTab('analytics')}
                                                    className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-black text-sm hover:bg-indigo-50 transition-all shadow-lg"
                                            >
                                                    Open Intelligence Tab
                                            </button>
                                   </div>
                            </div>
                     )}

                     {activeTab === 'analytics' && analyticsData && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* Row 1: Platform KPIs */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                            {[
                                                    { label: 'Total Users', val: analyticsData.overview.total_users.patient + analyticsData.overview.total_users.doctor, sub: `+${analyticsData.overview.new_users_this_month} this mo`, icon: UsersIcon, color: 'indigo' },
                                                    { label: 'Doctors', val: analyticsData.overview.total_users.doctor, sub: 'Verified specialists', icon: StarIcon, color: 'blue' },
                                                    { label: 'Total Appts', val: analyticsData.overview.total_appointments, sub: `${analyticsData.overview.appointments_this_month} this month`, icon: CalendarDaysIcon, color: 'green' },
                                                    { label: 'Revenue', val: `₹${(analyticsData.overview.total_revenue/1000).toFixed(1)}K`, sub: `${analyticsData.overview.revenue_growth >= 0 ? '+' : ''}${analyticsData.overview.revenue_growth}% vs last mo`, icon: BanknotesIcon, color: 'amber' },
                                                    { label: 'Completion', val: `${analyticsData.overview.completion_rate}%`, sub: 'Adherence rate', icon: CheckCircleIcon, color: 'emerald' },
                                                    { label: 'No Show Rate', val: `${analyticsData.no_show_report.average_rate}%`, sub: 'Target: < 10%', icon: ExclamationTriangleIcon, color: 'rose' }
                                            ].map((kpi, i) => (
                                                    <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                                                            <div className={`w-8 h-8 mx-auto mb-2 rounded-lg bg-${kpi.color}-50 flex items-center justify-center`}>
                                                                    <kpi.icon className={`h-4 w-4 text-${kpi.color}-600`} />
                                                            </div>
                                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                                                            <p className="text-lg font-black text-gray-900">{kpi.val}</p>
                                                            <p className="text-[9px] text-gray-500 font-bold mt-1 uppercase tracking-tighter">{kpi.sub}</p>
                                                    </div>
                                            ))}
                                    </div>

                                    {/* Row 2: Charts */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                                    <div className="flex justify-between items-center mb-8">
                                                            <h3 className="text-lg font-black text-gray-900">Revenue Forecast (3M)</h3>
                                                            <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">Predictive AI Enabled</span>
                                                    </div>
                                                    <div className="h-72">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                    <AreaChart data={analyticsData.forecasting}>
                                                                            <defs>
                                                                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                                                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                                                    </linearGradient>
                                                                            </defs>
                                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                                                                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                                                                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                                                                            <Area type="monotone" dataKey="projected_revenue" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                                                                    </AreaChart>
                                                            </ResponsiveContainer>
                                                    </div>
                                            </div>

                                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                                    <h3 className="text-lg font-black text-gray-900 mb-8">User Registration Trends</h3>
                                                    <div className="h-72">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                    <BarChart data={analyticsData.growth_trends}>
                                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                                                                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                                                                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                                                                            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                                                                    </BarChart>
                                                            </ResponsiveContainer>
                                                    </div>
                                            </div>
                                    </div>

                                    {/* Row 3: Doctor Performance Table */}
                                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                                                    <h3 className="text-lg font-black text-gray-900">Leaderboard & Performance</h3>
                                                    <div className="flex gap-2">
                                                            {['total_earned', 'avg_rating', 'no_show_rate'].map(key => (
                                                                    <button 
                                                                            key={key}
                                                                            onClick={() => requestSort(key)}
                                                                            className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${sortConfig.key === key ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-400'}`}
                                                                    >
                                                                            {key.replace(/_/g, ' ')}
                                                                    </button>
                                                            ))}
                                                    </div>
                                            </div>
                                            <div className="overflow-x-auto">
                                                    <table className="w-full text-left">
                                                            <thead>
                                                                    <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest px-6">
                                                                            <th className="px-8 py-4">Specialist</th>
                                                                            <th className="px-6 py-4">Appts / Completed</th>
                                                                            <th className="px-6 py-4">Efficiency</th>
                                                                            <th className="px-6 py-4">Satisfaction</th>
                                                                            <th className="px-6 py-4">Revenue Gen</th>
                                                                            <th className="px-6 py-4">No-Show</th>
                                                                    </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                    {sortedDoctors.map((doc, idx) => (
                                                                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                                                    <td className="px-8 py-4 font-bold text-gray-900">
                                                                                            <div className="flex flex-col">
                                                                                                    <span className="text-sm">Dr. {doc.name}</span>
                                                                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{doc.specialty}</span>
                                                                                            </div>
                                                                                    </td>
                                                                                    <td className="px-6 py-4 font-medium text-gray-600">
                                                                                            {doc.total_appointments} / {Math.round(doc.total_appointments * (doc.completion_rate/100))}
                                                                                    </td>
                                                                                    <td className="px-6 py-4">
                                                                                            <div className="flex items-center gap-2">
                                                                                                    <div className="flex-1 h-1 bg-gray-100 rounded-full max-w-[60px]">
                                                                                                            <div className={`h-full rounded-full ${doc.completion_rate > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${doc.completion_rate}%` }}></div>
                                                                                                    </div>
                                                                                                    <span className="text-xs font-black text-gray-900">{doc.completion_rate}%</span>
                                                                                            </div>
                                                                                    </td>
                                                                                    <td className="px-6 py-4">
                                                                                            <div className="flex items-center gap-1 text-amber-500">
                                                                                                    <StarIcon className="h-4 w-4 fill-current" />
                                                                                                    <span className="text-xs font-black text-gray-900">{doc.avg_rating}</span>
                                                                                            </div>
                                                                                    </td>
                                                                                    <td className="px-6 py-4">
                                                                                            <span className="text-sm font-black text-emerald-600">₹{doc.total_earned.toLocaleString()}</span>
                                                                                    </td>
                                                                                    <td className="px-6 py-4">
                                                                                            <span className={`text-xs font-black ${doc.no_show_rate > 15 ? 'text-rose-500' : 'text-gray-400'}`}>{doc.no_show_rate}%</span>
                                                                                    </td>
                                                                            </tr>
                                                                    ))}
                                                             </tbody>
                                                     </table>
                                            </div>
                                    </div>
                             </div>
                      )}

                      {activeTab === 'revenue' && revenueStats && (
                             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                           {[
                                                  { label: 'Total Platform Revenue', value: `₹${revenueStats.total_platform_revenue.toLocaleString()}`, sub: 'Lifetime Earnings', color: 'indigo', icon: BanknotesIcon },
                                                  { label: 'Subscription Revenue', value: `₹${revenueStats.subscription_revenue.toLocaleString()}`, sub: 'Monthly Recurring', color: 'blue', icon: StarIcon },
                                                  { label: 'Commission Revenue', value: `₹${revenueStats.commission_revenue.toLocaleString()}`, sub: 'From Bookings', color: 'emerald', icon: ArrowTrendingUpIcon }
                                           ].map((stat, i) => (
                                                  <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                                                         <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center mb-6`}>
                                                                <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                                                         </div>
                                                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                                         <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                                                         <p className="text-xs text-gray-500 font-bold mt-2 uppercase tracking-tight">{stat.sub}</p>
                                                  </div>
                                           ))}
                                    </div>

                                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                           <div className="p-6 border-b border-gray-100 bg-gray-50/20 flex justify-between items-center">
                                                  <h3 className="text-lg font-black text-gray-900 tracking-tight">Recent Financial Activity</h3>
                                                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Real-time Feed</span>
                                           </div>
                                           <div className="overflow-x-auto">
                                                  <table className="w-full text-left">
                                                         <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest px-6">
                                                                <tr>
                                                                       <th className="px-8 py-4">Transaction ID</th>
                                                                       <th className="px-6 py-4">Type</th>
                                                                       <th className="px-6 py-4">Amount</th>
                                                                       <th className="px-6 py-4">Commission</th>
                                                                       <th className="px-6 py-4 text-right">Date</th>
                                                                </tr>
                                                         </thead>
                                                         <tbody className="divide-y divide-gray-100">
                                                                {revenueStats.recent_transactions.map((tx, idx) => (
                                                                       <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                                              <td className="px-8 py-4 font-mono text-[10px] font-bold text-gray-400">
                                                                                     {tx.id.substring(0, 12)}...
                                                                              </td>
                                                                              <td className="px-6 py-4">
                                                                                     <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${
                                                                                         tx.type === 'subscription' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                                                                     }`}>
                                                                                            {tx.type}
                                                                                     </span>
                                                                              </td>
                                                                              <td className="px-6 py-4 font-black text-gray-900 text-sm">₹{tx.amount.toLocaleString()}</td>
                                                                              <td className="px-6 py-4 text-xs font-bold text-indigo-600">
                                                                                     {tx.platform_fee ? `₹${tx.platform_fee.toLocaleString()}` : 'N/A'}
                                                                              </td>
                                                                              <td className="px-6 py-4 text-right text-xs font-bold text-gray-500">
                                                                                     {new Date(tx.created_at).toLocaleDateString()}
                                                                              </td>
                                                                       </tr>
                                                                ))}
                                                         </tbody>
                                                  </table>
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
                                                               <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                                                      <tr>
                                                                             <th className="px-6 py-4">Doctor</th>
                                                                             <th className="px-6 py-4">Specialty</th>
                                                                             <th className="px-6 py-4">Experience</th>
                                                                             <th className="px-6 py-4 text-right">Actions</th>
                                                                      </tr>
                                                               </thead>
                                                               <tbody className="divide-y divide-gray-100">
                                                                      {pendingDoctors.map(doc => (
                                                                             <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                                                                                    <td className="px-6 py-4">
                                                                                           <div className="font-bold text-gray-900">{doc.profile.name}</div>
                                                                                           <div className="text-xs text-gray-500">{doc.profile.email}</div>
                                                                                    </td>
                                                                                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{doc.specialty}</td>
                                                                                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{doc.experience} Yrs</td>
                                                                                    <td className="px-6 py-4 text-right space-x-2">
                                                                                           <button
                                                                                                  onClick={() => handleApprove(doc.id)}
                                                                                                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl transition-all"
                                                                                           >
                                                                                                  Approve
                                                                                           </button>
                                                                                           <button
                                                                                                  onClick={() => handleReject(doc.id)}
                                                                                                  className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-4 py-2 rounded-xl transition-all"
                                                                                           >
                                                                                                  Reject
                                                                                           </button>
                                                                                    </td>
                                                                             </tr>
                                                                      ))}
                                                               </tbody>
                                                        </table>
                                                 ) : (
                                                        <div className="p-12 text-center text-gray-400 italic font-medium">No pending approvals.</div>
                                                 )}
                                          </div>
                                   </div>

                                   <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                                 <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                                        Active Specialists ({approvedDoctors.length})
                                                 </h3>
                                          </div>
                                          <div className="overflow-x-auto">
                                                 <table className="w-full text-left">
                                                        <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                                               <tr>
                                                                      <th className="px-6 py-4">Doctor</th>
                                                                      <th className="px-6 py-4">Specialty</th>
                                                                      <th className="px-6 py-4 text-center">Badges</th>
                                                                      <th className="px-6 py-4 text-right">Actions</th>
                                                               </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                               {approvedDoctors.map(doc => (
                                                                      <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                                                                             <td className="px-6 py-4">
                                                                                    <div className="font-bold text-gray-900">{doc.profile.name}</div>
                                                                                    <div className="text-xs text-gray-500">{doc.profile.email}</div>
                                                                             </td>
                                                                             <td className="px-6 py-4 text-sm text-gray-600 font-medium">{doc.specialty}</td>
                                                                             <td className="px-6 py-4 text-center">
                                                                                    <div className="flex flex-col items-center gap-1">
                                                                                            <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                                                                   Verified
                                                                                            </span>
                                                                                            {doc.featured_until && (
                                                                                                   <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">Featured</span>
                                                                                            )}
                                                                                    </div>
                                                                             </td>
                                                                             <td className="px-6 py-4 text-right space-x-2">
                                                                                    <button
                                                                                           onClick={() => handleFeatureDoctor(doc.id)}
                                                                                           className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl hover:bg-indigo-100 transition-all"
                                                                                    >
                                                                                           {doc.featured_until ? 'Promoted' : 'Promote'}
                                                                                    </button>
                                                                                    <button
                                                                                           onClick={() => handleReject(doc.id)}
                                                                                           className="text-[10px] font-black uppercase text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl transition-all"
                                                                                    >
                                                                                           Suspend
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
                                   <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                          <h3 className="text-lg font-bold text-gray-800">User Inventory</h3>
                                   </div>
                                   <div className="overflow-x-auto">
                                          <table className="w-full text-left">
                                                 <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                                        <tr>
                                                               <th className="px-6 py-4">Identity</th>
                                                               <th className="px-6 py-4">System Role</th>
                                                               <th className="px-6 py-4">Onboarding</th>
                                                               <th className="px-6 py-4 text-right">Protection</th>
                                                        </tr>
                                                 </thead>
                                                 <tbody className="divide-y divide-gray-100">
                                                        {users.map(u => (
                                                               <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                                                      <td className="px-6 py-4">
                                                                             <div className="font-bold text-gray-900">{u.name}</div>
                                                                             <div className="text-xs text-gray-500">{u.email}</div>
                                                                      </td>
                                                                      <td className="px-6 py-4">
                                                                             <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${u.role === 'admin' ? 'bg-indigo-600 text-white' :
                                                                                    u.role === 'doctor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                                                                    }`}>
                                                                                    {u.role}
                                                                             </span>
                                                                      </td>
                                                                      <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                                                             {new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                      </td>
                                                                      <td className="px-6 py-4 text-right">
                                                                             {u.role !== 'admin' && (
                                                                                    <button
                                                                                           onClick={() => handleToggleSuspend(u)}
                                                                                           className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-sm ${u.is_suspended
                                                                                                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                                                                  : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                                                                                  }`}
                                                                                    >
                                                                                           {u.is_suspended ? 'Restore Access' : 'Limit Access'}
                                                                                    </button>
                                                                             )}
                                                                      </td>
                                                               </tr>
                                                        ))}
                                                 </tbody>
                                          </table>
                                   </div>
                                   {totalPages > 1 && (
                                          <div className="p-6 bg-gray-50 flex justify-center gap-3">
                                                 <button
                                                        disabled={page === 1}
                                                        onClick={() => setPage(p => p - 1)}
                                                        className="px-4 py-2 border border-gray-200 rounded-xl bg-white disabled:opacity-40 text-xs font-bold hover:border-indigo-500 transition-all shadow-sm"
                                                 >
                                                        Previous
                                                 </button>
                                                 <span className="text-xs font-black self-center text-gray-500 uppercase tracking-widest">Page {page} / {totalPages}</span>
                                                 <button
                                                        disabled={page === totalPages}
                                                        onClick={() => setPage(p => p + 1)}
                                                        className="px-4 py-2 border border-gray-200 rounded-xl bg-white disabled:opacity-40 text-xs font-bold hover:border-indigo-500 transition-all shadow-sm"
                                                 >
                                                        Next
                                                 </button>
                                          </div>
                                   )}
                            </div>
                     )}
                     
                     {activeTab === 'verifications' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                   <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                                 <h3 className="text-lg font-black text-gray-900 tracking-tight">Credentials Verification</h3>
                                          </div>
                                          <div className="overflow-x-auto">
                                                 {verifications.length > 0 ? (
                                                        <table className="w-full text-left">
                                                               <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest px-6">
                                                                      <tr>
                                                                             <th className="px-8 py-4">Practitioner</th>
                                                                             <th className="px-6 py-4">Evidence Type</th>
                                                                             <th className="px-6 py-4">Submission Date</th>
                                                                             <th className="px-6 py-4 text-right">Review</th>
                                                                      </tr>
                                                               </thead>
                                                               <tbody className="divide-y divide-gray-100">
                                                                      {verifications.map(v => (
                                                                             <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                                                                                    <td className="px-8 py-4">
                                                                                           <div className="font-bold text-gray-900">Dr. {v.doctor.profile.name}</div>
                                                                                           <div className="text-[10px] text-gray-500 font-bold uppercase">{v.doctor.specialty}</div>
                                                                                    </td>
                                                                                    <td className="px-6 py-4">
                                                                                           <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100 uppercase tracking-tighter">
                                                                                                  {v.document_type.replace('_', ' ')}
                                                                                           </span>
                                                                                    </td>
                                                                                    <td className="px-6 py-4 text-xs font-bold text-gray-500">
                                                                                           {new Date(v.uploaded_at).toLocaleString(undefined, { dateStyle: 'medium' })}
                                                                                    </td>
                                                                                    <td className="px-6 py-4 text-right space-x-2">
                                                                                           <a href={v.document_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest px-2 py-1">Peek</a>
                                                                                           <button onClick={() => handleUpdateVerification(v.id, 'approved')} className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-4 py-2 rounded-xl hover:bg-emerald-100 uppercase">Approve</button>
                                                                                           <button onClick={() => handleUpdateVerification(v.id, 'rejected')} className="bg-rose-50 text-rose-600 text-[10px] font-black px-4 py-2 rounded-xl hover:bg-rose-100 uppercase">Reject</button>
                                                                                    </td>
                                                                             </tr>
                                                                      ))}
                                                               </tbody>
                                                        </table>
                                                 ) : (
                                                        <div className="p-20 text-center text-gray-400 italic font-black uppercase tracking-widest text-[10px]">Backlog is clear. Great work!</div>
                                                 )}
                                          </div>
                                   </div>
                            </div>
                     )}

                     {activeTab === 'featured' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                   <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                          <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50/20">
                                                 <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                                                        <StarIcon className="h-6 w-6 text-amber-500" />
                                                        Spotlight Specialists
                                                 </h3>
                                                 <p className="text-xs text-gray-500 font-medium mt-1">High-visibility placements on the platform home {featuredDoctors.length}/10 slots used.</p>
                                          </div>
                                          <div className="overflow-x-auto">
                                                 {featuredDoctors.length > 0 ? (
                                                        <table className="w-full text-left">
                                                               <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest px-6">
                                                                      <tr>
                                                                             <th className="px-8 py-4">Specialist</th>
                                                                             <th className="px-6 py-4">Exposure Level</th>
                                                                             <th className="px-6 py-4">Expires On</th>
                                                                             <th className="px-6 py-4 text-right">Curation</th>
                                                                      </tr>
                                                               </thead>
                                                               <tbody className="divide-y divide-gray-100">
                                                                      {featuredDoctors.map(f => (
                                                                             <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                                                                                    <td className="px-8 py-4">
                                                                                           <div className="flex items-center gap-4">
                                                                                                  <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-white shadow-lg shadow-indigo-100">
                                                                                                         {f.doctor.profile.name.charAt(0)}
                                                                                                  </div>
                                                                                                  <div className="font-black text-gray-900">Dr. {f.doctor.profile.name}</div>
                                                                                           </div>
                                                                                    </td>
                                                                                    <td className="px-6 py-4">
                                                                                           <span className="text-[9px] font-black text-orange-700 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100 uppercase tracking-widest">
                                                                                                  Priority {f.priority}
                                                                                           </span>
                                                                                    </td>
                                                                                    <td className="px-6 py-4 text-xs font-black text-gray-500 uppercase">
                                                                                           {new Date(f.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                                    </td>
                                                                                    <td className="px-6 py-4 text-right">
                                                                                           <button onClick={() => handleRemoveFeatured(f.id)} className="text-[10px] font-black text-rose-600 bg-rose-50 px-4 py-2 rounded-xl hover:bg-rose-100 transition-all uppercase tracking-widest">Remove</button>
                                                                                    </td>
                                                                             </tr>
                                                                      ))}
                                                               </tbody>
                                                        </table>
                                                 ) : (
                                                        <div className="p-24 text-center">
                                                                <StarIcon className="h-12 w-12 text-gray-100 mx-auto mb-4" />
                                                                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No specialists currently in the spotlight.</p>
                                                        </div>
                                                 )}
                                          </div>
                                   </div>
                            </div>
                     )}

                     {activeTab === 'announcements' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="lg:col-span-1">
                                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-8">
                                                    <h3 className="text-lg font-black text-gray-900 mb-6">Broadcast Message</h3>
                                                    <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                                                            <div>
                                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Subject</label>
                                                                    <input name="title" required className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-sm" />
                                                            </div>
                                                            <div>
                                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Content</label>
                                                                    <textarea name="content" required rows="4" className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-medium text-sm" />
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Target</label>
                                                                            <select name="target_role" className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-xs">
                                                                                    <option value="all">Everyone</option>
                                                                                    <option value="patient">Patients</option>
                                                                                    <option value="doctor">Doctors</option>
                                                                            </select>
                                                                    </div>
                                                                    <div>
                                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Urgency</label>
                                                                            <select name="type" className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-xs">
                                                                                    <option value="info">Info</option>
                                                                                    <option value="warning">Warning</option>
                                                                                    <option value="urgent">Urgent</option>
                                                                                    <option value="maintenance">Maintenance</option>
                                                                            </select>
                                                                    </div>
                                                            </div>
                                                            <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 mt-2">Publish Broadcast</button>
                                                    </form>
                                            </div>
                                    </div>
                                    <div className="lg:col-span-2 space-y-4">
                                            {announcements.length > 0 ? announcements.map(ann => (
                                                    <div key={ann.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                                                            <div className={`p-3 rounded-2xl ${
                                                                    ann.type === 'urgent' ? 'bg-rose-50 text-rose-600' :
                                                                    ann.type === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                                                            }`}>
                                                                    <ExclamationTriangleIcon className="h-6 w-6" />
                                                            </div>
                                                            <div className="flex-1">
                                                                    <div className="flex justify-between items-start mb-2">
                                                                            <div>
                                                                                    <h4 className="font-black text-gray-900 leading-tight">{ann.title}</h4>
                                                                                    <div className="flex gap-2 mt-1">
                                                                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">To: {ann.target_role}</span>
                                                                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">•</span>
                                                                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{new Date(ann.created_at).toLocaleDateString()}</span>
                                                                                    </div>
                                                                            </div>
                                                                            <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-rose-400 hover:text-rose-600 p-2 transition-colors">
                                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                            </button>
                                                                    </div>
                                                                    <p className="text-gray-600 text-sm leading-relaxed">{ann.content}</p>
                                                            </div>
                                                    </div>
                                            )) : (
                                                    <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm text-center">
                                                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No active announcements.</p>
                                                    </div>
                                            )}
                                    </div>
                            </div>
                     )}
              </div>
       );
};

export default AdminDashboard;
