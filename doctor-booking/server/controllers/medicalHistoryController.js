const supabase = require('../config/supabase');

// GET /api/medical-history
const getMedicalHistory = async (req, res) => {
    try {
        const patientId = req.user.id;

        // 1. Fetch all relevant data in parallel
        const responses = await Promise.all([
            // Appointments with doctor/prescription/records info
            supabase
                .from('appointments')
                .select(`
                    id, 
                    appointment_date, 
                    time_slot, 
                    status,
                    doctor:doctor_id (
                        specialty,
                        profile:profiles (name)
                    )
                `)
                .eq('patient_id', patientId)
                .order('appointment_date', { ascending: false }),

            // Prescriptions
            supabase
                .from('prescriptions')
                .select(`
                    id, 
                    created_at, 
                    diagnosis,
                    doctor:doctor_id (profile:profiles (name)),
                    medicines:prescription_medicines (*)
                `)
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false }),

            // Medical Records
            supabase
                .from('medical_records')
                .select('*')
                .eq('patient_id', patientId)
                .order('uploaded_at', { ascending: false }),

            // Payments
            supabase
                .from('payments')
                .select(`
                    *,
                    appointment:appointment_id (
                        doctor:doctor_id (profile:profiles (name))
                    )
                `)
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false }),

             // Lab Analyses
             supabase
             .from('lab_analysis_results')
             .select('*')
             .eq('patient_id', patientId)
             .order('analyzed_at', { ascending: false })
        ]);

        // Check for any errors
        const error = responses.find(r => r.error)?.error;
        if (error) throw error;

        const [
            { data: appointments },
            { data: prescriptions },
            { data: medicalRecords },
            { data: payments },
            { data: labAnalyses }
        ] = responses;


        // 2. Format and combine into a chronological timeline
        const history = {
            appointments: appointments || [],
            prescriptions: prescriptions || [],
            medical_records: medicalRecords || [],
            payments: payments || [],
            lab_analyses: labAnalyses || []
        };

        res.status(200).json(history);
    } catch (error) {
        console.error('getMedicalHistory Error:', error);
        res.status(400).json({ error: error.message });
    }
};

module.exports = { getMedicalHistory };
