const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.post('/conversation', messageController.getOrCreateConversation);
router.get('/conversations', messageController.getConversations);
router.get('/:conversationId', messageController.getMessages);
router.post('/', messageController.sendMessage);

module.exports = router;
