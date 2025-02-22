const express = require('express');
const productController = require('../controllers/productController');
const subcategoryController = require('../controllers/subcategoryController'); // Import subcategoryController
const auth = require("../utils/checkAdmin");

const router = express.Router();

// Create a new product
router.post('/', productController.createProduct);

// Get a single product by ID
router.get('/one/:id', productController.getProductsById);

// Get products by category
router.get('/category/:categoryId', productController.getProductsByCategory);

// Get products by subcategory
router.get('/subcategory/:subcategoryId', productController.getProductsBySubcategory);

// Get all products
router.get('/', productController.getAllProducts);

// Delete a product by ID
router.delete('/:id', productController.deleteProduct);

// Update a product
router.put('/:id', productController.updateProduct);

// Apply discount (admin only)
router.post("/applydiscount", auth.checkAdmin, productController.applyDiscount);

// Add attributes to a subcategory (admin only)
router.patch('/subcategory/:id/attributes', auth.checkAdmin, subcategoryController.addAttributes);
module.exports = router;