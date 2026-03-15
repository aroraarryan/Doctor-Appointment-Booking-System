import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
       const [formData, setFormData] = useState({
              name: '',
              email: '',
              password: '',
              confirmPassword: '',
              role: 'patient'
       });
       const [error, setError] = useState('');
       const [loading, setLoading] = useState(false);
       const { register } = useAuth();
       const navigate = useNavigate();

       const handleChange = (e) => {
              setFormData({ ...formData, [e.target.name]: e.target.value });
       };

       const handleSubmit = async (e) => {
              e.preventDefault();
              setError('');

              if (formData.password !== formData.confirmPassword) {
                     return setError('Passwords do not match');
              }

              setLoading(true);
              try {
                     await register(formData.name, formData.email, formData.password, formData.role);
                     alert('Registration successful! Please login.');
                     navigate('/login');
              } catch (err) {
                     setError(err.response?.data?.error || 'Registration failed');
              } finally {
                     setLoading(false);
              }
       };

       return (
              <div className="max-w-md mx-auto mt-10 bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
                     <h2 className="text-2xl font-bold text-center mb-6 text-indigo-600">Join HealthBook</h2>
                     {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
                     <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                   <label className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
                                   <input
                                          type="text"
                                          name="name"
                                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                          value={formData.name}
                                          onChange={handleChange}
                                          required
                                   />
                            </div>
                            <div>
                                   <label className="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
                                   <input
                                          type="email"
                                          name="email"
                                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                          value={formData.email}
                                          onChange={handleChange}
                                          required
                                   />
                            </div>
                            <div>
                                   <label className="block text-gray-700 text-sm font-bold mb-2">I am a...</label>
                                   <select
                                          name="role"
                                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                          value={formData.role}
                                          onChange={handleChange}
                                   >
                                          <option value="patient">Patient</option>
                                          <option value="doctor">Doctor</option>
                                   </select>
                            </div>
                            <div>
                                   <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                                   <input
                                          type="password"
                                          name="password"
                                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                          value={formData.password}
                                          onChange={handleChange}
                                          required
                                   />
                            </div>
                            <div>
                                   <label className="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
                                   <input
                                          type="password"
                                          name="confirmPassword"
                                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                          value={formData.confirmPassword}
                                          onChange={handleChange}
                                          required
                                   />
                            </div>
                            <button
                                   type="submit"
                                   disabled={loading}
                                   className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-700 transition duration-200 disabled:opacity-50"
                            >
                                   {loading ? 'Creating Account...' : 'Register'}
                            </button>
                     </form>
                     <div className="mt-6 text-center text-sm text-gray-600">
                            Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Login here</Link>
                     </div>
              </div>
       );
};

export default Register;
