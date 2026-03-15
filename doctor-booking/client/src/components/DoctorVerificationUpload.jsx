import React, { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const DoctorVerificationUpload = ({ type, label, onUploadSuccess, currentStatus }) => {
       const [uploading, setUploading] = useState(false);

       const handleFileChange = async (e) => {
              const file = e.target.files[0];
              if (!file) return;

              // Basic validation
              if (file.size > 5 * 1024 * 1024) {
                     toast.error('File size must be less than 5MB');
                     return;
              }

              setUploading(true);
              const formData = new FormData();
              formData.append('file', file);
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
                     if (onUploadSuccess) onUploadSuccess();
              } catch (error) {
                     console.error('Upload error:', error);
                     toast.error(`Failed to upload ${label}`);
              } finally {
                     setUploading(false);
              }
       };

       const getStatusStyles = () => {
              switch (currentStatus) {
                     case 'approved': return 'bg-green-100 text-green-700 border-green-200';
                     case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
                     case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
                     default: return 'bg-gray-100 text-gray-500 border-gray-200';
              }
       };

       return (
              <div className="p-4 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                     <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-gray-800">{label}</h4>
                            {currentStatus && (
                                   <span className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-full border ${getStatusStyles()}`}>
                                          {currentStatus}
                                   </span>
                            )}
                     </div>

                     <div className="relative group">
                            <input
                                   type="file"
                                   onChange={handleFileChange}
                                   disabled={uploading || currentStatus === 'approved' || currentStatus === 'pending'}
                                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                   accept=".pdf,.jpg,.jpeg,.png"
                            />
                            <div className={`flex flex-col items-center justify-center py-6 px-4 border-2 border-dashed rounded-xl transition-all ${uploading ? 'bg-gray-50' :
                                          currentStatus === 'approved' || currentStatus === 'pending' ? 'bg-gray-50 border-gray-100' :
                                                 'border-gray-200 group-hover:border-indigo-400 group-hover:bg-indigo-50/30'
                                   }`}>
                                   {uploading ? (
                                          <div className="flex flex-col items-center">
                                                 <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                                                 <span className="text-xs font-bold text-indigo-600">Uploading...</span>
                                          </div>
                                   ) : currentStatus === 'approved' ? (
                                          <div className="flex flex-col items-center text-green-600">
                                                 <svg className="w-8 h-8 mb-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                 </svg>
                                                 <span className="text-xs font-bold">Verified</span>
                                          </div>
                                   ) : currentStatus === 'pending' ? (
                                          <div className="flex flex-col items-center text-yellow-600">
                                                 <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                 <span className="text-xs font-bold text-center leading-tight">Under Review</span>
                                          </div>
                                   ) : (
                                          <>
                                                 <svg className="w-8 h-8 text-gray-400 mb-2 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                 </svg>
                                                 <span className="text-xs font-bold text-gray-400 group-hover:text-indigo-600">Drop file or Browse</span>
                                          </>
                                   )}
                            </div>
                     </div>
                     <p className="mt-2 text-[10px] text-gray-400 text-center">PDF, JPG or PNG (Max. 5MB)</p>
              </div>
       );
};

export default DoctorVerificationUpload;
