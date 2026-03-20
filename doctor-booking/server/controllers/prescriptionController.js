const supabase = require('../config/supabase');
const PDFDocument = require('pdfkit');
const { createNotification } = require('../utils/notifications');

// POST /api/prescriptions
const createPrescription = async (req, res) => {
    const { appointmentId, diagnosis, medicines, notes, follow_up_date } = req.body;

    if (!appointmentId || !diagnosis || !medicines || !Array.isArray(medicines)) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // 1. Verify appointment
        const { data: appointment, error: apptError } = await supabase
            .from('appointments')
            .select('doctor_id, patient_id, status')
            .eq('id', appointmentId)
            .single();

        if (apptError || !appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        if (appointment.doctor_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only write prescriptions for your own appointments' });
        }

        // 2. Insert prescription
        const { data: prescription, error: prescrError } = await supabase
            .from('prescriptions')
            .insert([{
                appointment_id: appointmentId,
                patient_id: appointment.patient_id,
                doctor_id: req.user.id,
                diagnosis,
                notes,
                follow_up_date
            }])
            .select()
            .single();

        if (prescrError) throw prescrError;

        // 3. Insert medicines
        const medicinesToInsert = medicines.map(m => ({
            prescription_id: prescription.id,
            medicine_name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration,
            instructions: m.instructions,
            quantity: m.quantity
        }));

        const { error: medError } = await supabase
            .from('prescription_medicines')
            .insert(medicinesToInsert);

        if (medError) throw medError;

        // 4. Notify patient
        await createNotification(
            appointment.patient_id,
            'New Prescription Ready',
            `Dr. ${req.user.name} has issued a prescription for your appointment on ${new Date().toLocaleDateString()}.`,
            'appointment_confirmed', // Reusing type for UI icon
            prescription.id
        );

        res.status(201).json({ ...prescription, medicines: medicinesToInsert });
    } catch (error) {
        console.error('createPrescription Error:', error);
        res.status(400).json({ error: error.message });
    }
};

// GET /api/prescriptions/patient
const getPatientPrescriptions = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('prescriptions')
            .select(`
                *,
                doctor:doctor_id (
                    specialty,
                    profile:profiles (name)
                ),
                medicines:prescription_medicines (*)
            `)
            .eq('patient_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// GET /api/prescriptions/:id
const getPrescriptionById = async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .from('prescriptions')
            .select(`
                *,
                doctor:doctor_id (
                    specialty,
                    profile:profiles (name)
                ),
                patient:patient_id (name),
                medicines:prescription_medicines (*)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        
        if (data.patient_id !== req.user.id && data.doctor_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// GET /api/prescriptions/:id/pdf
const generatePrescriptionPDF = async (req, res) => {
    const { id } = req.params;
    try {
        const { data: p, error } = await supabase
            .from('prescriptions')
            .select(`
                *,
                doctor:doctor_id (
                    specialty,
                    profile:profiles (name)
                ),
                patient:patient_id (name),
                medicines:prescription_medicines (*)
            `)
            .eq('id', id)
            .single();

        if (error || !p) throw new Error('Prescription not found');

        // Security check: Only patient, prescribing doctor, or admin can access
        if (p.patient_id !== req.user.id && p.doctor_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const doc = new PDFDocument({ margin: 50 });
        
        // Response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=prescription_${id}.pdf`);
        
        doc.pipe(res);

        // Header
        doc.fontSize(25).text('Curova Medical Prescription', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Date: ${new Date(p.created_at).toLocaleDateString()}`, { align: 'right' });
        doc.moveDown();

        // Doctor & Patient Info
        doc.fontSize(14).text('Doctor Information', { underline: true });
        doc.fontSize(12).text(`Dr. ${p.doctor?.profile?.name || 'Unknown'}`);
        doc.text(`Specialty: ${p.doctor?.specialty || 'N/A'}`);
        doc.moveDown();

        doc.fontSize(14).text('Patient Information', { underline: true });
        doc.fontSize(12).text(`Patient Name: ${p.patient?.name || 'Unknown'}`);
        doc.moveDown();

        // Diagnosis
        doc.fontSize(14).text('Diagnosis', { underline: true });
        doc.fontSize(12).text(p.diagnosis);
        doc.moveDown();

        // Medicines Table
        doc.fontSize(14).text('Prescribed Medicines', { underline: true });
        doc.moveDown(0.5);
        
        p.medicines.forEach((m, i) => {
            doc.fontSize(12).text(`${i + 1}. ${m.medicine_name} - ${m.dosage}`);
            doc.fontSize(10).text(`   Frequency: ${m.frequency} | Duration: ${m.duration}`);
            doc.text(`   Instructions: ${m.instructions}`);
            doc.moveDown(0.5);
        });

        // Notes
        if (p.notes) {
            doc.moveDown();
            doc.fontSize(14).text('Notes', { underline: true });
            doc.fontSize(12).text(p.notes);
        }

        // Follow up
        if (p.follow_up_date) {
            doc.moveDown();
            doc.fontSize(12).text(`Follow-up Date: ${new Date(p.follow_up_date).toLocaleDateString()}`, { color: 'red' });
        }

        // Footer / Signature
        doc.moveDown(4);
        doc.text('__________________________', { align: 'right' });
        doc.text('Doctor Signature', { align: 'right' });

        doc.end();
    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
};

module.exports = {
    createPrescription,
    getPatientPrescriptions,
    getPrescriptionById,
    generatePrescriptionPDF
};
