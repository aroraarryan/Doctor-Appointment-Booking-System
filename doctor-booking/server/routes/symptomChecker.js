const express = require('express');
const router = express.Router();
const { 
  checkSymptoms, 
  getSymptomHistory 
} = require('../controllers/symptomCheckerController');
const { verifyToken, isPatient } = require('../middleware/auth');

router.use(verifyToken);
router.use(isPatient);

router.post('/', checkSymptoms);
router.get('/history', getSymptomHistory);

module.exports = router;
