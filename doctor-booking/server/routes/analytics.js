const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken, isAdmin, isDoctor, isPatient } = require('../middleware/auth');

router.use(verifyToken);

// Role-based analytics endpoints
router.get('/patient', isPatient, analyticsController.getPatientAnalytics);
router.get('/doctor', isDoctor, analyticsController.getDoctorAnalytics);
router.get('/admin', isAdmin, analyticsController.getAdminAnalytics);

module.exports = router;
