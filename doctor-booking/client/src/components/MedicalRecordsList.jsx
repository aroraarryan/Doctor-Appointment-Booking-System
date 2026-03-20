import React, { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import AIAnalysisModal from './AIAnalysisModal';

const MedicalRecordsList = ({ records, onRefresh, canDelete = true }) => {
        const [analyzingId, setAnalyzingId] = useState(null);
        const [showAIModal, setShowAIModal] = useState(false);
        const [selectedAnalysis, setSelectedAnalysis] = useState(null);

        const handleDelete = async (id) => {
               if (!window.confirm('Are you sure you want to delete this record?')) return;
               try {
                      await api.delete(`/upload/medical-record/${id}`);
                      toast.success('Record deleted.');
                      onRefresh();
               } catch (error) {
                      toast.error('Delete failed');
               }
        };

        const handleAnalyze = async (recordId) => {
               setAnalyzingId(recordId);
               try {
                      const { data } = await api.post('/lab-analysis/analyze', { recordId });
                      setSelectedAnalysis(data.analysis_results);
                      setShowAIModal(true);
                      toast.success('AI Analysis complete!');
               } catch (error) {
                      const message = error.response?.data?.error || 'Analysis failed. Please try again.';
                      toast.error(message);
               } finally {
                      setAnalyzingId(null);
               }
        };

       const getIcon = (type) => {
              if (type?.includes('pdf')) return '📕';
              if (type?.includes('image')) return '🖼️';
              return '📄';
       };

       return (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                     <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                   <tr>
                                          <th className="px-6 py-3">File Name</th>
                                          <th className="px-6 py-3">Date</th>
                                          <th className="px-6 py-3">Linked Appointment</th>
                                          <th className="px-6 py-3 text-right">Actions</th>
                                   </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                   {records.length > 0 ? records.map(rec => (
                                          <tr key={rec.id} className="hover:bg-gray-50 transition">
                                                 <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                               <span className="text-xl">{getIcon(rec.file_type)}</span>
                                                               <div>
                                                                      <p className="font-bold text-gray-800">{rec.file_name}</p>
                                                                      <p className="text-[10px] text-gray-400">{(rec.file_size / 1024).toFixed(1)} KB</p>
                                                               </div>
                                                        </div>
                                                 </td>
                                                 <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                                        {new Date(rec.uploaded_at).toLocaleDateString()}
                                                 </td>
                                                 <td className="px-6 py-4 text-gray-500">
                                                        {rec.appointment ? (
                                                               <div className="text-xs">
                                                                      <p className="font-medium text-indigo-600">Dr. {rec.appointment.doctor.name}</p>
                                                                      <p>{rec.appointment.appointment_date}</p>
                                                               </div>
                                                        ) : (
                                                               <span className="text-gray-300 italic">None</span>
                                                        )}
                                                 </td>
                                                 <td className="px-6 py-4 text-right space-x-3">
                                                        <a
                                                               href={rec.view_url}
                                                               target="_blank"
                                                               rel="noopener noreferrer"
                                                               className="text-indigo-600 font-bold hover:underline"
                                                        >
                                                               View
                                                        </a>
                                                         <button
                                                                onClick={() => handleAnalyze(rec.id)}
                                                                disabled={analyzingId === rec.id}
                                                                className="text-purple-600 font-bold hover:underline disabled:opacity-50"
                                                         >
                                                                {analyzingId === rec.id ? 'Analyzing...' : 'AI Analyze'}
                                                         </button>
                                                         {canDelete && (
                                                                <button
                                                                       onClick={() => handleDelete(rec.id)}
                                                                       className="text-red-500 font-bold hover:underline"
                                                                >
                                                                       Delete
                                                                </button>
                                                         )}
                                                  </td>
                                          </tr>
                                   )) : (
                                          <tr>
                                                 <td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic">
                                                        No medical records found.
                                                 </td>
                                          </tr>
                                   )}
                            </tbody>
                     </table>

                     {showAIModal && (
                            <AIAnalysisModal
                                   analysis={selectedAnalysis}
                                   onClose={() => setShowAIModal(false)}
                            />
                     )}
              </div>
       );
};

export default MedicalRecordsList;
