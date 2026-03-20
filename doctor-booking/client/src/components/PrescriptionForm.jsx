import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const PrescriptionForm = ({ appointment, onClose, onSuccess }) => {
    const [diagnosis, setDiagnosis] = useState('');
    const [notes, setNotes] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');
    const [medicines, setMedicines] = useState([
        { name: '', dosage: '', frequency: 'Once daily', duration: '', instructions: '', quantity: 1 }
    ]);
    const [submitting, setSubmitting] = useState(false);

    const addMedicine = () => {
        setMedicines([...medicines, { name: '', dosage: '', frequency: 'Once daily', duration: '', instructions: '', quantity: 1 }]);
    };

    const removeMedicine = (index) => {
        setMedicines(medicines.filter((_, i) => i !== index));
    };

    const handleMedicineChange = (index, field, value) => {
        const newMedicines = [...medicines];
        newMedicines[index][field] = value;
        setMedicines(newMedicines);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/prescriptions', {
                appointmentId: appointment.id,
                diagnosis,
                medicines,
                notes,
                follow_up_date: followUpDate
            });
            toast.success('Prescription issued successfully');
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to issue prescription');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <div>
                        <h2 className="text-2xl font-black">Issue Medical Prescription</h2>
                        <p className="text-white/80 text-sm font-medium">Patient: {appointment.patient.name} | Date: {appointment.appointment_date}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Diagnosis */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Diagnosis & Findings</label>
                        <textarea
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-0 focus:border-indigo-400 outline-none h-24 transition-all resize-none"
                            placeholder="Primary diagnosis and clinical findings..."
                            required
                        />
                    </div>

                    {/* Medicines List */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Prescribed Medicines</label>
                            <button
                                type="button"
                                onClick={addMedicine}
                                className="text-xs font-black text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 transition-all flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                Add Medicine
                            </button>
                        </div>

                        <div className="space-y-4">
                            {medicines.map((med, index) => (
                                <div key={index} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 relative group animate-in fade-in slide-in-from-top-2">
                                    {medicines.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeMedicine(index)}
                                            className="absolute -top-2 -right-2 bg-white text-red-500 p-1.5 rounded-full shadow-md border border-red-50 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-1">
                                            <input
                                                type="text"
                                                placeholder="Medicine Name"
                                                value={med.name}
                                                onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                placeholder="Dosage (e.g. 500mg)"
                                                value={med.dosage}
                                                onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <select
                                                value={med.frequency}
                                                onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
                                            >
                                                <option>Once daily</option>
                                                <option>Twice daily</option>
                                                <option>Three times daily</option>
                                                <option>Four times daily</option>
                                                <option>As needed</option>
                                                <option>Before meals</option>
                                                <option>After meals</option>
                                            </select>
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                placeholder="Duration (e.g. 5 days)"
                                                value={med.duration}
                                                onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
                                                required
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <input
                                                type="text"
                                                placeholder="Special Instructions"
                                                value={med.instructions}
                                                onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Notes */}
                        <div className="space-y-3">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Doctor's Notes</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-0 focus:border-indigo-400 outline-none h-24 transition-all resize-none"
                                placeholder="Dietary restrictions, rest, etc..."
                            />
                        </div>
                        {/* Follow up */}
                        <div className="space-y-3">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Follow-up Date</label>
                            <input
                                type="date"
                                value={followUpDate}
                                onChange={(e) => setFollowUpDate(e.target.value)}
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-0 focus:border-indigo-400 outline-none transition-all"
                            />
                            <p className="text-[10px] text-gray-400 font-bold pl-1 italic">Optional: Set a date for review</p>
                        </div>
                    </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 border-t border-gray-100 bg-gray-50 flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-3 rounded-2xl font-black text-gray-500 hover:bg-gray-100 transition-all uppercase tracking-widest text-xs"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-black hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-100 transition-all uppercase tracking-widest text-xs"
                        >
                            {submitting ? 'Issuing...' : 'Issue Prescription'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PrescriptionForm;
