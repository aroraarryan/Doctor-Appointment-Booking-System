const supabase = require('../config/supabase');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

        // 2. Fetch file and convert to base64
        const responseData = await axios.get(record.file_url, { responseType: 'arraybuffer' });
        const base64Data = Buffer.from(responseData.data, 'binary').toString('base64');
        const mediaType = record.file_type || 'image/jpeg';

        if (mediaType.includes('pdf')) {
            return res.status(400).json({ 
                error: 'AI Analysis currently only supports image formats (JPG, PNG). PDF analysis is coming soon.' 
            });
        }

        // 3. Call Gemini AI
        const prompt = "You are a medical AI assistant helping patients understand their lab reports. Analyze the provided lab report and give a plain-language summary. Always include a disclaimer that this is for informational purposes only and not a substitute for professional medical advice. IMPORTANT: Structure your response ONLY as a JSON object with: summary (plain language overview), key_findings (array of important values like hemoglobin, glucose, etc.), concerns (array of values outside normal range or requiring attention), recommendations (array of suggested follow-up actions like 'Consult with your GP'), disclaimer (text).";

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mediaType
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();
        
        // Extract JSON from markdown if needed
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : text;
        const analysisData = JSON.parse(jsonString);

        const { data: savedRecord, error: saveError } = await supabase
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

        res.status(200).json(savedRecord);
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
