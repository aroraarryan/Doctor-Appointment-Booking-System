const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { verifyToken } = require('../middleware/auth');

router.get('/my', verifyToken, invoiceController.getMyInvoices);
router.get('/:id/pdf', verifyToken, invoiceController.getInvoicePDF);

module.exports = router;
