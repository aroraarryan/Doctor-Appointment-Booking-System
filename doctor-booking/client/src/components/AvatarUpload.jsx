import React, { useState } from 'react';
import api from '../utils/api';

const AvatarUpload = ({ currentAvatar, onUploadSuccess }) => {
       const [uploading, setUploading] = useState(false);
       const [preview, setPreview] = useState(null);

       const handleFileChange = async (e) => {
              const file = e.target.files[0];
              if (!file) return;

              // Validation
              if (!file.type.startsWith('image/')) {
                     alert('Please upload an image file.');
                     return;
              }
              if (file.size > 2 * 1024 * 1024) {
                     alert('File size must be less than 2MB.');
                     return;
              }

              // Preview
              const reader = new FileReader();
              reader.onloadend = () => setPreview(reader.result);
              reader.readAsDataURL(file);

              // Upload immediately or wait for confirm? The prompt says "Preview... On confirm, call POST".
              // I'll add a confirm button if preview is active.
       };

       const handleUpload = async () => {
              const fileInput = document.getElementById('avatarInput');
              const file = fileInput.files[0];
              if (!file) return;

              setUploading(true);
              const formData = new FormData();
              formData.append('avatar', file);

              try {
                     const { data } = await api.post('/upload/avatar', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                     });
                     alert('Profile photo updated!');
                     setPreview(null);
                     if (onUploadSuccess) onUploadSuccess(data.url);
              } catch (error) {
                     alert('Upload failed: ' + (error.response?.data?.error || error.message));
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
                                          <span className="text-3xl text-gray-400">👤</span>
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

                     {preview && (
                            <div className="flex gap-2">
                                   <button
                                          onClick={handleUpload}
                                          disabled={uploading}
                                          className="text-xs bg-green-600 text-white px-3 py-1 rounded-md font-bold hover:bg-green-700 disabled:opacity-50"
                                   >
                                          {uploading ? 'UPLOADING...' : 'CONFIRM'}
                                   </button>
                                   <button
                                          onClick={() => setPreview(null)}
                                          className="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded-md font-bold hover:bg-gray-300"
                                   >
                                          CANCEL
                                   </button>
                            </div>
                     )}

                     {uploading && (
                            <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                                   <div className="bg-indigo-600 h-full animate-pulse" style={{ width: '100%' }}></div>
                            </div>
                     )}
              </div>
       );
};

export default AvatarUpload;
