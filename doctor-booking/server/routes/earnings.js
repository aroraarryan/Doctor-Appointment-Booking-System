const express = require('express');
const router = express.Router();
const earningsController = require('../controllers/earningsController');
const { verifyToken, isDoctor } = require('../middleware/auth');

router.get('/stats', verifyToken, isDoctor, earningsController.getEarningsStats);
router.post('/withdraw', verifyToken, isDoctor, earningsController.withdrawEarnings);

module.exports = router;
