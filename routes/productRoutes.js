const express = require('express');
const productController = require('../controllers/productController');
const router = express.Router();
const auth = require("../utils/checkAdmin")

// Route to create a product
router.post('/', productController.createProduct);

router.get('/one', productController.getProductsById)
// Route to get products by category
router.get('/category', productController.getProductsByCategory);

// Get all products
router.get('/', productController.getAllProducts); // New route to get all products

// Route to delete a product by id
router.delete('/:id', productController.deleteProduct);

router.patch('/update', productController.updateProduct);

router.post("/applyDisscount", auth.checkAdmin, productController.applyDiscount);

module.exports = router;
