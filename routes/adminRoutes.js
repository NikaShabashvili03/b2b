const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth'); // Ensure this is declared only once
const adminController = require('../controllers/adminController');

// Admin routes
router.post('/register', adminController.createAdmin);
router.post('/login', adminController.login);
router.get('/profile', auth, adminController.profile);

module.exports = router;
