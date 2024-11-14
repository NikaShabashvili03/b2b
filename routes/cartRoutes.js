const express = require('express');
const cartController = require('../controllers/cartController');
const auth = require('../utils/checkUser');
const Auth = require('../utils/checkAdmin');

const router = express.Router();

// Add product to cart
router.post('/add', auth.checkUser, cartController.addToCart);

// View cart
router.get('/', auth.checkUser, cartController.viewCart);

// Delete specific product from cart
router.delete('/remove/:id', auth.checkUser, cartController.deleteProductFromCart);

router.post('/sell',auth.checkUser, cartController.cartSale); 

router.get('/history', auth.checkUser, cartController.viewSaleHistory);

module.exports = router;
