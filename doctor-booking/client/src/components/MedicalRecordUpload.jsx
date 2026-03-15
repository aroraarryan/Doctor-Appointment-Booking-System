import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const MedicalRecordUpload = ({ onUploadSuccess }) => {
       const [file, setFile] = useState(null);
       const [appointments, setAppointments] = useState([]);
       const [selectedAppointment, setSelectedAppointment] = useState('');
       const [uploading, setUploading] = useState(false);
       const [dragActive, setDragActive] = useState(false);

       useEffect(() => {
              const fetchAppointments = async () => {
                     try {
                            const { data } = await api.get('/appointments/patient');
                            setAppointments(data.filter(a => a.status === 'confirmed' || a.status === 'completed'));
                     } catch (error) {
                            console.error('Fetch appointments error:', error);
                     }
              };
              fetchAppointments();
       }, []);

       const handleDrag = (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.type === "dragenter" || e.type === "dragover") {
                     setDragActive(true);
              } else if (e.type === "dragleave") {
                     setDragActive(false);
              }
       };

       const handleDrop = (e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                     setFile(e.dataTransfer.files[0]);
              }
       };

       const handleUpload = async () => {
              if (!file) return;

              setUploading(true);
              const formData = new FormData();
              formData.append('record', file);
              if (selectedAppointment) {
                     formData.append('appointmentId', selectedAppointment);
              }

              try {
                     const { data } = await api.post('/upload/medical-record', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                     });
                     alert('Medical record uploaded successfully!');
                     setFile(null);
                     setSelectedAppointment('');
                     if (onUploadSuccess) onUploadSuccess(data);
              } catch (error) {
                     alert('Upload failed: ' + (error.response?.data?.error || error.message));
              } finally {
                     setUploading(false);
              }
       };

       return (
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                     <h3 className="font-bold text-gray-800">Upload Medical Record</h3>

                     <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-xl p-8 text-center transition ${dragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-400'
                                   }`}
                     >
                            {file ? (
                                   <div className="space-y-2">
                                          <p className="font-medium text-gray-800">{file.name}</p>
                                          <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                          <button
                                                 onClick={() => setFile(null)}
                                                 className="text-xs text-red-500 font-bold hover:underline"
                                          >
                                                 Remove
                                          </button>
                                   </div>
                            ) : (
                                   <div className="space-y-2">
                                          <div className="text-4xl text-gray-300">📄</div>
                                          <p className="text-sm text-gray-500">Drag & drop your files here, or <label htmlFor="fileInput" className="text-indigo-600 font-bold cursor-pointer hover:underline">browse</label></p>
                                          <p className="text-[10px] text-gray-400 font-bold uppercase">PDF, JPG, PNG (Max 10MB)</p>
                                          <input
                                                 id="fileInput"
                                                 type="file"
                                                 className="hidden"
                                                 onChange={(e) => setFile(e.target.files[0])}
                                                 accept=".pdf,image/*"
                                          />
                                   </div>
                            )}
                     </div>

                     <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Link to Appointment (Optional)</label>
                            <select
                                   value={selectedAppointment}
                                   onChange={(e) => setSelectedAppointment(e.target.value)}
                                   className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                   <option value="">None</option>
                                   {appointments.map(app => (
                                          <option key={app.id} value={app.id}>
                                                 {app.appointment_date} with Dr. {app.doctor.profile.name}
                                          </option>
                                   ))}
                            </select>
                     </div>

                     <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                     >
                            {uploading ? (
                                   <>
                                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                          UPLOADING...
                                   </>
                            ) : 'Upload File'}
                     </button>
              </div>
       );
};

export default MedicalRecordUpload;
