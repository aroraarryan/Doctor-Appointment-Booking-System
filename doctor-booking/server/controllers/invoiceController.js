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
        const { data: invoice, error } = await supabase
            .from('invoices')
            .select('pdf_url')
            .eq('id', id)
            .single();

        if (error || !invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        if (!invoice.pdf_url) {
            return res.status(404).json({ error: 'Invoice PDF not yet generated' });
        }

        res.status(200).json({ pdfUrl: invoice.pdf_url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getMyInvoices, getInvoicePDF };
