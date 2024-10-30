const express = require('express');
const subsubcategoryController = require('../controllers/subsubcategoryController');

const router = express.Router();

router.post('/', subsubcategoryController.createSubsubcategory);
router.get('/:subcategoryId', subsubcategoryController.getSubsubcategoriesBySubcategoryId);
router.put('/:id', subsubcategoryController.updateSubsubcategory);
router.delete('/:id', subsubcategoryController.deleteSubsubcategory);

module.exports = router;
