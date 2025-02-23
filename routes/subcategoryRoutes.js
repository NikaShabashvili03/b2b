const express = require('express');
const subcategoryController = require('../controllers/subcategoryController');
const auth = require("../utils/checkAdmin");

const router = express.Router();

router.post('/',auth.checkAdmin, subcategoryController.createSubcategory);
router.get('/category/:categoryId', subcategoryController.getSubcategoriesByCategoryId);
router.put('/:id',auth.checkAdmin, subcategoryController.updateSubcategory);  
router.delete('/:id',auth.checkAdmin, subcategoryController.deleteSubcategory);  
router.post('/:subcategoryId/discount', auth.checkAdmin, subcategoryController.applyDiscountToSubcategory);
router.get('/:subcategoryId/attributes', auth.checkAdmin, subcategoryController.getAttributes);


module.exports = router;
