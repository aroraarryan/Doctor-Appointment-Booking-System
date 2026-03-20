import React, { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { CloudArrowUpIcon, CheckBadgeIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/solid';

const DoctorVerificationUpload = ({ type, label, onUploadSuccess, currentStatus }) => {
       const [uploading, setUploading] = useState(false);
       const [selectedFile, setSelectedFile] = useState(null);
       const [error, setError] = useState('');

       const handleFileSelect = (e) => {
              const file = e.target.files[0];
              setError('');
              if (!file) return;

              // Basic validation
              if (file.size > 5 * 1024 * 1024) {
                     setError('File size must be less than 5MB');
                     setSelectedFile(null);
                     return;
              }

              setSelectedFile(file);
       };

       const handleUpload = async () => {
              if (!selectedFile) return;

              setUploading(true);
              setError('');
              const formData = new FormData();
              formData.append('file', selectedFile);
              formData.append('bucket', 'verification-docs');

              try {
                     // 1. Upload to Supabase Storage
                     const { data: uploadData } = await api.post('/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                     });

                     // 2. Register in doctor_verifications table
                     await api.post('/verification/upload', {
                            documentType: type,
                            documentUrl: uploadData.url
                     });

                     toast.success(`${label} uploaded and pending review!`);
                     setSelectedFile(null);
                     if (onUploadSuccess) onUploadSuccess();
              } catch (error) {
                     console.error('Upload error:', error);
                     setError(`Failed to upload ${label}`);
                     toast.error(`Failed to upload ${label}`);
              } finally {
                     setUploading(false);
              }
       };

       const getStatusStyles = () => {
              switch (currentStatus) {
                     case 'approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
                     case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
                     case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
                     default: return 'bg-slate-100 text-slate-500 border-slate-200';
              }
       };

       return (
              <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                     <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-slate-800 text-sm tracking-tight">{label}</h4>
                            {currentStatus && (
                                   <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${getStatusStyles()}`}>
                                          {currentStatus}
                                   </span>
                            )}
                     </div>

                     <div className="relative">
                            {!selectedFile ? (
                                   <div className={`relative flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed rounded-xl transition-all ${
                                          currentStatus === 'approved' || currentStatus === 'pending' 
                                                 ? 'bg-slate-50 border-slate-100' 
                                                 : 'border-slate-200 group-hover:border-indigo-400 group-hover:bg-indigo-50/30'
                                   }`}>
                                          <input
                                                 type="file"
                                                 onChange={handleFileSelect}
                                                 disabled={uploading || currentStatus === 'approved' || currentStatus === 'pending'}
                                                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                                                 accept=".pdf,.jpg,.jpeg,.png"
                                          />
                                          
                                          {currentStatus === 'approved' ? (
                                                 <div className="flex flex-col items-center text-emerald-600">
                                                        <CheckBadgeIcon className="w-10 h-10 mb-2" />
                                                        <span className="text-xs font-bold">Document Verified</span>
                                                 </div>
                                          ) : currentStatus === 'pending' ? (
                                                 <div className="flex flex-col items-center text-amber-600 text-center">
                                                        <ClockIcon className="w-10 h-10 mb-2 animate-pulse" />
                                                        <span className="text-xs font-bold leading-tight">Verification in Progress</span>
                                                        <p className="text-[10px] text-amber-500 mt-1">Reviewing your document</p>
                                                 </div>
                                          ) : (
                                                 <>
                                                        <CloudArrowUpIcon className="w-10 h-10 text-slate-300 mb-2 group-hover:text-indigo-500 transition-colors" />
                                                        <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600">Tap to upload {label}</span>
                                                        <p className="mt-1 text-[10px] text-slate-400">PDF, JPG or PNG (Max. 5MB)</p>
                                                 </>
                                          )}
                                   </div>
                            ) : (
                                   <div className="bg-indigo-50/50 border-2 border-indigo-200 rounded-xl p-4 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                                          <div className="p-3 bg-white rounded-lg shadow-sm mb-3">
                                                 <CloudArrowUpIcon className="w-8 h-8 text-indigo-600" />
                                          </div>
                                          <p className="text-xs font-bold text-indigo-900 truncate max-w-full px-2 mb-4">{selectedFile.name}</p>
                                          
                                          <div className="flex gap-2 w-full">
                                                 <button
                                                        onClick={handleUpload}
                                                        disabled={uploading}
                                                        className="flex-1 bg-indigo-600 text-white text-[10px] font-bold py-2 rounded-lg hover:bg-indigo-700 shadow-md transition disabled:opacity-50"
                                                 >
                                                        {uploading ? 'UPLOADING...' : 'UPLOAD DOCUMENT'}
                                                 </button>
                                                 <button
                                                        onClick={() => setSelectedFile(null)}
                                                        disabled={uploading}
                                                        className="px-3 bg-white border border-indigo-200 text-indigo-600 text-[10px] font-bold py-2 rounded-lg hover:bg-indigo-50 transition"
                                                 >
                                                        CANCEL
                                                 </button>
                                          </div>
                                   </div>
                            )}

                            {error && (
                                   <div className="mt-2 flex items-center gap-1.5 text-rose-500 text-[10px] font-bold animate-shake">
                                          <XCircleIcon className="h-4 w-4" />
                                          <span>{error}</span>
                                   </div>
                            )}
                     </div>
              </div>
       );
};

export default DoctorVerificationUpload;
