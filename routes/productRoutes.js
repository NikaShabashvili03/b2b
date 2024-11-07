const express = require('express');
const productController = require('../controllers/productController');
const router = express.Router();

// Route to create a product
router.post('/', productController.createProduct);

// Route to get products by category
router.get('/', productController.getProductsByCategory);

// Route to delete a product by id
router.delete('/:id', productController.deleteProduct);

module.exports = router;
