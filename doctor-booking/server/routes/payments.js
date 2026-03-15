const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken, isPatient } = require('../middleware/auth');

router.use(verifyToken);

// Order routes
router.post('/create-order', isPatient, paymentController.createOrder);
router.post('/verify', isPatient, paymentController.verifyPayment);
router.post('/refund', isPatient, paymentController.refundPayment);

// History route
router.get('/history', paymentController.getPaymentHistory);

module.exports = router;
