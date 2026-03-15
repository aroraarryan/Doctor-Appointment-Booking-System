const express = require('express');
const router = express.Router();
const { createReview, getDoctorReviews, deleteReview } = require('../controllers/reviewController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Protected: Create a review (Patient only)
router.post('/', verifyToken, requireRole('patient'), createReview);

// Public: Get reviews for a doctor
router.get('/doctor/:doctorId', getDoctorReviews);

// Protected: Delete a review (Patient can delete own, admin can delete any)
router.delete('/:id', verifyToken, deleteReview);

module.exports = router;
