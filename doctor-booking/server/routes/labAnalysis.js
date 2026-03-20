const express = require('express');
const router = express.Router();
const { analyzeLabReport, getMyLabAnalyses } = require('../controllers/labAnalysisController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.post('/:recordId', requireRole('patient'), analyzeLabReport);
router.get('/my', requireRole('patient'), getMyLabAnalyses);

module.exports = router;
