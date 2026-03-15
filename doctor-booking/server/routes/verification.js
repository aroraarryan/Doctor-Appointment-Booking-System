const express = require('express');
const router = express.Router();
const {
       uploadVerificationDoc,
       getMyVerificationStatus,
       getPendingVerifications,
       updateVerificationStatus
} = require('../controllers/verificationController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Protected: Doctor only
router.post('/upload', verifyToken, requireRole('doctor'), uploadVerificationDoc);
router.get('/my-status', verifyToken, requireRole('doctor'), getMyVerificationStatus);

// Protected: Admin only
router.get('/admin/list', verifyToken, requireRole('admin'), getPendingVerifications);
router.patch('/admin/:id', verifyToken, requireRole('admin'), updateVerificationStatus);

module.exports = router;
