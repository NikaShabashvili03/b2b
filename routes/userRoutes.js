const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../utils/checkUser'); 

// User Routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.get('/profile', auth.checkUser, userController.profile);

module.exports = router;
