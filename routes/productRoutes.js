const express = require('express');
const productController = require('../controllers/productController');
const auth = require("../utils/checkAdmin"); 

const router = express.Router();

router.post('/', productController.createProduct);
// Route to get a single product by ID
router.get('/one', productController.getProductsById);

// Route to get products by category
router.get('/category', productController.getProductsByCategory);

// Route to get products by subcategory

// Get all products
router.get('/', productController.getAllProducts);

// Route to delete a product by id
router.delete('/:id', productController.deleteProduct);

// Route to update a product
router.patch('/update', productController.updateProduct);

// route to apply disc on a user (admin only)
// router.post('/Userdiscount', auth.checkAdmin, productController.UserDiscount);

// Route to apply general discount (admin only)
router.post("/applydiscount", auth.checkAdmin, productController.applyDiscount);

module.exports = router;
