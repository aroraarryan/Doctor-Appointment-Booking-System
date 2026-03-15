import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
       return (
              <div className="flex flex-col items-center justify-center mt-20">
                     <h1 className="text-4xl font-bold text-red-600">403</h1>
                     <h2 className="text-2xl font-semibold mt-4">Access Denied</h2>
                     <p className="text-gray-600 mt-2">You don't have permission to view this page.</p>
                     <Link to="/" className="mt-6 text-indigo-600 hover:underline">Back to Home</Link>
              </div>
       );
};

export default Unauthorized;
