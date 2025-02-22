const express = require('express');
const subcategoryController = require('../controllers/subcategoryController');
const auth = require("../utils/checkAdmin");

const router = express.Router();

router.post('/', subcategoryController.createSubcategory);
router.get('/category/:categoryId', subcategoryController.getSubcategoriesByCategoryId);
router.put('/:id', subcategoryController.updateSubcategory);  
router.delete('/:id', subcategoryController.deleteSubcategory);  
router.post('/:subcategoryId/discount', auth.checkAdmin, subcategoryController.applyDiscountToSubcategory);
router.get('/:subcategoryId/attributes', auth.checkAdmin, subcategoryController.getAttributes);


module.exports = router;
