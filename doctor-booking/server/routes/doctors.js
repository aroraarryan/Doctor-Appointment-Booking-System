const express = require('express');
const router = express.Router();
const {
       getDoctors,
       getDoctorById,
       updateDoctorProfile,
       getSpecialties,
       getDoctorAvailabilityCalendar,
       getFeaturedDoctors,
       getLatestReviews
} = require('../controllers/doctorController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/featured', getFeaturedDoctors);
router.get('/reviews/latest', getLatestReviews);
router.get('/', getDoctors);
router.get('/specialties', getSpecialties);
router.get('/:id/availability-calendar', getDoctorAvailabilityCalendar);
router.put('/profile', verifyToken, requireRole('doctor'), updateDoctorProfile);
router.get('/:id', getDoctorById);
router.put('/:id', verifyToken, requireRole('admin'), updateDoctorProfile);


module.exports = router;
