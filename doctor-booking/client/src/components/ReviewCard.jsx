import React from 'react';
import { format } from 'date-fns';

const ReviewCard = ({ review }) => {
       const { rating, comment, created_at, patient } = review;

       return (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                     <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold border border-indigo-100 overflow-hidden">
                                          {patient?.avatar_url ? (
                                                 <img src={patient.avatar_url} alt={patient.name} className="w-full h-full object-cover" />
                                          ) : (
                                                 patient?.name?.charAt(0) || 'P'
                                          )}
                                   </div>
                                   <div>
                                          <h4 className="font-bold text-gray-800 text-sm">{patient?.name || 'Anonymous Patient'}</h4>
                                          <p className="text-xs text-gray-400">{format(new Date(created_at), 'MMM dd, yyyy')}</p>
                                   </div>
                            </div>
                            <div className="flex items-center px-2 py-1 bg-yellow-50 rounded-lg">
                                   {[...Array(5)].map((_, i) => (
                                          <svg
                                                 key={i}
                                                 className={`w-3 h-3 ${i < rating ? 'text-yellow-400' : 'text-gray-200'}`}
                                                 fill="currentColor"
                                                 viewBox="0 0 20 20"
                                          >
                                                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                          </svg>
                                   ))}
                            </div>
                     </div>
                     <p className="text-gray-600 text-sm leading-relaxed italic">
                            "{comment || 'No comment provided.'}"
                     </p>
              </div>
       );
};

export default ReviewCard;
