const express = require('express');
const router = express.Router();
const { 
    createPrescription, 
    getPatientPrescriptions, 
    getPrescriptionById, 
    generatePrescriptionPDF 
} = require('../controllers/prescriptionController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', requireRole('doctor'), createPrescription);
router.get('/patient', requireRole('patient'), getPatientPrescriptions);
router.get('/:id', getPrescriptionById);
router.get('/:id/pdf', generatePrescriptionPDF);

module.exports = router;
