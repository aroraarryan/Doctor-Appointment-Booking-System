const express = require('express');
const router = express.Router();
const { 
    requestSecondOpinion, 
    getOpenRequests, 
    respondToRequest, 
    getMyRequests 
} = require('../controllers/secondOpinionController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', requireRole('patient'), requestSecondOpinion);
router.get('/my', requireRole('patient'), getMyRequests);
router.get('/open', requireRole('doctor'), getOpenRequests);
router.post('/:id/respond', requireRole('doctor'), respondToRequest);

module.exports = router;
