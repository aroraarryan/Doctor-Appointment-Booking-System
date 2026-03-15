const express = require('express');
const router = express.Router();
const { uploadAvatar, uploadMedicalRecord, getMedicalRecords, deleteMedicalRecord } = require('../controllers/uploadController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Profile Avatar
router.post('/avatar', verifyToken, uploadAvatar);

// Medical Records (Patient Only for uploading/deleting)
router.post('/medical-record', verifyToken, requireRole('patient'), uploadMedicalRecord);
router.delete('/medical-record/:id', verifyToken, requireRole('patient'), deleteMedicalRecord);

// List Records (Both roles can list, filtered in controller)
router.get('/medical-records', verifyToken, getMedicalRecords);

module.exports = router;
