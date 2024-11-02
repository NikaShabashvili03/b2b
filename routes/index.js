const express = require('express');
const adminRoutes = require('./adminRoutes');
const productRoutes = require('./productRoutes');
const userRoutes = require('./userRoutes');
const categoryRoutes = require('./categoryRoutes');
const subcategoryRoutes = require('./subcategoryRoutes');
const subsubcategoryRoutes = require('./subsubcategoryRoutes');
const cartRoutes = require('./cartRoutes');
const router = express.Router();


router.use('/admin', adminRoutes);
router.use('/products', productRoutes);
router.use('/user', userRoutes);
router.use('/category', categoryRoutes);
router.use('/subcategory', subcategoryRoutes);
router.use('/subsubcategory', subsubcategoryRoutes);
router.use('/cart', cartRoutes);
module.exports = router;