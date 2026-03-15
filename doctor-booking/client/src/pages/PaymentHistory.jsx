import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const PaymentHistory = () => {
       const { user } = useAuth();
       const [payments, setPayments] = useState([]);
       const [loading, setLoading] = useState(true);
       const [stats, setStats] = useState({ total: 0, pending: 0, monthly: 0 });

       useEffect(() => {
              fetchPaymentHistory();
       }, []);

       const fetchPaymentHistory = async () => {
              try {
                     const { data } = await api.get('/payments/history');
                     setPayments(data);
                     calculateStats(data);
              } catch (error) {
                     toast.error('Failed to fetch payment history');
              } finally {
                     setLoading(false);
              }
       };

       const calculateStats = (data) => {
              const total = data.reduce((acc, curr) => curr.status === 'paid' ? acc + Number(curr.amount) : acc, 0);
              const pending = data.filter(p => p.status === 'pending').length;

              const now = new Date();
              const monthly = data.reduce((acc, curr) => {
                     const date = new Date(curr.created_at);
                     if (curr.status === 'paid' && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
                            return acc + Number(curr.amount);
                     }
                     return acc;
              }, 0);

              setStats({ total, pending, monthly });
       };

       const handleRefund = async (appointmentId) => {
              if (!window.confirm('Are you sure you want to cancel this appointment and request a refund? This is only possible if the appointment is more than 24 hours away.')) return;

              try {
                     await api.post('/payments/refund', { appointmentId });
                     toast.success('Refund initiated successfully');
                     fetchPaymentHistory();
              } catch (error) {
                     toast.error(error.response?.data?.error || 'Refund failed');
              }
       };

       if (loading) return <div className="text-center py-20 animate-pulse text-gray-500">Loading Payment History...</div>;

       return (
              <div className="max-w-6xl mx-auto space-y-8">
                     <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>

                     {/* Stats Cards */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 italic">
                                   <p className="text-sm text-gray-500 mb-1">{user.role === 'doctor' ? 'Total Earned' : 'Total Spent'}</p>
                                   <p className="text-3xl font-bold text-indigo-600">₹{stats.total.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                   <p className="text-sm text-gray-500 mb-1">This Month</p>
                                   <p className="text-3xl font-bold text-green-600">₹{stats.monthly.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                   <p className="text-sm text-gray-500 mb-1">Pending Orders</p>
                                   <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                            </div>
                     </div>

                     {/* Payments Table */}
                     <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                   <table className="w-full text-left border-collapse">
                                          <thead>
                                                 <tr className="bg-gray-50 border-b border-gray-100">
                                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                               {user.role === 'doctor' ? 'Patient' : 'Doctor'}
                                                        </th>
                                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Appointment</th>
                                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                                 </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-50">
                                                 {payments.length > 0 ? (
                                                        payments.map((p) => {
                                                               const apptDate = new Date(`${p.appointment.appointment_date}T${p.appointment.time_slot}`);
                                                               const canRefund = user.role === 'patient' &&
                                                                      p.status === 'paid' &&
                                                                      p.appointment.status === 'confirmed' &&
                                                                      (apptDate - new Date()) / (1000 * 60 * 60) > 24;

                                                               return (
                                                                      <tr key={p.id} className="hover:bg-gray-50 transition">
                                                                             <td className="px-6 py-4 text-sm text-gray-600">
                                                                                    {format(new Date(p.created_at), 'dd MMM yyyy, h:mm a')}
                                                                             </td>
                                                                             <td className="px-6 py-4">
                                                                                    <div className="text-sm font-bold text-gray-900">
                                                                                           {user.role === 'doctor' ? p.patient.name : p.doctor.name}
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-500">
                                                                                           {user.role === 'doctor' ? p.patient.email : p.doctor.email}
                                                                                    </div>
                                                                             </td>
                                                                             <td className="px-6 py-4 text-sm text-gray-600">
                                                                                    {format(new Date(p.appointment.appointment_date), 'dd MMM yyyy')} | {p.appointment.time_slot.substring(0, 5)}
                                                                             </td>
                                                                             <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                                                                    ₹{Number(p.amount).toLocaleString()}
                                                                             </td>
                                                                             <td className="px-6 py-4">
                                                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${p.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                                                                  p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                                                         p.status === 'refunded' ? 'bg-indigo-100 text-indigo-700' :
                                                                                                                'bg-red-100 text-red-700'
                                                                                           }`}>
                                                                                           {p.status}
                                                                                    </span>
                                                                             </td>
                                                                             <td className="px-6 py-4 text-right">
                                                                                    {canRefund && (
                                                                                           <button
                                                                                                  onClick={() => handleRefund(p.appointment_id)}
                                                                                                  className="text-xs font-bold text-red-600 hover:text-red-800 transition"
                                                                                           >
                                                                                                  Request Refund
                                                                                           </button>
                                                                                    )}
                                                                                    {!canRefund && user.role === 'patient' && p.status === 'paid' && p.appointment.status === 'confirmed' && (
                                                                                           <span className="text-[10px] text-gray-400 italic">Too late for refund</span>
                                                                                    )}
                                                                             </td>
                                                                      </tr>
                                                               );
                                                        })
                                                 ) : (
                                                        <tr>
                                                               <td colSpan="6" className="px-6 py-12 text-center text-gray-400 italic">
                                                                      No transactions found.
                                                               </td>
                                                        </tr>
                                                 )}
                                          </tbody>
                                   </table>
                            </div>
                     </div>
              </div>
       );
};

export default PaymentHistory;
