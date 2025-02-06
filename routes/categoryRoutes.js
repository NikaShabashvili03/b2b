const express = require('express');
const categoryController = require('../controllers/categoryController');
const auth = require('../utils/checkAdmin');

const router = express.Router();

router.post('/', categoryController.createCategory);
router.get('/', categoryController.getAllCategories);
router.put('/:id', categoryController.updateCategory);  // Update category
router.delete('/:id', categoryController.deleteCategory);  // Delete category
router.put('/:categoryId/discount', auth.checkAdmin, categoryController.applyDiscountToCategory);

module.exports = router;
