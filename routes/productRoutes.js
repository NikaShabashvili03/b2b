const express = require('express');
const productController = require('../controllers/productController');
const router = express.Router();

// Route to create a product
router.post('/', productController.createProduct);

// Route to get products by category
router.get('/category', productController.getProductsByCategory);

// Get all products
router.get('/', productController.getAllProducts); // New route to get all products

// Route to delete a product by id
router.delete('/:id', productController.deleteProduct);

router.patch('/update', productController.updateProduct);


module.exports = router;
