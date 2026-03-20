const express = require('express');
const router = express.Router();
const { 
  logHealthMetric, 
  getHealthMetrics, 
  getHealthSummary 
} = require('../controllers/healthMetricsController');
const { verifyToken, isPatient } = require('../middleware/auth');

// All routes are protected and for patients only
router.use(verifyToken);
router.use(isPatient);

router.post('/', logHealthMetric);
router.get('/', getHealthMetrics);
router.get('/summary', getHealthSummary);

module.exports = router;
