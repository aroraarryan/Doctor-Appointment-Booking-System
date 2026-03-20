import React, { useState } from 'react';
import api from '../utils/api';
import { XCircleIcon } from '@heroicons/react/24/solid';

const AvatarUpload = ({ currentAvatar, onUploadSuccess }) => {
       const [uploading, setUploading] = useState(false);
       const [preview, setPreview] = useState(null);
       const [error, setError] = useState('');

       const handleFileChange = (e) => {
              const file = e.target.files[0];
              setError('');
              if (!file) {
                     setPreview(null);
                     return;
              }

              // Validation
              if (!file.type.startsWith('image/')) {
                     setError('Please upload an image file (JPG, PNG, etc.).');
                     setPreview(null);
                     return;
              }
              if (file.size > 5 * 1024 * 1024) { // Tighten to 5MB for avatars
                     setError('Avatar size must be less than 5MB.');
                     setPreview(null);
                     return;
              }

              // Preview
              const reader = new FileReader();
              reader.onloadend = () => setPreview(reader.result);
              reader.readAsDataURL(file);
       };

       const handleUpload = async () => {
              const fileInput = document.getElementById('avatarInput');
              const file = fileInput.files[0];
              if (!file) return;

              setUploading(true);
              setError('');
              const formData = new FormData();
              formData.append('avatar', file);

              try {
                     const { data } = await api.post('/upload/avatar', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                     });
                     setPreview(null);
                     if (onUploadSuccess) onUploadSuccess(data.url);
              } catch (error) {
                     setError('Upload failed: ' + (error.response?.data?.error || error.message));
              } finally {
                     setUploading(false);
              }
       };

       return (
              <div className="flex flex-col items-center gap-4">
                     <div className="relative group">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-100 flex items-center justify-center">
                                   {preview ? (
                                          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                   ) : currentAvatar ? (
                                          <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                   ) : (
                                          <div className="text-gray-400 bg-gray-100 w-full h-full flex items-center justify-center">
                                                 <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                                 </svg>
                                          </div>
                                   )}
                            </div>
                            <label
                                   htmlFor="avatarInput"
                                   className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-indigo-700 transition transform group-hover:scale-110"
                            >
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                   </svg>
                            </label>
                            <input
                                   id="avatarInput"
                                   type="file"
                                   className="hidden"
                                   accept="image/*"
                                   onChange={handleFileChange}
                            />
                     </div>

                     {error && (
                            <div className="text-[10px] text-red-500 font-bold flex items-center gap-1 animate-shake">
                                   <XCircleIcon className="h-3 w-3" />
                                   <span>{error}</span>
                            </div>
                     )}

                     {preview && !error && (
                            <div className="flex gap-2">
                                   <button
                                          onClick={handleUpload}
                                          disabled={uploading}
                                          className="text-[10px] bg-indigo-600 text-white px-3 py-1 rounded-full font-bold hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
                                   >
                                          {uploading ? 'UPLOADING...' : 'CONFIRM CHANGE'}
                                   </button>
                                   <button
                                          onClick={() => {
                                                 setPreview(null);
                                                 document.getElementById('avatarInput').value = '';
                                          }}
                                          className="text-[10px] bg-white border border-gray-200 text-gray-500 px-3 py-1 rounded-full font-bold hover:bg-gray-50 transition"
                                   >
                                          CANCEL
                                   </button>
                            </div>
                     )}

                     {uploading && (
                            <div className="w-24 bg-gray-100 h-1 rounded-full overflow-hidden">
                                   <div className="bg-indigo-600 h-full animate-progress" style={{ width: '100%' }}></div>
                            </div>
                     )}
              </div>
       );
};

export default AvatarUpload;
