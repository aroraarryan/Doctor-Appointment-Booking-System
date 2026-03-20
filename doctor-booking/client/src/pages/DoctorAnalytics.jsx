import React, { useState, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    LineChart, Line, PieChart, Pie, Cell, Legend 
} from 'recharts';
import api from '../utils/api';
import { 
    UsersIcon, 
    CalendarDaysIcon, 
    BanknotesIcon, 
    StarIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ClockIcon,
    NoSymbolIcon
} from '@heroicons/react/24/outline';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const DoctorAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const { data } = await api.get('/analytics/doctor');
                setData(data);
            } catch (error) {
                console.error('Error fetching doctor analytics:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!data) return (
        <div className="p-8 text-center text-gray-500 italic">
            Dashboard is populating. Complete some appointments to see your insights.
        </div>
    );

    // Insight generation logic
    const insights = [];
    const busiestDay = [...data.appointments_by_day_of_week].sort((a,b) => b.count - a.count)[0];
    if (busiestDay && busiestDay.count > 0) {
        insights.push({
            type: 'info',
            text: `Your busiest day is ${busiestDay.day}. Consider adding more slots or optimizing these hours.`,
            icon: CalendarDaysIcon
        });
    }

    const lastNoShow = data.no_show_rate_trend[5]?.rate || 0;
    const prevNoShow = data.no_show_rate_trend[4]?.rate || 0;
    if (lastNoShow > prevNoShow) {
        insights.push({
            type: 'warning',
            text: `No-show rate increased by ${lastNoShow - prevNoShow}% this month. Consider reminding patients via chat.`,
            icon: NoSymbolIcon
        });
    } else if (lastNoShow < prevNoShow) {
        insights.push({
            type: 'success',
            text: `Great! Your no-show rate decreased by ${prevNoShow - lastNoShow}% this month.`,
            icon: CheckCircleIcon
        });
    }

    const StatCard = ({ title, value, icon: Icon, color, bg }) => (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${bg}`}>
                <Icon className={`h-6 w-6 ${color}`} />
            </div>
            <div>
                <p className="text-sm text-gray-400 font-medium">{title}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="p-6 md:p-8 space-y-8 bg-gray-50 min-h-screen">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Practice Performance</h1>
                    <p className="text-gray-500">Analyze your growth and patient satisfaction</p>
                </div>
                <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">
                    Dr. Dashboard
                </div>
            </header>

            {/* Row 1: Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Patients" value={data.unique_patients} icon={UsersIcon} color="text-blue-600" bg="bg-blue-50" />
                <StatCard title="Appointments" value={data.total_appointments} icon={CalendarDaysIcon} color="text-indigo-600" bg="bg-indigo-50" />
                <StatCard title="Total Earned" value={`₹${data.total_earned.toLocaleString()}`} icon={BanknotesIcon} color="text-green-600" bg="bg-green-50" />
                <StatCard title="Avg Rating" value={Number(data.average_rating).toFixed(1)} icon={StarIcon} color="text-yellow-500" bg="bg-yellow-50" />
            </div>

            {/* Row 2: Charts (Heatmap & Days) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center space-x-2">
                        <ClockIcon className="h-5 w-5 text-indigo-500" />
                        <span>Busiest Times (Hour of Day)</span>
                    </h3>
                    <div className="grid grid-cols-6 md:grid-cols-13 gap-1">
                        {data.appointments_by_hour.map((h, i) => {
                            const intensity = h.count > 0 ? Math.min(900, h.count * 200 + 100) : 50;
                            return (
                                <div key={i} className="flex flex-col items-center group relative">
                                    <div 
                                        className={`w-full h-12 rounded-lg transition-all ${h.count > 0 ? 'bg-indigo-600' : 'bg-gray-100'}`}
                                        style={{ opacity: h.count > 0 ? Math.max(0.2, h.count / Math.max(...data.appointments_by_hour.map(x => x.count || 1))) : 1 }}
                                    ></div>
                                    <span className="text-[10px] text-gray-400 mt-2 font-medium">{h.hour.split(':')[0]}h</span>
                                    
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10">
                                        {h.count} appointments at {h.hour}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Appointments by Day</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.appointments_by_day_of_week}>
                                <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={10} stroke="#9CA3AF" />
                                <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#9CA3AF" />
                                <Tooltip cursor={{ fill: '#F9FAFB' }} />
                                <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 3: Revenue & Retention */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center space-x-2">
                        <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
                        <span>Monthly Revenue (₹)</span>
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.revenue_by_month}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} stroke="#9CA3AF" />
                                <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="#9CA3AF" />
                                <Tooltip />
                                <Line type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={4} dot={{ r: 4, fill: '#10B981' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Patient Retention</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.patient_retention}
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.patient_retention.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 4: Diagnoses & No-Show */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Common Diagnoses</h3>
                    <div className="space-y-3">
                        {data.top_diagnoses.map((diag, idx) => {
                            const max = Math.max(...data.top_diagnoses.map(d => d.count));
                            return (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-xs font-medium text-gray-600">
                                        <span>{diag.name}</span>
                                        <span>{diag.count} cases</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(diag.count/max)*100}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                        <NoSymbolIcon className="h-5 w-5 text-red-500" />
                        <span>Monthly No-Show Rate (%)</span>
                    </h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.no_show_rate_trend}>
                                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={10} />
                                <Tooltip />
                                <Bar dataKey="rate" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 5: Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border flex items-start space-x-3 ${
                        insight.type === 'warning' ? 'bg-red-50 border-red-100 text-red-800' :
                        insight.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' :
                        'bg-blue-50 border-blue-100 text-blue-800'
                    }`}>
                        <div className={`p-2 rounded-lg ${
                            insight.type === 'warning' ? 'bg-red-100' :
                            insight.type === 'success' ? 'bg-green-100' :
                            'bg-blue-100'
                        }`}>
                            <insight.icon className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium leading-relaxed">{insight.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DoctorAnalytics;
