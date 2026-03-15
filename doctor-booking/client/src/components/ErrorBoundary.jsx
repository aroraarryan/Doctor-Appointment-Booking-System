import React from 'react';

class ErrorBoundary extends React.Component {
       constructor(props) {
              super(props);
              this.state = { hasError: false };
       }

       static getDerivedStateFromError(error) {
              return { hasError: true };
       }

       componentDidCatch(error, errorInfo) {
              console.error('ErrorBoundary caught an error', error, errorInfo);
       }

       render() {
              if (this.state.hasError) {
                     return (
                            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                                   <div className="max-w-md w-full text-center space-y-6">
                                          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-4xl">
                                                 ⚠️
                                          </div>
                                          <h1 className="text-3xl font-bold text-gray-900">Something went wrong</h1>
                                          <p className="text-gray-600">
                                                 An unexpected error occurred. Please try refreshing the page or come back later.
                                          </p>
                                          <button
                                                 onClick={() => window.location.reload()}
                                                 className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg"
                                          >
                                                 Retry
                                          </button>
                                   </div>
                            </div>
                     );
              }

              return this.props.children;
       }
}

export default ErrorBoundary;
