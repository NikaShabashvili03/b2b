const express = require('express');
const invoiceController = require('../controllers/invoiceController');
const auth = require('../utils/checkAdmin'); 
const auth2 = require('../utils/checkUser'); 

const router = express.Router();

router.post('/', auth2.checkUser, invoiceController.createInvoice);
router.get('/', auth.checkAdmin, invoiceController.getAllInvoices);
router.get('/:id', auth.checkAdmin, invoiceController.getInvoiceById);
router.put('/:id', auth.checkAdmin, invoiceController.updateInvoice);
router.delete('/:id', auth.checkAdmin, invoiceController.deleteInvoice);



module.exports = router;