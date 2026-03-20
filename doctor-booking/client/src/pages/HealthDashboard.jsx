import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  HeartIcon, 
  BeakerIcon, 
  ScaleIcon, 
  FireIcon, 
  ArrowPathIcon,
  PlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const HealthDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [todaySchedule, setTodaySchedule] = useState({ schedule: [], adherenceRate: 100 });
  const [recentSymptoms, setRecentSymptoms] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryRes, scheduleRes, symptomsRes] = await Promise.all([
        api.get('/health-metrics/summary'),
        api.get('/medicine-reminders/today'),
        api.get('/symptom-checker/history')
      ]);
      setSummary(summaryRes.data);
      setTodaySchedule(scheduleRes.data);
      setRecentSymptoms(symptomsRes.data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching health data:', error);
      toast.error('Failed to load health data');
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab summary={summary} schedule={todaySchedule} symptoms={recentSymptoms} onRefresh={fetchDashboardData} setActiveTab={setActiveTab} />;
      case 'metrics': return <MetricsTab />;
      case 'medicines': return <MedicinesTab />;
      case 'symptoms': return <SymptomsTab />;
      case 'bmi': return <BMITab />;
      default: return <OverviewTab />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Health Suite</h1>
          <p className="text-gray-500 font-medium mt-2">Personal health monitoring and AI-powered tools.</p>
        </div>
        <div className="flex bg-gray-100/80 p-1.5 rounded-2xl backdrop-blur-sm self-start md:self-center overflow-x-auto max-w-full no-scrollbar">
          {['overview', 'metrics', 'medicines', 'symptoms', 'bmi'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-white text-indigo-600 shadow-lg shadow-indigo-100 translate-y-[-1px]' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              {tab.charAt(0) + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent shadow-xl"></div>
        </div>
      ) : (
        renderTabContent()
      )}
    </div>
  );
};

// --- TAB COMPONENTS ---

