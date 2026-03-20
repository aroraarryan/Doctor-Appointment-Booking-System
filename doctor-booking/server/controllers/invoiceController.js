const supabase = require('../config/supabase');

// GET /api/invoices/my
const getMyInvoices = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;

    try {
        let query = supabase.from('invoices').select(`
            *,
            doctor:doctors (profile:profiles (name)),
            patient:profiles (name)
        `);

        if (role === 'patient') query = query.eq('patient_id', userId);
        else if (role === 'doctor') query = query.eq('doctor_id', userId);

        const { data, error } = await query.order('issued_at', { ascending: false });
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/invoices/:id/pdf
const getInvoicePDF = async (req, res) => {
    const { id } = req.params;
    try {
        // In a real app, generate PDF via puppeteer or report-engine
        // For now, we'll return a mock URL
        const pdfUrl = `https://storage.googleapis.com/doctor-booking-invoices/invoice-${id.substring(0,8)}.pdf`;
        res.status(200).json({ pdfUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getMyInvoices, getInvoicePDF };
