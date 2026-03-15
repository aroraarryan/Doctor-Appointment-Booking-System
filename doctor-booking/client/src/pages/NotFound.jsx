import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
       return (
              <div className="min-h-[60vh] flex items-center justify-center px-4">
                     <div className="text-center space-y-6">
                            <h1 className="text-9xl font-extrabold text-indigo-600 tracking-widest italic">404</h1>
                            <div className="bg-indigo-600 text-white px-2 text-sm rounded rotate-12 absolute">
                                   Page Not Found
                            </div>
                            <div className="pt-8">
                                   <h2 className="text-3xl font-bold text-gray-900 mb-4">Lost in Space?</h2>
                                   <p className="text-gray-600 max-w-md mx-auto mb-8">
                                          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
                                   </p>
                                   <Link
                                          to="/"
                                          className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg"
                                   >
                                          <span>Back Home</span>
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                          </svg>
                                   </Link>
                            </div>
                     </div>
              </div>
       );
};

export default NotFound;
