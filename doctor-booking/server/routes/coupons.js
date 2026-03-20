const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Public/System
router.post('/validate', verifyToken, couponController.validateCoupon);

// Admin only
router.post('/', verifyToken, isAdmin, couponController.createCoupon);
router.get('/admin/list', verifyToken, isAdmin, couponController.getCoupons);

module.exports = router;
