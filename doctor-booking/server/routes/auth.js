const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { register, login, getMe, logout, verifyOTPLogin, resendOTP } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Brute force protection for login and registration
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: { error: 'Too many authentication attempts, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Protect OTP endpoints specifically
const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // Limit each IP to 5 OTP requests per windowMs
    message: { error: 'Too many OTP requests, please try again after 10 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/verify-otp', otpLimiter, verifyOTPLogin);
router.post('/resend-otp', otpLimiter, resendOTP);
router.get('/me', verifyToken, getMe);
router.post('/logout', verifyToken, logout);

module.exports = router;
