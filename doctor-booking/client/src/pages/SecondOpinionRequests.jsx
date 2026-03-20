import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import SkeletonCard from '../components/SkeletonCard';

const SecondOpinionRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [opinionText, setOpinionText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchRequests = async () => {
        try {
            const { data } = await api.get('/second-opinions/requests');
            setRequests(data);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleSubmitOpinion = async (id) => {
        if (!opinionText.trim()) return toast.error('Please provide your expert opinion');
        setSubmitting(true);
        try {
            await api.patch(`/second-opinions/${id}/provide`, { opinion_report: opinionText });
            toast.success('Second opinion submitted successfully');
            setSelectedRequest(null);
            setOpinionText('');
            fetchRequests();
        } catch (error) {
            toast.error('Failed to submit opinion');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20">
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
                <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Second Opinion Requests</h1>
                <p className="text-gray-500 font-medium mt-1">Review complex cases and provide expert medical evaluations.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Requests List */}
                <div className="lg:col-span-5 space-y-6">
                    <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest pl-1">Incoming Cases</h2>
                    {loading ? (
                        <SkeletonCard count={3} />
                    ) : requests.length > 0 ? (
                        <div className="space-y-4">
                            {requests.map(req => (
                                <button 
                                    key={req.id}
                                    onClick={() => setSelectedRequest(req)}
                                    className={`w-full text-left p-6 rounded-3xl border transition-all duration-300 ${
                                        selectedRequest?.id === req.id 
                                        ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-100 text-white' 
                                        : 'bg-white border-gray-100 hover:border-indigo-200 text-gray-900 shadow-sm'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                                            selectedRequest?.id === req.id ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                                        }`}>
                                            {req.status}
                                        </span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${selectedRequest?.id === req.id ? 'text-white/60' : 'text-gray-400'}`}>
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="font-extrabold text-lg mb-1">{req.patient?.name}</h3>
                                    <p className={`text-xs font-bold truncate ${selectedRequest?.id === req.id ? 'text-white/80' : 'text-gray-500'}`}>
                                        Case: {req.existing_diagnosis || 'Undiagnosed'}
                                    </p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-10 rounded-3xl border border-dashed border-gray-200 text-center text-gray-400 font-bold italic">
                            No active requests found.
                        </div>
                    )}
                </div>

                {/* Case Details & Input */}
                <div className="lg:col-span-7">
                    {selectedRequest ? (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="p-10 space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black text-gray-900">Case Analysis</h3>
                                    <div className="grid grid-cols-2 gap-6 pb-6 border-b border-gray-50">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Patient Name</p>
                                            <p className="font-bold text-gray-800">{selectedRequest.patient?.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Diagnosis</p>
                                            <p className="font-bold text-gray-800">{selectedRequest.existing_diagnosis || 'None provided'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-3">Symptoms Logged</h4>
                                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                            <p className="text-gray-700 font-bold leading-relaxed italic">"{selectedRequest.symptoms}"</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-3">Medical Summary</h4>
                                        <p className="text-gray-600 font-bold leading-relaxed">{selectedRequest.case_summary}</p>
                                    </div>
                                </div>

                                {selectedRequest.status === 'pending' ? (
                                    <div className="space-y-4 pt-6">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Your Expert Evaluation</label>
                                        <textarea 
                                            rows="6"
                                            placeholder="Provide your detailed medical opinion, potential treatment paths, or recommended tests..."
                                            className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-700 resize-none"
                                            value={opinionText}
                                            onChange={(e) => setOpinionText(e.target.value)}
                                        ></textarea>
                                        <button 
                                            onClick={() => handleSubmitOpinion(selectedRequest.id)}
                                            disabled={submitting}
                                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-[1.01] transition-all disabled:opacity-50"
                                        >
                                            {submitting ? 'Submitting...' : 'Establish Secure Opinion'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                        <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-3">Your Submitted Evaluation</h4>
                                        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                                            <p className="text-emerald-800 font-bold leading-relaxed">{selectedRequest.opinion_report}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center bg-gray-50 rounded-3xl border border-dashed border-gray-200 p-20 text-center">
                            <div className="max-w-xs">
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 text-indigo-400">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                </div>
                                <h3 className="text-xl font-black text-gray-700 mb-2">Select a Case</h3>
                                <p className="text-gray-400 text-sm font-bold">Choose a request from the sidebar to review full clinical details and provide your expert opinion.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SecondOpinionRequests;
