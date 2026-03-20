const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { verifyToken, isDoctor } = require('../middleware/auth');

// Public
router.get('/plans', subscriptionController.getPlans);
router.post('/webhook', subscriptionController.handleWebhook);

// Protected (Doctor only)
router.post('/subscribe', verifyToken, isDoctor, subscriptionController.subscribe);
router.post('/cancel', verifyToken, isDoctor, subscriptionController.cancelSubscription);
router.get('/my', verifyToken, isDoctor, subscriptionController.getMySubscription);

module.exports = router;
