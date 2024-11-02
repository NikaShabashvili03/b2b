// routes/cartRoutes.js
const express = require('express');
const cartController = require('../controllers/cartController');
const auth = require('../middlewares/auth');

const router = express.Router();

// Add product to cart
router.post('/add', auth, cartController.addToCart);

// View cart
router.get('/', auth, cartController.viewCart);

// Delete specific product from cart
router.delete('/remove/:productId', auth, cartController.deleteProductFromCart);

module.exports = router;
