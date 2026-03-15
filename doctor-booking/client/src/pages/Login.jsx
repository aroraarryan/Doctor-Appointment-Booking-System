import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../config/supabase';
import api from '../utils/api';

const Login = () => {
       const [email, setEmail] = useState('');
       const [password, setPassword] = useState('');
       const [error, setError] = useState('');
       const [loading, setLoading] = useState(false);
       const [requires2FA, setRequires2FA] = useState(false);
       const [tempToken, setTempToken] = useState('');
       const [otp, setOtp] = useState(['', '', '', '', '', '']);
       const [resendTimer, setResendTimer] = useState(0);
       const [attemptsRemaining, setAttemptsRemaining] = useState(null);

       const { login, verifyOTPLogin, user } = useAuth();
       const navigate = useNavigate();

       useEffect(() => {
              if (user && !requires2FA) {
                     const role = user.role || user.user_metadata?.role || 'patient';
                     if (role === 'admin') navigate('/admin/dashboard');
                     else if (role === 'doctor') navigate('/doctor/dashboard');
                     else navigate('/dashboard');
              }
       }, [user, navigate, requires2FA]);

       useEffect(() => {
              let interval;
              if (resendTimer > 0) {
                     interval = setInterval(() => {
                            setResendTimer((prev) => prev - 1);
                     }, 1000);
              }
              return () => clearInterval(interval);
       }, [resendTimer]);

       const handleLoginSubmit = async (e) => {
              e.preventDefault();
              setError('');
              setLoading(true);
              try {
                     const data = await login(email, password);
                     if (data.requires2FA) {
                            setRequires2FA(true);
                            setTempToken(data.tempToken);
                            setResendTimer(60);
                     } else {
                            const role = data.user.user_metadata?.role || 'patient';
                            if (role === 'admin') navigate('/admin/dashboard');
                            else if (role === 'doctor') navigate('/doctor/dashboard');
                            else navigate('/dashboard');
                     }
              } catch (err) {
                     setError(err.response?.data?.error || 'Failed to login');
              } finally {
                     setLoading(false);
              }
       };

       const handleOTPSubmit = async (e) => {
              e.preventDefault();
              setError('');
              setLoading(true);
              const otpCode = otp.join('');
              if (otpCode.length !== 6) {
                     setError('Please enter all 6 digits');
                     setLoading(false);
                     return;
              }

              try {
                     const data = await verifyOTPLogin(tempToken, otpCode);
                     // If success, AuthContext will update user state and we'll redirect in useEffect
                     setRequires2FA(false);
              } catch (err) {
                     const errorData = err.response?.data;
                     setError(errorData?.error || 'Invalid OTP');
                     if (errorData?.attemptsRemaining !== undefined) {
                            setAttemptsRemaining(errorData.attemptsRemaining);
                     }
                     if (err.response?.status === 429) {
                            // Max attempts exceeded, reset to login
                            setTimeout(() => {
                                   setRequires2FA(false);
                            }, 3000);
                     }
              } finally {
                     setLoading(false);
              }
       };

       const handleResendOTP = async () => {
              if (resendTimer > 0) return;
              setError('');
              try {
                     const { data } = await api.post('/auth/resend-otp', { tempToken });
                     setResendTimer(60);
                     alert('A new OTP has been sent to your email.');
              } catch (err) {
                     setError(err.response?.data?.error || 'Failed to resend OTP');
              }
       };

       const handleOtpChange = (element, index) => {
              if (isNaN(element.value)) return false;

              setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

              // Focus next input
              if (element.nextSibling && element.value !== '') {
                     element.nextSibling.focus();
              }
       };

       const handleKeyDown = (e, index) => {
              if (e.key === 'Backspace' && !otp[index] && e.target.previousSibling) {
                     e.target.previousSibling.focus();
              }
       };

       if (requires2FA) {
              return (
                     <div className="max-w-md mx-auto mt-10 bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
                            <h2 className="text-2xl font-bold text-center mb-2 text-indigo-600">Verification Required</h2>
                            <p className="text-gray-600 text-center mb-6">Enter the 6-digit code sent to your email</p>
                            
                            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">{error}</div>}
                            {attemptsRemaining !== null && !error.includes('Max attempts') && (
                                   <p className="text-orange-600 text-sm mb-2 text-center">{attemptsRemaining} attempts remaining</p>
                            )}

                            <form onSubmit={handleOTPSubmit} className="space-y-6">
                                   <div className="flex justify-between gap-2">
                                          {otp.map((data, index) => (
                                                 <input
                                                        key={index}
                                                        type="text"
                                                        maxLength="1"
                                                        className="w-12 h-12 text-center border-2 border-gray-300 rounded-lg text-xl font-bold focus:border-indigo-500 focus:outline-none"
                                                        value={data}
                                                        onChange={(e) => handleOtpChange(e.target, index)}
                                                        onKeyDown={(e) => handleKeyDown(e, index)}
                                                 />
                                          ))}
                                   </div>

                                   <button
                                          type="submit"
                                          disabled={loading}
                                          className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition duration-200 disabled:opacity-50"
                                   >
                                          {loading ? 'Verifying...' : 'Verify OTP'}
                                   </button>
                            </form>

                            <div className="mt-6 text-center space-y-4">
                                   <p className="text-sm text-gray-500">
                                          Haven't received the code?{' '}
                                          <button 
                                                 onClick={handleResendOTP} 
                                                 disabled={resendTimer > 0}
                                                 className={`font-semibold ${resendTimer > 0 ? 'text-gray-400' : 'text-indigo-600 hover:underline'}`}
                                          >
                                                 {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend Code'}
                                          </button>
                                   </p>
                                   <button 
                                          onClick={() => setRequires2FA(false)}
                                          className="text-gray-600 text-sm hover:underline"
                                   >
                                          Back to Login
                                   </button>
                            </div>
                     </div>
              );
       }

       return (
              <div className="max-w-md mx-auto mt-10 bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
                     <h2 className="text-2xl font-bold text-center mb-6 text-indigo-600">Login to DocBook</h2>
                     {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
                     <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <div>
                                   <label className="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
                                   <input
                                          type="email"
                                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                          value={email}
                                          onChange={(e) => setEmail(e.target.value)}
                                          required
                                   />
                            </div>
                            <div>
                                   <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                                   <input
                                          type="password"
                                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                          value={password}
                                          onChange={(e) => setPassword(e.target.value)}
                                          required
                                   />
                            </div>
                            <button
                                   type="submit"
                                   disabled={loading}
                                   className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-700 transition duration-200 disabled:opacity-50"
                            >
                                   {loading ? 'Logging in...' : 'Login'}
                            </button>
                     </form>
                     <div className="mt-6 text-center text-sm text-gray-600">
                            Don't have an account? <Link to="/register" className="text-indigo-600 hover:underline">Register here</Link>
                     </div>
              </div>
       );
};

export default Login;
