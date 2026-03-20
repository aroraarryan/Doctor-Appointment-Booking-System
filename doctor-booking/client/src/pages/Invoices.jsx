import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { FileText, Download, Calendar, ExternalLink, Search } from 'lucide-react';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const res = await api.get('/invoices/my');
            setInvoices(res.data);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredInvoices = invoices.filter(inv => 
        inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.doctor?.profile?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.patient?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center">Loading invoices...</div>;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Invoices & Billing</h1>
                    <p className="text-gray-500">Access and download your official tax invoices.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Search invoices..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none w-full md:w-64"
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {filteredInvoices.map((inv) => (
                    <div key={inv.id} className="bg-white p-6 border border-gray-100 rounded-2xl flex flex-col md:flex-row items-center justify-between hover:border-indigo-100 transition-all hover:shadow-sm">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{inv.invoice_number}</h3>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(inv.issued_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 md:mt-0 flex flex-col md:items-center text-center md:text-left gap-1">
                            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Amount</p>
                            <p className="text-lg font-bold text-gray-900">₹{inv.total_amount.toFixed(2)}</p>
                        </div>

                        <div className="mt-4 md:mt-0 flex flex-col md:items-center text-center md:text-left gap-1">
                            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Party</p>
                            <p className="font-medium text-gray-700">
                                {localStorage.getItem('role') === 'patient' 
                                    ? `Dr. ${inv.doctor?.profile?.name}` 
                                    : inv.patient?.name}
                            </p>
                        </div>

                        <div className="mt-6 md:mt-0 flex items-center gap-3 w-full md:w-auto">
                            <a 
                                href={inv.pdf_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                                View
                            </a>
                            <a 
                                href={inv.pdf_url} 
                                download
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </a>
                        </div>
                    </div>
                ))}

                {filteredInvoices.length === 0 && (
                    <div className="p-20 text-center bg-gray-50 border border-dashed border-gray-200 rounded-3xl">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No invoices found</h3>
                        <p className="text-gray-500">Your generated invoices will appear here after successful payments.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Invoices;
