import React, { useState } from 'react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

const LeaveReviewModal = ({ appointment, isOpen, onClose, onReviewSubmitted }) => {
       const [rating, setRating] = useState(5);
       const [comment, setComment] = useState('');
       const [submitting, setSubmitting] = useState(false);

       if (!isOpen) return null;

       const handleSubmit = async (e) => {
              e.preventDefault();
              setSubmitting(true);

              try {
                     await api.post('/reviews', {
                            appointmentId: appointment.id,
                            rating,
                            comment
                     });
                     toast.success('Review submitted successfully!');
                     onReviewSubmitted();
                     onClose();
              } catch (error) {
                     console.error('Review submission error:', error);
                     toast.error(error.response?.data?.error || 'Failed to submit review');
              } finally {
                     setSubmitting(false);
              }
       };

       return (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                     <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
                            <div className="p-8">
                                   <div className="flex justify-between items-center mb-6">
                                          <h2 className="text-2xl font-bold text-gray-800">Rate your visit</h2>
                                          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                                                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                 </svg>
                                          </button>
                                   </div>

                                   <div className="text-center mb-8">
                                          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-indigo-600">
                                                 {appointment.doctor?.name?.charAt(0) || 'D'}
                                          </div>
                                          <h3 className="font-bold text-gray-800">Dr. {appointment.doctor?.name}</h3>
                                          <p className="text-sm text-gray-500">{appointment.doctor?.specialty}</p>
                                   </div>

                                   <form onSubmit={handleSubmit} className="space-y-6">
                                          <div className="text-center">
                                                 <label className="block text-sm font-semibold text-gray-700 mb-2">How was your experience?</label>
                                                 <div className="flex justify-center gap-2">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                               <button
                                                                      key={star}
                                                                      type="button"
                                                                      onClick={() => setRating(star)}
                                                                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${star <= rating ? 'bg-yellow-100 text-yellow-500 scale-110 shadow-sm' : 'bg-gray-50 text-gray-300 hover:bg-gray-100'}`}
                                                               >
                                                                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                                             <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                      </svg>
                                                               </button>
                                                        ))}
                                                 </div>
                                          </div>

                                          <div>
                                                 <label className="block text-sm font-semibold text-gray-700 mb-2">Detailed feedback</label>
                                                 <textarea
                                                        rows="4"
                                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all placeholder:text-gray-400"
                                                        placeholder="Share your experience (optional)..."
                                                        value={comment}
                                                        onChange={(e) => setComment(e.target.value)}
                                                 ></textarea>
                                          </div>

                                          <div className="flex gap-3">
                                                 <button
                                                        type="button"
                                                        onClick={onClose}
                                                        className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-colors"
                                                 >
                                                        Not now
                                                 </button>
                                                 <button
                                                        type="submit"
                                                        disabled={submitting}
                                                        className={`flex-1 px-4 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all ${submitting ? 'opacity-70 animate-pulse' : ''}`}
                                                 >
                                                        {submitting ? 'Submitting...' : 'Post Review'}
                                                 </button>
                                          </div>
                                   </form>
                            </div>
                     </div>
              </div>
       );
};

export default LeaveReviewModal;
