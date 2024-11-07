const express = require('express');
const subcategoryController = require('../controllers/subcategoryController');
const router = express.Router();

router.post('/', subcategoryController.createSubcategory);

module.exports = router;
