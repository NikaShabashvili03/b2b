const express = require('express');
const router = express.Router();
const { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct } = require('../controllers/productController');

// Product Routes
router.post('/', createProduct);
router.get('/:subcategoryId', getAllProducts);
router.get('/:subcategoryId/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
