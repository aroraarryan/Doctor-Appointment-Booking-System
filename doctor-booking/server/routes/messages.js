const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const messageController = require('../controllers/messageController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.post('/conversation', messageController.getOrCreateConversation);
router.get('/conversations', messageController.getConversations);
router.get('/:conversationId', messageController.getMessages);
router.post('/', upload.single('file'), messageController.sendMessage);
router.patch('/read/:conversationId', messageController.markMessagesAsRead);

module.exports = router;