const OverviewTab = ({ summary, schedule, symptoms, onRefresh, setActiveTab }) => {
  const metricsInfo = [
    { type: 'blood_pressure_systolic', label: 'Blood Pressure', icon: <HeartIcon className="w-6 h-6" />, color: 'red' },
    { type: 'blood_sugar_fasting', label: 'Blood Sugar', icon: <BeakerIcon className="w-6 h-6" />, color: 'blue' },
    { type: 'weight', label: 'Weight', icon: <ScaleIcon className="w-6 h-6" />, color: 'green' },
    { type: 'heart_rate', label: 'Heart Rate', icon: <FireIcon className="w-6 h-6" />, color: 'orange' }
  ];

  const handleMarkTaken = async (reminderId, scheduledTime) => {
    try {
      await api.post(`/medicine-reminders/${reminderId}/log`, {
        status: 'taken',
        scheduled_time: scheduledTime
      });
      toast.success('Medicine marked as taken');
      onRefresh();
    } catch (error) {
      toast.error('Failed to log medicine');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Metrics Summary */}
      <div className="lg:col-span-2 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metricsInfo.map(m => {
            const data = summary[m.type] || { value: '--', unit: '', status: 'neutral' };
            const statusColors = {
              critical: 'bg-red-100 text-red-600 border-red-200',
              warning: 'bg-yellow-100 text-yellow-600 border-yellow-200',
              normal: 'bg-green-100 text-green-600 border-green-200',
              neutral: 'bg-gray-100 text-gray-400 border-gray-200'
            };

            return (
              <div key={m.type} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 bg-${m.color}-500 group-hover:scale-150 transition-transform duration-500`}></div>
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl bg-${m.color}-50 text-${m.color}-600`}>
                    {m.icon}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColors[data.status]}`}>
                    {data.status}
                  </span>
                </div>
                <div>
                  <h3 className="text-gray-500 font-bold text-sm uppercase tracking-wide">{m.label}</h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-gray-900">{data.value}</span>
                    <span className="text-gray-400 font-bold text-sm">{data.unit}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-4 font-medium flex items-center gap-1">
                    <ArrowPathIcon className="w-3 h-3" />
                    Last recorded: {data.recorded_at ? new Date(data.recorded_at).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Symptom Checks */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-gray-900">Recent AI Assessments</h2>
            <button onClick={() => setActiveTab('symptoms')} className="text-indigo-600 font-bold text-sm hover:underline">View History</button>
          </div>
          {symptoms.length > 0 ? (
            <div className="space-y-4">
              {symptoms.map(s => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${
                      s.urgency_level === 'emergency' ? 'bg-red-100 text-red-600' : 
                      s.urgency_level === 'high' ? 'bg-orange-100 text-orange-600' :
                      'bg-indigo-100 text-indigo-600'
                    }`}>
                      <InformationCircleIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 line-clamp-1">{s.symptoms.join(', ')}</p>
                      <p className="text-xs text-gray-400 font-medium">{new Date(s.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-medium">No assessments yet.</p>
              <button 
                onClick={() => setActiveTab('symptoms')}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100"
              >
                Start Symptom Check
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Today's Medicines */}
      <div className="space-y-8">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-lg font-black mb-1">Today's Adherence</h2>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-black">{schedule.adherenceRate}%</span>
              <span className="text-indigo-100 font-bold">Goal: 100%</span>
            </div>
            <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${schedule.adherenceRate}%` }}></div>
            </div>
            <p className="text-sm text-indigo-100 font-medium">Keep it up! Consistency is key to your health.</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-gray-900">Today's Schedule</h2>
            <button onClick={() => setActiveTab('medicines')} className="text-indigo-600 font-bold text-sm hover:underline">Full Plan</button>
          </div>
          <div className="space-y-4">
            {schedule.schedule.length > 0 ? (
              schedule.schedule.map((med, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-50 hover:border-indigo-100 transition-all">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${
                    med.status === 'taken' ? 'bg-green-100 text-green-600' :
                    med.status === 'missed' ? 'bg-red-50 text-red-500' :
                    'bg-indigo-50 text-indigo-600'
                  }`}>
                    {med.status === 'taken' ? <CheckCircleIcon className="w-6 h-6" /> : med.display_time.substring(0, 5)}
                  </div>
                  <div className="flex-1">
                    <p className={`font-black ${med.status === 'taken' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{med.medicine_name}</p>
                    <p className="text-xs text-gray-400 font-bold">{med.dosage}</p>
                  </div>
                  {med.status === 'pending' && (
                    <button 
                      onClick={() => handleMarkTaken(med.id, med.scheduled_time)}
                      className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center py-6 text-gray-400 font-medium">No medicines scheduled for today.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- PLACEHOLDERS FOR OTHER TABS (To implement next) ---
const MetricsTab = () => {
  const [metricType, setMetricType] = useState('blood_pressure_systolic');
  const [days, setDays] = useState('30');
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [formData, setFormData] = useState({ value: '', notes: '', date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    fetchMetrics();
  }, [metricType, days]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get(`/health-metrics?type=${metricType}&days=${days}`);
      setData(res.data);
      setStats(res.stats);
    } catch (error) {
      toast.error('Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleLogMetric = async (e) => {
    e.preventDefault();
    try {
      const unitMap = {
        blood_pressure_systolic: 'mmHg',
        blood_pressure_diastolic: 'mmHg',
        blood_sugar_fasting: 'mg/dL',
        blood_sugar_postprandial: 'mg/dL',
        weight: 'kg',
        heart_rate: 'bpm',
        oxygen_saturation: '%',
        temperature: '°C'
      };

      await api.post('/health-metrics', {
        metric_type: metricType,
        value: parseFloat(formData.value),
        unit: unitMap[metricType],
        notes: formData.notes,
        recorded_at: formData.date
      });
      toast.success('Metric recorded successfully');
      setShowLogForm(false);
      setFormData({ value: '', notes: '', date: new Date().toISOString().split('T')[0] });
      fetchMetrics();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to log metric');
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'blood_pressure_systolic', label: 'BP Systolic' },
              { id: 'blood_sugar_fasting', label: 'Blood Sugar' },
              { id: 'weight', label: 'Weight' },
              { id: 'heart_rate', label: 'Heart Rate' },
              { id: 'oxygen_saturation', label: 'Oxygen %' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMetricType(m.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                  metricType === m.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-100 hover:border-indigo-100'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <select 
              value={days} 
              onChange={e => setDays(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
            <button 
              onClick={() => setShowLogForm(true)}
              className="flex-1 md:flex-none px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-5 h-5" /> Log Reading
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-80 bg-gray-50 rounded-2xl animate-pulse"></div>
        ) : (
          <div className="h-96 w-full -ml-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={d => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px',
                    fontWeight: 800
                  }} 
                  labelFormatter={d => new Date(d).toLocaleDateString()}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#4f46e5" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorMetric)" 
                  dot={{ r: 6, fill: '#4f46e5', strokeWidth: 3, stroke: '#fff' }}
                  activeDot={{ r: 8, fill: '#4f46e5', strokeWidth: 4, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mt-12">
          {[
            { label: 'Minimum', value: stats.min },
            { label: 'Maximum', value: stats.max },
            { label: 'Average', value: stats.average },
            { label: 'Latest', value: stats.latest },
            { label: 'Trend', value: stats.trend, isTrend: true }
          ].map((s, i) => (
            <div key={i} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1">{s.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-gray-900">{s.value}</span>
                {s.isTrend && (
                  <span className={`text-xs font-bold ${s.value === 'increasing' ? 'text-orange-500' : s.value === 'decreasing' ? 'text-green-500' : 'text-gray-400'}`}>
                    {s.value === 'increasing' ? '↑' : s.value === 'decreasing' ? '↓' : '→'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showLogForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl scale-in-center overflow-hidden relative">
            <h3 className="text-2xl font-black text-gray-900 mb-6 capitalize">Log {metricType.replace(/_/g, ' ')}</h3>
            <form onSubmit={handleLogMetric} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Value</label>
                <input 
                  type="number" 
                  step="0.1"
                  required
                  value={formData.value}
                  onChange={e => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-600 focus:outline-none transition-all font-bold"
                  placeholder="Enter reading"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Date</label>
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-600 focus:outline-none transition-all font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Notes (Optional)</label>
                <textarea 
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-600 focus:outline-none transition-all font-bold resize-none h-24"
                  placeholder="How are you feeling?"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowLogForm(false)}
                  className="flex-1 px-6 py-4 rounded-2xl font-black text-gray-400 hover:bg-gray-50 transition-all border-2 border-transparent"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  Save Reading
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const MedicinesTab = () => {
  const [schedule, setSchedule] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReminder, setNewReminder] = useState({
    medicine_name: '',
    dosage: '',
    reminder_times: ['09:00'],
    days_of_week: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [scheduleRes, remindersRes] = await Promise.all([
        api.get('/medicine-reminders/today'),
        api.get('/medicine-reminders')
      ]);
      setSchedule(scheduleRes.data.schedule);
      setReminders(remindersRes.data);
    } catch (error) {
      toast.error('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  };

  const handleLogIntake = async (id, scheduledTime, status) => {
    try {
      await api.post(`/medicine-reminders/${id}/log`, { status, scheduled_time: scheduledTime });
      toast.success(`Medicine ${status}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to log intake');
    }
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    try {
      await api.post('/medicine-reminders', newReminder);
      toast.success('Reminder added');
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to add reminder');
    }
  };

  const handleDeactivate = async (id) => {
    if (window.confirm('Stop this reminder?')) {
      try {
        await api.delete(`/medicine-reminders/${id}`);
        toast.success('Reminder stopped');
        fetchData();
      } catch (error) {
        toast.error('Failed to stop reminder');
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Today's Timeline */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-gray-900">Today's Timeline</h2>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
          
          <div className="space-y-10 relative before:absolute before:inset-y-0 before:left-6 before:w-1 before:bg-gray-50 before:rounded-full">
            {schedule.length > 0 ? (
              schedule.map((task, i) => (
                <div key={i} className="relative flex items-center gap-8 group">
                  <div className={`z-10 w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all shadow-sm ${
                    task.status === 'taken' ? 'bg-green-600 text-white' :
                    task.status === 'missed' ? 'bg-red-500 text-white' :
                    'bg-indigo-50 text-indigo-600 border-2 border-indigo-100'
                  }`}>
                    {task.status === 'taken' ? <CheckCircleIcon className="w-7 h-7" /> : task.display_time.substring(0, 5)}
                  </div>
                  <div className={`flex-1 p-6 rounded-2xl border transition-all ${
                    task.status === 'taken' ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-100 hover:shadow-lg'
                  }`}>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-black tracking-tight ${task.status === 'taken' ? 'text-gray-400 line-through' : 'text-gray-900 text-lg'}`}>{task.medicine_name}</h3>
                      <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter ${
                        task.status === 'taken' ? 'bg-green-100 text-green-700' :
                        task.status === 'missed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{task.status}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-400">{task.dosage}</p>
                    
                    {task.status === 'pending' && (
                      <div className="flex gap-2 mt-4">
                        <button 
                          onClick={() => handleLogIntake(task.id, task.scheduled_time, 'taken')}
                          className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-black hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                        >
                          Mark Taken
                        </button>
                        <button 
                          onClick={() => handleLogIntake(task.id, task.scheduled_time, 'skipped')}
                          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-black hover:bg-gray-200 transition-all"
                        >
                          Skip
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-400 font-bold">No doses for today.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reminders List */}
      <div className="space-y-8">
        <button 
          onClick={() => setShowAddForm(true)}
          className="w-full p-6 bg-indigo-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 group"
        >
          <PlusIcon className="w-7 h-7 group-hover:rotate-90 transition-transform" /> Add New Medicine
        </button>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-xl font-black text-gray-900 mb-6">Active Plans</h2>
          <div className="space-y-4">
            {reminders.map(r => (
              <div key={r.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-black text-gray-800">{r.medicine_name}</h3>
                  <button onClick={() => handleDeactivate(r.id)} className="text-red-400 hover:text-red-600 font-black text-xs opacity-0 group-hover:opacity-100 transition-opacity">Stop</button>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-bold flex items-center gap-1">
                    <InformationCircleIcon className="w-3 h-3" /> {r.dosage} • {r.reminder_times.length} doses/day
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">Ends {new Date(r.end_date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
          <h3 className="text-indigo-900 font-black text-sm mb-2 flex items-center gap-2">
            <InformationCircleIcon className="w-5 h-5" /> Adherence Tip
          </h3>
          <p className="text-indigo-700 text-xs font-medium leading-relaxed">
            Taking your medicine at the same time every day helps build a habit. Set reminders for meals or other daily activities.
          </p>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl scale-in-center max-h-[90vh] overflow-y-auto">
            <h3 className="text-3xl font-black text-gray-900 mb-8">Add Reminder</h3>
            <form onSubmit={handleAddReminder} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Medicine Name</label>
                  <input 
                    type="text" required
                    className="w-full px-5 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-600 focus:outline-none transition-all font-bold"
                    value={newReminder.medicine_name}
                    onChange={e => setNewReminder({...newReminder, medicine_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Dosage (e.g. 1 pill, 5ml)</label>
                  <input 
                    type="text" required
                    className="w-full px-5 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-600 focus:outline-none transition-all font-bold"
                    value={newReminder.dosage}
                    onChange={e => setNewReminder({...newReminder, dosage: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Start Date</label>
                    <input 
                      type="date" required
                      className="w-full px-5 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-600 focus:outline-none transition-all font-bold text-sm"
                      value={newReminder.start_date}
                      onChange={e => setNewReminder({...newReminder, start_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">End Date</label>
                    <input 
                      type="date" required
                      className="w-full px-5 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-600 focus:outline-none transition-all font-bold text-sm"
                      value={newReminder.end_date}
                      onChange={e => setNewReminder({...newReminder, end_date: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Reminder Times</label>
                  <div className="space-y-3">
                    {newReminder.reminder_times.map((t, i) => (
                      <div key={i} className="flex gap-2">
                        <input 
                          type="time" required
                          className="flex-1 px-5 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-600 focus:outline-none transition-all font-bold"
                          value={t}
                          onChange={e => {
                            const nt = [...newReminder.reminder_times];
                            nt[i] = e.target.value;
                            setNewReminder({...newReminder, reminder_times: nt});
                          }}
                        />
                        {newReminder.reminder_times.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => {
                              const nt = newReminder.reminder_times.filter((_, idx) => idx !== i);
                              setNewReminder({...newReminder, reminder_times: nt});
                            }}
                            className="p-3 text-red-500 hover:bg-red-50 rounded-xl"
                          >
                            <PlusIcon className="w-5 h-5 rotate-45" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button 
                      type="button"
                      onClick={() => setNewReminder({...newReminder, reminder_times: [...newReminder.reminder_times, '12:00']})}
                      className="text-xs font-black text-indigo-600 flex items-center gap-1 hover:underline"
                    >
                      <PlusIcon className="w-4 h-4" /> Add dose
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Repeat Days</label>
                  <div className="flex flex-wrap gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          const nd = newReminder.days_of_week.includes(d) 
                            ? newReminder.days_of_week.filter(day => day !== d)
                            : [...newReminder.days_of_week, d];
                          setNewReminder({...newReminder, days_of_week: nd});
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                          newReminder.days_of_week.includes(d) 
                            ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {d.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-8 py-4 rounded-2xl font-black text-gray-400 hover:bg-gray-50 transition-all border-2 border-transparent"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
const SymptomsTab = () => {
  const [step, setStep] = useState(1);
  const [symptoms, setSymptoms] = useState([]);
  const [currentSymptom, setCurrentSymptom] = useState('');
  const [answers, setAnswers] = useState({ duration: 'today', severity: 5, age: '25-40', existing_conditions: [] });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/symptom-checker/history');
      setHistory(data);
    } catch (error) {
      console.error('History fetch error');
    }
  };

  const commonSymptoms = ['Headache', 'Fever', 'Cough', 'Fatigue', 'Nausea', 'Back Pain', 'Dizziness', 'Sore Throat'];

  const handleAddSymptom = (s) => {
    if (s && !symptoms.includes(s)) {
      setSymptoms([...symptoms, s]);
      setCurrentSymptom('');
    }
  };

  const handleCheck = async () => {
    try {
      setLoading(true);
      const { data } = await api.post('/symptom-checker', { symptoms, answers });
      setResult(data);
      setStep(3);
      fetchHistory();
    } catch (error) {
      toast.error('AI analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 3 && result) {
    const { assessment, matching_doctors } = result;
    const urgencyColors = {
      emergency: 'bg-red-600 text-white shadow-red-200',
      high: 'bg-orange-500 text-white shadow-orange-200',
      medium: 'bg-yellow-500 text-white shadow-yellow-100',
      low: 'bg-green-500 text-white shadow-green-100'
    };

    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
        <div className={`p-8 rounded-3xl shadow-2xl ${urgencyColors[assessment.urgency_level]} relative overflow-hidden`}>
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/20 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-4 py-2 rounded-full">Assessment Result</span>
              <span className="text-4xl font-black capitalize">{assessment.urgency_level} Urgency</span>
            </div>
            <p className="text-xl font-bold leading-relaxed opacity-95 mb-8">{assessment.assessment}</p>
            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-md">
              <h4 className="font-black text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5" /> When to seek emergency care
              </h4>
              <p className="font-medium text-sm leading-relaxed">{assessment.when_to_seek_emergency}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 mb-6">Suggested Specialists</h3>
            <div className="space-y-4">
              {assessment.suggested_specialties.map((spec, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all group">
                  <span className="font-black text-gray-700">{spec}</span>
                  <button 
                    onClick={() => navigate(`/doctors?specialty=${spec}`)}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100 overflow-hidden relative group">
             <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
             <h3 className="text-xl font-black mb-6 relative z-10">Top Verified Doctors</h3>
             <div className="space-y-4 relative z-10 text-gray-900">
               {matching_doctors.map(doc => (
                 <div key={doc.id} className="flex items-center gap-4 p-3 bg-white/95 rounded-2xl backdrop-blur-md hover:translate-x-2 transition-transform cursor-pointer" onClick={() => navigate(`/doctors/${doc.id}`)}>
                   <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600">
                     {doc.profile.name.charAt(0)}
                   </div>
                   <div className="flex-1">
                     <p className="font-black text-sm tracking-tight">{doc.profile.name}</p>
                     <p className="text-[10px] font-bold text-gray-400 capitalize">{doc.specialty}</p>
                   </div>
                   <ChevronRightIcon className="w-4 h-4 text-gray-300" />
                 </div>
               ))}
               {matching_doctors.length === 0 && <p className="text-white/80 text-sm font-medium">No direct matches found. Try searching by specialty.</p>}
             </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200">
          <p className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase tracking-widest text-center">Disclaimer: {assessment.disclaimer}</p>
        </div>

        <div className="flex justify-center pt-8">
          <button 
            onClick={() => { setStep(1); setSymptoms([]); setResult(null); }}
            className="px-10 py-4 bg-white text-gray-600 border-2 border-gray-100 rounded-2xl font-black hover:bg-gray-50 transition-all shadow-sm"
          >
            Start New Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
        
        {step === 1 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5">
            <div className="text-center">
              <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">How are you feeling?</h2>
              <p className="text-gray-400 font-bold">Describe your symptoms as clearly as possible.</p>
            </div>
            
            <div className="space-y-6">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Type a symptom and press Enter..."
                  className="w-full px-8 py-6 bg-gray-50 border-2 border-gray-100 rounded-3xl focus:border-indigo-600 focus:outline-none transition-all font-bold text-lg"
                  value={currentSymptom}
                  onChange={e => setCurrentSymptom(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSymptom(currentSymptom)}
                />
                <button 
                  onClick={() => handleAddSymptom(currentSymptom)}
                  className="absolute right-4 top-4 bottom-4 px-6 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {symptoms.map(s => (
                  <span key={s} className="px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-xs flex items-center gap-2 group animate-in zoom-in duration-300">
                    {s}
                    <button onClick={() => setSymptoms(symptoms.filter(x => x !== s))} className="hover:text-red-500 transition-colors">
                      <PlusIcon className="w-4 h-4 rotate-45" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="pt-6 border-t border-gray-50">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 text-center">Suggested Common Symptoms</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {commonSymptoms.map(s => (
                    <button 
                      key={s}
                      onClick={() => handleAddSymptom(s)}
                      disabled={symptoms.includes(s)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        symptoms.includes(s) ? 'bg-gray-100 text-gray-300' : 'bg-white text-gray-500 border border-gray-100 hover:border-indigo-100 hover:text-indigo-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-8">
              <button 
                disabled={symptoms.length === 0}
                onClick={() => setStep(2)}
                className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-lg shadow-2xl shadow-indigo-100 hover:bg-indigo-700 disabled:bg-gray-200 disabled:shadow-none transition-all"
              >
                Continue Assessment
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-5">
            <div className="text-center">
              <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Need a bit more info...</h2>
              <p className="text-gray-400 font-bold">Help us refine your assessment.</p>
            </div>

            <div className="space-y-8">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">How long has this been going on?</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['today', '2-3 days', 'a week', 'month+'].map(d => (
                    <button 
                      key={d}
                      onClick={() => setAnswers({...answers, duration: d})}
                      className={`py-3 rounded-2xl text-xs font-black transition-all ${
                        answers.duration === d ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Symptom Severity</label>
                  <span className={`px-3 py-1 rounded-lg text-xs font-black ${
                    answers.severity > 7 ? 'bg-red-100 text-red-600' : 
                    answers.severity > 4 ? 'bg-yellow-100 text-yellow-600' :
                    'bg-green-100 text-green-600'
                  }`}>{answers.severity}/10</span>
                </div>
                <input 
                  type="range" min="1" max="10" 
                  className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  value={answers.severity}
                  onChange={e => setAnswers({...answers, severity: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Existing Conditions (if any)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['Diabetes', 'Hypertension', 'Asthma', 'Thyroid', 'None'].map(c => (
                    <button 
                      key={c}
                      onClick={() => {
                        const nc = answers.existing_conditions.includes(c) 
                          ? answers.existing_conditions.filter(x => x !== c)
                          : [...answers.existing_conditions, c];
                        setAnswers({...answers, existing_conditions: nc});
                      }}
                      className={`p-4 rounded-2xl border-2 text-sm font-black text-left transition-all ${
                        answers.existing_conditions.includes(c) ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-50 text-gray-500 hover:border-gray-100'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-8">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 py-5 bg-white text-gray-400 border-2 border-gray-100 rounded-3xl font-black text-lg hover:bg-gray-50 transition-all"
              >
                Back
              </button>
              <button 
                onClick={handleCheck}
                disabled={loading}
                className="flex-[2] py-5 bg-indigo-600 text-white rounded-3xl font-black text-lg shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
              >
                {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Start Analysis'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 space-y-6">
        <h3 className="text-xl font-black text-gray-900 px-2">Past Assessments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {history.map(h => (
            <div key={h.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                  h.urgency_level === 'emergency' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'
                }`}>{h.urgency_level}</span>
                <span className="text-[10px] text-gray-300 font-bold">{new Date(h.created_at).toLocaleDateString()}</span>
              </div>
              <p className="font-black text-gray-800 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors uppercase text-xs tracking-wide">
                Symptoms: {h.symptoms.join(', ')}
              </p>
            </div>
          ))}
          {history.length === 0 && <p className="text-center text-gray-400 font-medium py-10 col-span-2">No history yet.</p>}
        </div>
      </div>
    </div>
  );
};

const BMITab = () => {
  const [units, setUnits] = useState('metric');
  const [data, setData] = useState({ weight: '', height: '', ft: '', in: '' });
  const [result, setResult] = useState(null);

  const calculate = () => {
    let w = parseFloat(data.weight);
    let h = parseFloat(data.height);

    if (units === 'imperial') {
      const totalIn = (parseInt(data.ft) * 12) + parseInt(data.in);
      h = totalIn * 2.54; // convert to cm
      w = w * 0.453592; // convert lbs to kg
    }

    if (!w || !h) return;

    const hm = h / 100;
    const bmi = (w / (hm * hm)).toFixed(1);
    const bmiNum = parseFloat(bmi);

    let category = '';
    let color = '';
    if (bmiNum < 18.5) { category = 'Underweight'; color = 'text-blue-500'; }
    else if (bmiNum < 25) { category = 'Normal weight'; color = 'text-green-500'; }
    else if (bmiNum < 30) { category = 'Overweight'; color = 'text-yellow-500'; }
    else { category = 'Obese'; color = 'text-red-500'; }

    const tips = {
      'Underweight': ['Eat more calories than you burn', 'Focus on protein-rich foods', 'Strength training to build muscle'],
      'Normal weight': ['Maintain balanced nutrition', 'Regular aerobic exercise', 'Stay hydrated'],
      'Overweight': ['Portion control', 'Increase fiber intake', '30 min daily activity'],
      'Obese': ['Consult a nutritionist', 'Monitor calorie intake', 'Gradual physical activity increase']
    };

    setResult({ bmi, category, color, tips: tips[category], weight: w, height: h });
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">BMI Calculator</h2>
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
            <button onClick={() => setUnits('metric')} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${units === 'metric' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Metric</button>
            <button onClick={() => setUnits('imperial')} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${units === 'imperial' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Imperial</button>
          </div>
        </div>

        <div className="space-y-6">
          {units === 'metric' ? (
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Height (cm)</label>
              <input 
                type="number" placeholder="e.g. 175"
                className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-600 focus:outline-none transition-all font-black"
                value={data.height}
                onChange={e => setData({...data, height: e.target.value})}
              />
            </div>
          ) : (
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Height (ft)</label>
                <input 
                  type="number" placeholder="5"
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-600 focus:outline-none transition-all font-black"
                  value={data.ft}
                  onChange={e => setData({...data, ft: e.target.value})}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Height (in)</label>
                <input 
                  type="number" placeholder="9"
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-600 focus:outline-none transition-all font-black"
                  value={data.in}
                  onChange={e => setData({...data, in: e.target.value})}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Weight ({units === 'metric' ? 'kg' : 'lbs'})</label>
            <input 
              type="number" placeholder={units === 'metric' ? 'e.g. 70' : 'e.g. 154'}
              className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-600 focus:outline-none transition-all font-black"
              value={data.weight}
              onChange={e => setData({...data, weight: e.target.value})}
            />
          </div>

          <button 
            onClick={calculate}
            className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Calculate BMI
          </button>
        </div>
      </div>

      <div className="relative">
        {result ? (
          <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm h-full space-y-10 animate-in fade-in slide-in-from-right-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
            
            <div className="relative z-10 text-center">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Your Score</span>
              <div className="text-7xl font-black text-gray-900 mb-2">{result.bmi}</div>
              <div className={`text-2xl font-black ${result.color} tracking-tight`}>{result.category}</div>
            </div>

            <div className="relative z-10 space-y-6">
              <h3 className="font-black text-sm uppercase tracking-widest text-gray-400">Recommendations</h3>
              <div className="space-y-4">
                {result.tips.map((tip, i) => (
                  <div key={i} className="flex gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 group hover:bg-indigo-50 hover:border-indigo-100 transition-all">
                    <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-indigo-600 font-black shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">{i+1}</div>
                    <p className="flex-1 text-sm font-bold text-gray-700 group-hover:text-indigo-900 transition-colors uppercase tracking-tight">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 p-6 bg-indigo-900 text-white rounded-[2rem] shadow-xl overflow-hidden group">
               <div className="absolute bottom-0 right-0 -mb-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
               <h4 className="font-black text-xs uppercase tracking-widest opacity-60 mb-1">Healthy Weight for you</h4>
               <p className="text-2xl font-black">{(18.5 * (result.height/100)**2).toFixed(1)}kg - {(24.9 * (result.height/100)**2).toFixed(1)}kg</p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-10 rounded-[2.5rem] border-2 border-dashed border-gray-200 h-full flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
              <ScaleIcon className="w-12 h-12 text-gray-200" />
            </div>
            <h3 className="text-xl font-black text-gray-700 mb-2">Waiting for data</h3>
            <p className="text-gray-400 font-medium max-w-[200px]">Enter your height and weight to see your health profile.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthDashboard;
