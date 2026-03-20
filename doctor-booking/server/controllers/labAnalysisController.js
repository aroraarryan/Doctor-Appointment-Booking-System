const supabase = require('../config/supabase');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// POST /api/lab-analysis/:recordId
const analyzeLabReport = async (req, res) => {
    const { recordId } = req.params;

    try {
        // 1. Fetch record metadata
        const { data: record, error: recordError } = await supabase
            .from('medical_records')
            .select('*')
            .eq('id', recordId)
            .eq('patient_id', req.user.id)
            .single();

        if (recordError || !record) {
            return res.status(404).json({ error: 'Medical record not found' });
        }

        // 2. Fetch file from Supabase Storage
        // For simplicity, we assume the file is public or we use getPublicUrl if service role
        const { data: { publicUrl } } = supabase.storage
            .from('medical-records')
            .getPublicUrl(record.file_url.split('/').pop());

        // 3. Download and convert to base64
        const responseData = await axios.get(record.file_url, { responseType: 'arraybuffer' });
        const base64 = Buffer.from(responseData.data, 'binary').toString('base64');
        const mediaType = record.file_type || 'application/pdf';

        if (mediaType.includes('pdf')) {
            return res.status(400).json({ 
                error: 'AI Analysis currently only supports image formats (JPG, PNG). PDF analysis is coming soon.' 
            });
        }

        // 4. Call Claude AI
        const message = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 2000,
            system: "You are a medical AI assistant helping patients understand their lab reports. Analyze the provided lab report and give a plain-language summary. Always include a disclaimer that this is for informational purposes only and not a substitute for professional medical advice. Structure your response ONLY as a JSON object with: summary (plain language overview), key_findings (array of important values like hemoglobin, glucose, etc.), concerns (array of values outside normal range or requiring attention), recommendations (array of suggested follow-up actions like 'Consul with your GP'), disclaimer (text).",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Please analyze this lab report."
                        },
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: mediaType,
                                data: base64,
                            },
                        },
                    ],
                },
            ],
        });


        // 5. Parse and save result
        const aiResponseText = message.content[0].text;
        const analysisData = JSON.parse(aiResponseText);

        const { data: result, error: saveError } = await supabase
            .from('lab_analysis_results')
            .insert([{
                patient_id: req.user.id,
                medical_record_id: recordId,
                file_name: record.file_name,
                ai_summary: analysisData.summary,
                key_findings: analysisData.key_findings,
                concerns: analysisData.concerns,
                recommendations: analysisData.recommendations,
                disclaimer: analysisData.disclaimer
            }])
            .select()
            .single();

        if (saveError) throw saveError;

        res.status(200).json(result);
    } catch (error) {
        console.error('analyzeLabReport Error:', error);
        res.status(500).json({ error: 'Failed to analyze lab report. ' + error.message });
    }
};

// GET /api/lab-analysis/my
const getMyLabAnalyses = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('lab_analysis_results')
            .select('*')
            .eq('patient_id', req.user.id)
            .order('analyzed_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    analyzeLabReport,
    getMyLabAnalyses
};
