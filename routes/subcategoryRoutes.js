const express = require('express');
const subcategoryController = require('../controllers/subcategoryController');

const router = express.Router();

router.post('/', subcategoryController.createSubcategory);
router.get('/categorty/:categoryId', subcategoryController.getSubcategoriesByCategoryId);
router.put('/:id', subcategoryController.updateSubcategory);  
router.delete('/:id', subcategoryController.deleteSubcategory);  

module.exports = router;
