const express = require('express');
const router = express.Router();
const { getSlots, setAvailability } = require('../controllers/availabilityController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/:doctorId', getSlots);
router.put('/', verifyToken, requireRole('doctor'), setAvailability);

module.exports = router;
