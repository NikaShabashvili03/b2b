// routes/cartRoutes.js
const express = require('express');
const cartController = require('../controllers/cartController');
const auth = require('../utils/checkUser');

const router = express.Router();

// Add product to cart
router.post('/add', auth.checkUser, cartController.addToCart);

// View cart
router.get('/', auth.checkUser, cartController.viewCart);

// Delete specific product from cart
router.delete('/remove/:productId', auth.checkUser, cartController.deleteProductFromCart);

router.post('/checkout', auth.checkUser, cartController.checkout);

router.get('/history', auth.checkUser, cartController.viewSaleHistory);
module.exports = router;
