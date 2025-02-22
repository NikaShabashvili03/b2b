const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../utils/checkUser'); 
const auth = require('../utils/checkAdmin');


// User Routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.get('/profile', auth.checkUser, userController.profile);
router.get('/all', auth.checkAdmin, userController.getAllUsers);

module.exports = router;
