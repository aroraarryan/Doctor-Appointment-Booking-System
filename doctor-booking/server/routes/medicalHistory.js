const express = require('express');
const router = express.Router();
const { getMedicalHistory } = require('../controllers/medicalHistoryController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, requireRole('patient'), getMedicalHistory);

module.exports = router;
