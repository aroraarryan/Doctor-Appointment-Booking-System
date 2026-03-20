import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, TrendingUp, Calendar, CreditCard, ArrowDownToLine, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

const EarningsDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEarnings();
    }, []);

    const fetchEarnings = async () => {
        try {
            const res = await axios.get('http://localhost:5002/api/earnings/stats', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching earnings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (stats?.available_payout <= 0) {
            return toast.error('No funds available for withdrawal');
        }
        try {
            await axios.post('http://localhost:5002/api/earnings/withdraw', {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            toast.success('Withdrawal request initiated successfully!');
            fetchEarnings();
        } catch (error) {
            toast.error('Withdrawal failed');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading earnings...</div>;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Earnings Dashboard</h1>
                    <p className="text-gray-500">Track and manage your professional revenue.</p>
                </div>
                <button 
                    onClick={handleWithdraw}
                    className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                    <ArrowDownToLine className="w-5 h-5" />
                    Withdraw Funds (₹{stats?.available_payout.toFixed(2)})
                </button>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard 
                    title="Total Gross Revenue" 
                    value={`₹${stats?.total_gross.toLocaleString()}`} 
                    icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
                    bgColor="bg-emerald-50"
                />
                <StatCard 
                    title="Net Earnings (After Fee)" 
                    value={`₹${stats?.total_net.toLocaleString()}`} 
                    icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
                    bgColor="bg-blue-50"
                />
                <StatCard 
                    title="Pending Payouts" 
                    value={`₹${stats?.pending_payout.toLocaleString()}`} 
                    icon={<Calendar className="w-6 h-6 text-yellow-600" />}
                    bgColor="bg-yellow-50"
                />
                <StatCard 
                    title="Platform Fees (10%)" 
                    value={`₹${(stats?.total_gross - stats?.total_net).toLocaleString()}`} 
                    icon={<CheckCircle className="w-6 h-6 text-gray-600" />}
                    bgColor="bg-gray-50"
                />
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
                    <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">See All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 font-semibold text-sm uppercase tracking-wider">
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Gross Amount</th>
                                <th className="px-6 py-4">Platform Fee</th>
                                <th className="px-6 py-4">Net Payout</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {stats?.history.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-gray-400">#{tx.id.split('-')[0]}</td>
                                    <td className="px-6 py-4 text-gray-900 font-medium">{new Date(tx.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-gray-900">₹{tx.gross_amount}</td>
                                    <td className="px-6 py-4 text-gray-400">₹{tx.platform_fee_amount}</td>
                                    <td className="px-6 py-4 text-emerald-600 font-bold">₹{tx.net_amount}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                            tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            tx.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {tx.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {stats?.history.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-gray-400 italic">No transactions found yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, bgColor }) => (
    <div className="bg-white p-6 border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
        <div className={`w-12 h-12 ${bgColor} rounded-2xl flex items-center justify-center mb-4`}>
            {icon}
        </div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
);

const CheckCircle = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);

export default EarningsDashboard;
