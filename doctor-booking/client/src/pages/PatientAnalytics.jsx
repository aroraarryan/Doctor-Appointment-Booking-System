import React, { useState, useEffect } from 'react';
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend 
} from 'recharts';
import api from '../utils/api';
import { 
    CalendarIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    CurrencyRupeeIcon,
    ArrowUpIcon,
    ArrowDownIcon
} from '@heroicons/react/24/outline';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const PatientAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const { data } = await api.get('/analytics/patient');
                setData(data);
            } catch (error) {
                console.error('Error fetching analytics:', error);
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
        <div className="p-8 text-center text-gray-500">
            No analytics data available yet. Start booking appointments to see your trends!
        </div>
    );

    const statCards = [
        { title: 'Total Appointments', value: data.total_appointments, icon: CalendarIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: 'Completed', value: data.completed, icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-50' },
        { title: 'Cancelled', value: data.cancelled, icon: XCircleIcon, color: 'text-red-600', bg: 'bg-red-50' },
        { title: 'Total Spent', value: `₹${data.total_spent}`, icon: CurrencyRupeeIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' }
    ];

    return (
        <div className="p-6 md:p-8 space-y-8 bg-gray-50 min-h-screen">
            <header>
                <h1 className="text-2xl font-bold text-gray-900">Your Health Analytics</h1>
                <p className="text-gray-500">Insights into your appointments and spending</p>
            </header>

            {/* Row 1: Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
                        <div className={`p-3 rounded-xl ${stat.bg}`}>
                            <stat.icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">{stat.title}</p>
                            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Row 2: Monthly Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Appointment History</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.appointments_by_month}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Line type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={3} dot={{ fill: '#4F46E5', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Monthly Spending (₹)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.spending_by_month}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    cursor={{ fill: '#F9FAFB' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="amount" fill="#6366F1" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 3: Specialties & Top Doctors */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Visits by Specialty</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.appointments_by_specialty}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.appointments_by_specialty.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Top Doctors Visited</h3>
                    <div className="space-y-4 flex-1">
                        {data.top_doctors.map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center space-x-3">
                                    <img src={doc.avatar_url || 'https://via.placeholder.com/40'} alt={doc.name} className="h-10 w-10 rounded-full border border-white shadow-sm" />
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{doc.name}</p>
                                        <p className="text-xs text-gray-500">{doc.count} visits</p>
                                    </div>
                                </div>
                                <div className="text-indigo-600 font-bold text-sm">#{idx + 1}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1 flex flex-col justify-center items-center text-center">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Health Adherence Score</h3>
                    
                    <div className="relative h-40 w-40 flex items-center justify-center mb-4">
                        <svg className="h-full w-full transform -rotate-90">
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="#F3F4F6"
                                strokeWidth="12"
                                fill="transparent"
                            />
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="#4F46E5"
                                strokeWidth="12"
                                fill="transparent"
                                strokeDasharray={Math.PI * 140}
                                strokeDashoffset={Math.PI * 140 * (1 - data.health_score / 100)}
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-extrabold text-indigo-600">{data.health_score}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Score</span>
                        </div>
                    </div>

                    <div className="space-y-2 w-full max-w-[200px]">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Adherence</span>
                            <span className="font-bold text-gray-800">{Math.round(data.health_metrics.completionRate)}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">No-show rate</span>
                            <span className="font-bold text-red-500">{Math.round(data.health_metrics.noShowRate)}%</span>
                        </div>
                    </div>

                    <div className="mt-6 p-3 bg-yellow-50 rounded-xl text-[10px] text-yellow-800 flex items-start space-x-2">
                        <span className="text-lg mt-0.5">💡</span>
                        <p className="text-left font-medium">
                            {data.health_score > 80 
                                ? "Excellent! You are very consistent with your health appointments."
                                : data.health_score > 50
                                ? "Good effort. Try to reduce cancellations to improve your health tracking."
                                : "Focus on attending your scheduled appointments for better health outcomes."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientAnalytics;
