const express = require('express');
const router = express.Router();
const { getSessions, revokeSession, revokeAllOthers } = require('../controllers/sessionController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', getSessions);
router.delete('/all/others', revokeAllOthers);
router.delete('/:id', revokeSession);

module.exports = router;
