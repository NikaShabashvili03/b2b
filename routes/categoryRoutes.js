const express = require('express');
const categoryController = require('../controllers/categoryController');

const router = express.Router();

router.post('/', categoryController.createCategory);
router.get('/', categoryController.getAllCategories);
router.put('/:id', categoryController.updateCategory);  // Update category
router.delete('/:id', categoryController.deleteCategory);  // Delete category

module.exports = router;
