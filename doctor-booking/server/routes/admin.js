const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');

// All routes require admin role
router.use(verifyToken);
router.use(requireRole('admin'));

router.get('/stats', adminController.getStats);
router.get('/appointments-by-day', adminController.getAppointmentsByDay);
router.get('/revenue-by-month', adminController.getRevenueByMonth);
router.get('/specialty-breakdown', adminController.getSpecialtyBreakdown);
router.get('/doctors', adminController.getDoctors);
router.patch('/doctors/:id/approve', adminController.approveDoctor);
router.patch('/doctors/:id/reject', adminController.rejectDoctor);
router.get('/users', adminController.getUsers);
router.patch('/users/:id/suspend', adminController.toggleUserStatus);

// Doctor Verifications
router.get('/verifications', adminController.getVerifications);
router.patch('/verifications/:id', adminController.updateVerificationStatus);

// Featured Doctors
router.get('/featured', adminController.getFeaturedDoctors);
router.post('/featured', adminController.addFeaturedDoctor);
router.delete('/featured/:id', adminController.removeFeaturedDoctor);

router.get('/no-shows', adminController.getNoShows);

module.exports = router;
