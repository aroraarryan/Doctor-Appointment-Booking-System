const { GoogleGenerativeAI } = require('@google/generative-ai');
const supabase = require('../config/supabase');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// POST /api/symptom-checker
const checkSymptoms = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { symptoms, answers } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ error: 'Symptoms are required' });
    }

    const prompt = `You are a medical triage assistant. Based on symptoms provided,
suggest the most relevant medical specialties to consult, assess urgency level
(low/medium/high/emergency), and provide a brief plain-language assessment.
Always recommend consulting a doctor for proper diagnosis.

Symptoms: ${symptoms.join(', ')}
Patient info: ${JSON.stringify(answers)}

IMPORTANT: Respond ONLY in JSON format: 
{ 
  "suggested_specialties": ["string"], 
  "urgency_level": "string", 
  "assessment": "string", 
  "when_to_seek_emergency": "string", 
  "disclaimer": "string" 
}`;

    let aiResult;
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON if model wraps it in markdown blocks
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : text;
      aiResult = JSON.parse(jsonString);
    } catch (aiError) {
      console.error('Gemini API Error:', aiError);
      // Fallback for demo if API key is invalid
      aiResult = {
        suggested_specialties: ["General Physician"],
        urgency_level: "medium",
        assessment: "You are experiencing several symptoms that warrant a professional evaluation. This assessment is based on a simulated AI response.",
        when_to_seek_emergency: "Seek emergency care if you experience chest pain, difficulty breathing, or sudden confusion.",
        disclaimer: "This is not a medical diagnosis. Consult a doctor immediately."
      };
    }

    // Save to symptom_checks table
    const { data: record, error: dbError } = await supabase
      .from('symptom_checks')
      .insert({
        patient_id: patientId,
        symptoms,
        answers,
        suggested_specialties: aiResult.suggested_specialties,
        urgency_level: aiResult.urgency_level,
        ai_assessment: aiResult.assessment
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Fetch matching doctors by specialty
    const { data: doctors, error: docError } = await supabase
      .from('doctors')
      .select(`
        id,
        specialty,
        profile:profiles(name, avatar_url)
      `)
      .in('specialty', aiResult.suggested_specialties)
      .limit(5);

    res.status(200).json({
      assessment: aiResult,
      matching_doctors: doctors || [],
      history_id: record.id
    });
  } catch (error) {
    console.error('checkSymptoms Error:', error);
    res.status(400).json({ error: error.message });
  }
};

// GET /api/symptom-checker/history
const getSymptomHistory = async (req, res) => {
  try {
    const patientId = req.user.id;

    console.log(`Fetching symptom history for patient: ${patientId}`);
    const { data, error } = await supabase
      .from('symptom_checks')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Symptom History Fetch Error:', error);
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('getSymptomHistory Error:', error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  checkSymptoms,
  getSymptomHistory
};
