const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const {
    createAnnouncement,
    getAnnouncements,
    markAsRead,
    updateAnnouncement,
    deleteAnnouncement
} = require('../controllers/announcementController');

// All announcement routes are protected
router.get('/', verifyToken, getAnnouncements);
router.patch('/:id/read', verifyToken, markAsRead);

// Admin only routes
router.post('/', verifyToken, isAdmin, createAnnouncement);
router.patch('/:id', verifyToken, isAdmin, updateAnnouncement);
router.delete('/:id', verifyToken, isAdmin, deleteAnnouncement);

module.exports = router;
