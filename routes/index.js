const express = require('express');
const router = express.Router(); // Initialize router here
const adminRoutes = require('./adminRoutes');
const productRoutes = require('./productRoutes');
const userRoutes = require('./userRoutes');
const categoryRoutes = require('./categoryRoutes');
const subcategoryRoutes = require('./subcategoryRoutes');
const cartRoutes = require('./cartRoutes');


router.use('/admin', adminRoutes);
router.use('/products', productRoutes);
router.use('/user', userRoutes);
router.use('/category', categoryRoutes);
router.use('/subcategory', subcategoryRoutes);
router.use('/cart', cartRoutes);





module.exports = router;