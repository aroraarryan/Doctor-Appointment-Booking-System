import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import SkeletonCard from '../components/SkeletonCard';
import toast from 'react-hot-toast';

const Prescriptions = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPrescriptions = async () => {
        try {
            const { data } = await api.get('/prescriptions/patient');
            setPrescriptions(data);
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
            toast.error('Failed to load prescriptions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    const downloadPDF = async (id, fileName) => {
        try {
            const response = await api.get(`/prescriptions/${id}/pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Prescription-${fileName || id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url); // Fix memory leak
        } catch (error) {
            toast.error('Failed to download PDF');
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20">
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter">My Prescriptions</h1>
                    <p className="text-gray-500 font-medium mt-1">View and download your medical prescriptions issued by your doctors.</p>
                </div>
                <div className="bg-indigo-50 px-6 py-3 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <span className="text-indigo-700 font-bold tracking-tight">{prescriptions.length} Records Found</span>
                </div>
            </div>

            <div className="grid gap-6">
                {loading ? (
                    <SkeletonCard count={3} />
                ) : prescriptions.length > 0 ? (
                    prescriptions.map((px) => (
                        <div key={px.id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl group-hover:scale-110 transition-transform">
                                            {px.doctor?.profile?.name?.charAt(0) || 'D'}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-gray-900">Dr. {px.doctor?.profile?.name || 'Unknown'}</h3>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{px.doctor?.specialty || 'General'} • {new Date(px.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 italic text-gray-700 font-medium text-sm leading-relaxed">
                                        <span className="text-[10px] font-black uppercase text-indigo-500 block mb-2 tracking-widest not-italic">Diagnosis</span>
                                        "{px.diagnosis}"
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Prescribed Medicines</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {px.medicines?.map((med, idx) => (
                                                <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900">{med.medicine_name} <span className="text-indigo-600">({med.dosage})</span></p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{med.frequency} • {med.duration}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
                                    <button
                                        onClick={() => downloadPDF(px.id, `${px.doctor?.profile?.name || 'Doctor'}-${px.id}`)}

                                        className="w-full bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Download PDF
                                    </button>
                                    {px.follow_up_date && (
                                        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl flex items-center gap-3">
                                            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-white shrink-0">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-yellow-700 uppercase tracking-tighter">Follow-up Required</p>
                                                <p className="text-xs font-bold text-yellow-800">{new Date(px.follow_up_date).toDateString()}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white p-20 text-center rounded-3xl border border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <h3 className="text-xl font-extrabold text-gray-700 uppercase tracking-tight">No Prescriptions Issued</h3>
                        <p className="text-gray-400 mt-2 max-w-xs mx-auto">Once your doctor issues a prescription after your visit, it will appear here for you to download.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Prescriptions;
