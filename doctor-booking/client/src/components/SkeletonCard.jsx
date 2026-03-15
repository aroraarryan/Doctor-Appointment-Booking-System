import React from 'react';

const SkeletonCard = ({ count = 1 }) => {
       return (
              <>
                     {Array(count).fill(0).map((_, i) => (
                            <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4 animate-pulse">
                                   <div className="flex items-center space-x-4">
                                          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                          <div className="flex-1 space-y-2">
                                                 <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                 <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                          </div>
                                   </div>
                                   <div className="space-y-2">
                                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                                          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                                   </div>
                                   <div className="h-10 bg-gray-200 rounded w-full mt-4"></div>
                            </div>
                     ))}
              </>
       );
};

export default SkeletonCard;
