const express = require('express');
const router = express.Router();
const insuranceController = require('../controllers/insuranceController');
const { verifyToken } = require('../middleware/auth');

router.post('/claim', verifyToken, insuranceController.createClaim);
router.get('/my', verifyToken, insuranceController.getMyClaims);

module.exports = router;
