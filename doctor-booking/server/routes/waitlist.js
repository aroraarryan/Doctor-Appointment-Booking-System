const express = require('express');
const router = express.Router();
const waitlistController = require('../controllers/waitlistController');
const { verifyToken, requireRole } = require('../middleware/auth');

// All waitlist routes are protected
router.use(verifyToken);

// Patient routes
router.post('/', waitlistController.joinWaitlist);
router.get('/my', waitlistController.getMyWaitlist);
router.delete('/:id', waitlistController.leaveWaitlist);

// Doctor route
router.get('/doctor/:doctorId', waitlistController.getDoctorWaitlist);

module.exports = router;
