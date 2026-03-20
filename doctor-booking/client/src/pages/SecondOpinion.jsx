import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import SkeletonCard from '../components/SkeletonCard';

const SecondOpinion = () => {
    const [requests, setRequests] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        original_doctor_id: '',
        case_summary: '',
        symptoms: '',
        existing_diagnosis: ''
    });

    const fetchData = async () => {
        try {
            const [reqRes, docRes] = await Promise.all([
                api.get('/second-opinions/my'),
                api.get('/doctors')
            ]);
            setRequests(reqRes.data);
            setDoctors(docRes.data);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/second-opinions', formData);
            toast.success('Second opinion request submitted!');
            setShowForm(false);
            setFormData({ original_doctor_id: '', case_summary: '', symptoms: '', existing_diagnosis: '' });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to submit request');
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20">
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Second Opinions</h1>
                    <p className="text-gray-500 font-medium mt-1">Get independent expert reviews of your medical cases.</p>
                </div>
                {!showForm && (
                    <button 
                        onClick={() => setShowForm(true)}
                        className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                    >
                        Request New Opinion
                    </button>
                )}
            </div>

            {showForm && (
                <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-between items-center mb-10">
                        <h2 className="text-xl font-black text-gray-900">Case Details</h2>
                        <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Consulting Specialist</label>
                                <select 
                                    required
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-700"
                                    value={formData.original_doctor_id}
                                    onChange={(e) => setFormData({...formData, original_doctor_id: e.target.value})}
                                >
                                    <option value="">Select Doctor</option>
                                    {doctors.map(doc => (
                                        <option key={doc.id} value={doc.id}>Dr. {doc.profile.name} ({doc.specialty})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Existing Diagnosis</label>
                                <input 
                                    required
                                    type="text"
                                    placeholder="Enter current diagnosis if any"
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-700"
                                    value={formData.existing_diagnosis}
                                    onChange={(e) => setFormData({...formData, existing_diagnosis: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Symptoms (Detailed)</label>
                            <textarea 
                                required
                                rows="3"
                                placeholder="Describe what you are feeling..."
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-700 resize-none"
                                value={formData.symptoms}
                                onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                            ></textarea>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Case Summary</label>
                            <textarea 
                                required
                                rows="4"
                                placeholder="Provide background information about your condition..."
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-700 resize-none"
                                value={formData.case_summary}
                                onChange={(e) => setFormData({...formData, case_summary: e.target.value})}
                            ></textarea>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button type="submit" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-[1.02] transition-all">
                                Submit Case for Review
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-6">
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                    <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                    Your Request History
                </h2>
                
                {loading ? (
                    <SkeletonCard count={3} />
                ) : requests.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {requests.map(req => (
                            <div key={req.id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest ${
                                    req.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                    req.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                    {req.status}
                                </div>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl">
                                        {req.original_doctor?.profile?.name?.charAt(0) || 'D'}
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-gray-900">Dr. {req.original_doctor?.profile?.name || 'Assigned Doctor'}</h3>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{req.original_doctor?.specialty || 'General'}</p>
                                    </div>
                                </div>


                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Symptoms</p>
                                        <p className="text-sm font-bold text-gray-600 line-clamp-2 italic">"{req.symptoms}"</p>
                                    </div>
                                    
                                    {req.opinion_report && (
                                        <div className="mt-6 pt-6 border-t border-gray-50">
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3">Expert Opinion</p>
                                            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-50">
                                                <p className="text-sm font-bold text-gray-800 leading-relaxed line-clamp-3">{req.opinion_report}</p>
                                                <button className="text-indigo-600 text-xs font-black uppercase tracking-widest mt-3 hover:underline">Read Full Report</button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center text-[10px] font-black text-gray-400 pt-4">
                                        <span>Requested: {new Date(req.created_at).toLocaleDateString()}</span>
                                        {req.status === 'completed' && <span className="text-emerald-500">Reviewed on {new Date(req.updated_at).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white p-20 text-center rounded-3xl border border-dashed border-gray-200">
                        <h3 className="text-xl font-extrabold text-gray-700 uppercase tracking-tight">Expert Opinion Hub</h3>
                        <p className="text-gray-400 mt-2 max-w-xs mx-auto">Get peace of mind with a second expert evaluation of your medical case.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SecondOpinion;
