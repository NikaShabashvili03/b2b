const express = require('express');
const router = express.Router();
//const auth = require('../middlewares/auth');
const auth= require('../utils/checkAdmin');//ar washalot, mushaobs ragacnairad
const adminController = require('../controllers/adminController');

// Admin routes
router.post('/register',auth.checkAdmin, adminController.createAdmin);
router.post('/login', auth.checkAdmin, adminController.login);
router.get('/profile', auth.checkAdmin, adminController.profile);

module.exports = router;
