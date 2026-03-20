const supabase = require('../config/supabase');

// POST /api/health-metrics
const logHealthMetric = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { metric_type, value, unit, notes, recorded_at } = req.body;

    if (!metric_type || value === undefined || !unit) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Insert into health_metrics
    const { data: metric, error } = await supabase
      .from('health_metrics')
      .insert({
        patient_id: patientId,
        metric_type,
        value,
        unit,
        notes,
        recorded_at: recorded_at || new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Check warning thresholds
    let warning = null;
    if (metric_type === 'blood_pressure_systolic' && value > 140) {
      warning = "High blood pressure detected (Systolic > 140)";
    } else if (metric_type === 'blood_sugar_fasting' && value > 126) {
      warning = "High fasting blood sugar (> 126 mg/dL)";
    } else if (metric_type === 'heart_rate' && (value > 100 || value < 60)) {
      warning = "Abnormal heart rate detected (Normal range: 60-100 bpm)";
    }

    res.status(201).json({ metric, warning });
  } catch (error) {
    console.error('logHealthMetric Error:', error);
    res.status(400).json({ error: error.message });
  }
};

// GET /api/health-metrics
const getHealthMetrics = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { type, days = 30 } = req.query;

    if (!type) {
      return res.status(400).json({ error: 'Metric type is required' });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const { data: metrics, error } = await supabase
      .from('health_metrics')
      .select('value, recorded_at')
      .eq('patient_id', patientId)
      .eq('metric_type', type)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true });

    if (error) throw error;

    // Calculate stats
    if (metrics.length === 0) {
      return res.status(200).json({ 
        data: [], 
        stats: { min: 0, max: 0, average: 0, latest: 0, trend: 'stable' } 
      });
    }

    const values = metrics.map(m => parseFloat(m.value));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const average = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
    const latest = values[values.length - 1];

    // Determine trend (simplified: compare last with average of others)
    let trend = 'stable';
    if (values.length > 3) {
      const last = values[values.length - 1];
      const prevAvg = values.slice(-4, -1).reduce((a, b) => a + b, 0) / 3;
      if (last > prevAvg * 1.05) trend = 'increasing';
      else if (last < prevAvg * 0.95) trend = 'decreasing';
    }

    res.status(200).json({
      data: metrics.map(m => ({ date: m.recorded_at, value: parseFloat(m.value) })),
      stats: { min, max, average: parseFloat(average), latest, trend }
    });
  } catch (error) {
    console.error('getHealthMetrics Error:', error);
    res.status(400).json({ error: error.message });
  }
};

// GET /api/health-metrics/summary
const getHealthSummary = async (req, res) => {
  try {
    const patientId = req.user.id;

    // Get latest reading for each type
    console.log(`Fetching health summary for patient: ${patientId}`);
    const { data, error } = await supabase
      .from('health_metrics')
      .select('*')
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: false });

    if (error) {
      console.error('Health Summary Fetch Error:', error);
      throw error;
    }

    // Filter for latest of each type manually since Postgres DISTINCT ON is tricky with Supabase JS
    const summary = {};
    data.forEach(m => {
      if (!summary[m.metric_type]) {
        let status = 'normal';
        // Thresholds
        if (m.metric_type === 'blood_pressure_systolic') {
          if (m.value > 150) status = 'critical';
          else if (m.value > 140) status = 'warning';
        } else if (m.metric_type === 'blood_sugar_fasting') {
          if (m.value > 150) status = 'critical';
          else if (m.value > 126) status = 'warning';
        } else if (m.metric_type === 'heart_rate') {
          if (m.value > 120 || m.value < 50) status = 'critical';
          else if (m.value > 100 || m.value < 60) status = 'warning';
        } else if (m.metric_type === 'oxygen_saturation') {
          if (m.value < 90) status = 'critical';
          else if (m.value < 95) status = 'warning';
        }

        summary[m.metric_type] = {
          value: m.value,
          unit: m.unit,
          recorded_at: m.recorded_at,
          status
        };
      }
    });

    res.status(200).json(summary);
  } catch (error) {
    console.error('getHealthSummary Error:', error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  logHealthMetric,
  getHealthMetrics,
  getHealthSummary
};
