const express = require('express');
const router = express.Router();
const { enable2FA, confirmEnable2FA, disable2FA } = require('../controllers/twoFAController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.post('/enable', enable2FA);
router.post('/confirm-enable', confirmEnable2FA);
router.post('/disable', disable2FA);

module.exports = router;
