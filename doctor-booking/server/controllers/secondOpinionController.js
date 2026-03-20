const supabase = require('../config/supabase');
const { createNotification } = require('../utils/notifications');

// POST /api/second-opinions
const requestSecondOpinion = async (req, res) => {
    const { original_doctor_id, case_summary, symptoms, existing_diagnosis, medical_record_ids } = req.body;

    try {
        const { data, error } = await supabase
            .from('second_opinions')
            .insert([{
                patient_id: req.user.id,
                original_doctor_id,
                case_summary,
                symptoms,
                existing_diagnosis,
                medical_record_ids,
                status: 'open'
            }])
            .select()
            .single();

        if (error) throw error;

        // Broadcast to relevant doctors (mock logic: all doctors for now)
        // In real app, we would match specialty to diagnosis keywords
        const { data: doctors } = await supabase.from('doctors').select('id');
        
        if (doctors) {
            await Promise.all(doctors.map(doc => 
                createNotification(
                    doc.id,
                    'New Second Opinion Request',
                    `A patient is seeking a second opinion regarding ${existing_diagnosis || 'their condition'}.`,
                    'appointment_pending',
                    data.id
                )
            ));
        }

        res.status(201).json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// GET /api/second-opinions/open
const getOpenRequests = async (req, res) => {
    try {
        // Find requests not yet responded to by this doctor
        const { data: responses } = await supabase
            .from('second_opinion_responses')
            .select('second_opinion_id')
            .eq('doctor_id', req.user.id);

        const respondedIds = responses?.map(r => r.second_opinion_id) || [];

        let query = supabase
            .from('second_opinions')
            .select(`
                *,
                patient:patient_id (name)
            `)
            .eq('status', 'open');

        if (respondedIds.length > 0) {
            query = query.not('id', 'in', `(${respondedIds.join(',')})`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// POST /api/second-opinions/:id/respond
const respondToRequest = async (req, res) => {
    const { id } = req.params;
    const { opinion, recommendation } = req.body;

    try {
        // 1. Verify request is still open
        const { data: request, error: reqError } = await supabase
            .from('second_opinions')
            .select('status, patient_id')
            .eq('id', id)
            .single();

        if (reqError || !request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        if (request.status !== 'open') {
            return res.status(400).json({ error: 'This request is no longer open for responses' });
        }

        // 2. Insert response
        const { data: response, error: respError } = await supabase

            .from('second_opinion_responses')
            .insert([{
                second_opinion_id: id,
                doctor_id: req.user.id,
                opinion,
                recommendation
            }])
            .select()
            .single();

        if (respError) throw respError;

        // Update main request status
        await supabase
            .from('second_opinions')
            .update({ status: 'in_review' })
            .eq('id', id)
            .eq('status', 'open');

        // Notify patient
        const { data: secondOpinionRequest } = await supabase
            .from('second_opinions')
            .select('patient_id')
            .eq('id', id)
            .single();

        if (secondOpinionRequest) {
            await createNotification(
                secondOpinionRequest.patient_id,
                'Second Opinion Received',
                `A doctor has responded to your second opinion request.`,
                'appointment_confirmed',
                id
            );
        }


        res.status(201).json(response);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// GET /api/second-opinions/my
const getMyRequests = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('second_opinions')
            .select(`
                *,
                original_doctor:original_doctor_id (
                    specialty,
                    profile:profiles (name)
                ),
                responses:second_opinion_responses (
                    *,
                    doctor:doctor_id (
                        specialty,
                        profile:profiles (name)
                    )
                )
            `)
            .eq('patient_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    requestSecondOpinion,
    getOpenRequests,
    respondToRequest,
    getMyRequests
};
