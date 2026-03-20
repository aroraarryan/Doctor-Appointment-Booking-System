import React from 'react';

const AIAnalysisModal = ({ analysis, onClose }) => {
    if (!analysis) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black">AI Insights Engine</h2>
                            <p className="text-white/80 text-xs font-bold uppercase tracking-widest">Diagnostic Report Analysis</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                        <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3">Summary Overview</h3>
                        <p className="text-gray-800 font-bold leading-relaxed">{analysis.summary}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Key Findings */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Key Observations</h3>
                            <div className="space-y-3">
                                {analysis.key_findings?.map((finding, idx) => (
                                    <div key={idx} className="flex gap-3 items-start">
                                        <div className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">{idx + 1}</div>
                                        <p className="text-sm font-bold text-gray-700 leading-snug">{finding}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Abnormal Values */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Clinical Indicators</h3>
                            <div className="space-y-3">
                                {analysis.abnormal_values?.map((val, idx) => (
                                    <div key={idx} className="bg-red-50 border border-red-100 p-3 rounded-xl">
                                        <p className="text-xs font-black text-red-600 uppercase tracking-tight mb-1">{val.parameter}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-black text-red-800">{val.value} {val.unit}</span>
                                            <span className="text-[10px] font-bold text-red-400">Ref: {val.reference_range}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Physician Recommendations</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {analysis.recommendations?.map((rec, idx) => (
                                <div key={idx} className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                                    <p className="text-sm font-bold text-emerald-800">{rec}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                        <div className="text-amber-500 shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <p className="text-[10px] font-bold text-amber-800 uppercase italic tracking-tight leading-relaxed">
                            Disclaimer: This AI analysis is for informational purposes only and does not replace professional medical advice. Always consult with a qualified healthcare provider for diagnosis and treatment plans.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                    >
                        Acknowledge Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIAnalysisModal;
