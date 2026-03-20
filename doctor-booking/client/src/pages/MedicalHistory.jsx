import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import SkeletonCard from '../components/SkeletonCard';
import toast from 'react-hot-toast';

const MedicalHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const fetchHistory = async () => {
        try {
            const { data } = await api.get('/medical-history');
            
            // Transform categorized data into a flat chronological timeline
            const timeline = [
                ...(data.appointments || []).map(a => ({
                    id: a.id,
                    type: 'appointment',
                    date: a.appointment_date,
                    title: `Visit with Dr. ${a.doctor?.profile?.name || 'Specialist'}`,
                    description: `${a.doctor?.specialty || ''} - ${a.time_slot}`,
                    status: a.status
                })),
                ...(data.prescriptions || []).map(p => ({
                    id: p.id,
                    type: 'prescription',
                    date: p.created_at,
                    title: `Prescription for ${p.diagnosis}`,
                    description: `Issued by Dr. ${p.doctor?.profile?.name || 'Specialist'} - ${p.medicines?.length || 0} medications`,
                    status: 'completed'
                })),
                ...(data.medical_records || []).map(r => ({
                    id: r.id,
                    type: 'record',
                    date: r.uploaded_at,
                    title: r.file_name,
                    description: `Medical Document uploaded`,
                    status: 'completed'
                })),
                ...(data.lab_analyses || []).map(l => ({
                    id: l.id,
                    type: 'analysis',
                    date: l.analyzed_at,
                    title: `AI Lab Analysis: ${l.file_name}`,
                    description: l.ai_summary,
                    status: 'completed'
                })),
                ...(data.payments || []).map(pay => ({
                    id: pay.id,
                    type: 'payment',
                    date: pay.created_at,
                    title: `Payment for Dr. ${pay.appointment?.doctor?.profile?.name || 'Specialist'}`,
                    description: `Transaction ID: ${pay.razorpay_payment_id || 'N/A'}`,
                    status: pay.status,
                    amount: pay.amount
                }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date));

            setHistory(timeline);
        } catch (error) {
            console.error('Error fetching history:', error);
            toast.error('Failed to load medical history');
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchHistory();
    }, []);

    const filteredHistory = filter === 'all' 
        ? history 
        : history.filter(item => item.type === filter);

    const getIcon = (type) => {
        switch (type) {
            case 'appointment': return 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z';
            case 'prescription': return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
            case 'record': return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z';
            case 'analysis': return 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01';
            case 'payment': return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
            default: return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'appointment': return 'bg-blue-500';
            case 'prescription': return 'bg-indigo-500';
            case 'record': return 'bg-emerald-500';
            case 'analysis': return 'bg-purple-500';
            case 'payment': return 'bg-amber-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20">
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Medical Journey</h1>
                    <p className="text-gray-500 font-medium mt-1">A comprehensive chronological timeline of your health activities.</p>
                </div>
                <div className="flex bg-gray-50 p-2 rounded-2xl border border-gray-100">
                    {['all', 'appointment', 'prescription', 'record', 'analysis'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === t ? 'bg-white text-indigo-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative pl-8 md:pl-0">
                {/* Vertical Line */}
                <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-100 via-gray-100 to-transparent -translate-x-1/2 hidden md:block"></div>
                
                {loading ? (
                    <div className="space-y-8">
                        <SkeletonCard count={3} />
                    </div>
                ) : filteredHistory.length > 0 ? (
                    <div className="space-y-12">
                        {filteredHistory.map((item, idx) => (
                            <div key={idx} className={`relative flex flex-col md:flex-row ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''} items-center group`}>
                                {/* Timeline Dot */}
                                <div className={`absolute left-[-28px] md:left-1/2 top-2 w-6 h-6 rounded-full border-4 border-white shadow-lg z-10 -translate-x-1/2 transition-transform group-hover:scale-125 ${getColor(item.type)}`}></div>
                                
                                {/* Content Card */}
                                <div className="w-full md:w-[45%]">
                                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-1">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl text-white ${getColor(item.type)} shadow-sm`}>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={getIcon(item.type)} /></svg>
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.type}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">{new Date(item.date).toLocaleDateString()}</span>
                                        </div>

                                        <h3 className="text-xl font-black text-gray-900 mb-2 truncate">{item.title}</h3>
                                        <p className="text-gray-500 text-sm font-medium leading-relaxed">{item.description}</p>
                                        
                                        {item.status && (
                                            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                    item.status === 'completed' || item.status === 'paid' ? 'bg-green-100 text-green-700' : 
                                                    item.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                    {item.status}
                                                </span>
                                                {item.amount && <span className="text-sm font-black text-gray-900">₹{item.amount}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="hidden md:block w-[10%] text-center">
                                    <span className="text-xs font-black text-gray-300 group-hover:text-indigo-400 transition-colors uppercase tracking-widest">{new Date(item.date).getFullYear()}</span>
                                </div>
                                <div className="hidden md:block w-[45%]"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white p-20 text-center rounded-3xl border border-dashed border-gray-200">
                        <h3 className="text-xl font-extrabold text-gray-700 uppercase tracking-tight">Your Health Timeline is Bare</h3>
                        <p className="text-gray-400 mt-2 max-w-xs mx-auto">Complete appointments, upload records, and receive prescriptions to build your healthcare journey.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MedicalHistory;
