// routes/cartRoutes.js
const express = require('express');
const cartController = require('../controllers/cartController');
const checkUser = require("../utils/checkUser").checkUser;
const auth = require('../middlewares/auth');

const router = express.Router();

// Add product to cart
router.post('/add', checkUser, cartController.addToCart);

// View cart
router.get('/', checkUser, cartController.viewCart);

// Delete specific product from cart
router.delete('/delete/:cartId', checkUser, cartController.deleteProductFromCart);

module.exports = router;
