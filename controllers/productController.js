const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const validateObjectId = require('../utils/validateObjectId');
const User = require('../models/User');
// Create a new product
exports.createProduct = async (req, res) => {
    try {
        const { name, prod_id, price, description, images, categoryId, quantity, subcategoryId, attributes } = req.body;

        // Validate categoryId
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ message: 'Invalid category ID' });
        }

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Validate subcategoryId
        if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
            return res.status(400).json({ message: 'Invalid subcategory ID' });
        }

        const subcategory = await Subcategory.findById(subcategoryId);
        if (!subcategory) {
            return res.status(404).json({ message: 'Subcategory not found' });
        }

        // Validate attributes against subcategory attributes
        const subcategoryAttributes = subcategory.attributes;
        const invalidAttributes = Object.keys(attributes).filter(
            attr => !subcategoryAttributes.includes(attr)
        );

        if (invalidAttributes.length > 0) {
            return res.status(400).json({
                message: 'Invalid attributes provided',
                invalidAttributes
            });
        }

        // Create new product
        const product = new Product({
            name,
            prod_id,
            price: parseFloat(price),
            originalPrice: parseFloat(price),
            description,
            images,
            category: category._id,
            subcategory: subcategory._id,
            quantity: parseInt(quantity),
            attributes
        });

        const savedProduct = await product.save();
        res.status(201).json({ message: 'Product created successfully', product: savedProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
};

// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const userId = req.userId; // Extract userId from the request (e.g., from a token)
        const products = await Product.find()
            .populate('category')
            .populate('subcategory');

        const formattedProducts = products.map(product => {
            const originalPrice = parseFloat(product.price) || 0;
            const userDiscount = parseFloat(product.userDiscounts?.find(
                entry => entry.userId?.toString() === userId
            )?.discount || 0);
            const globalDiscount = parseFloat(product.discount || 0);
            const discount = Math.max(globalDiscount, userDiscount);

            return {
                _id: product._id,
                name: product.name,
                discount: discount,
                finalPrice: parseFloat((originalPrice - (originalPrice * discount) / 100).toFixed(2)),
                oldPrice: parseFloat(product.price),
                category: product.category?.name,
                subcategory: product.subcategory?.name,
                quantity: parseInt(product.quantity || 0),
                attributes: product.attributes || [],
            };
        });

        if (formattedProducts.length === 0) {
            return res.status(404).json({ message: 'No products found.' });
        }

        res.status(200).json({
            products: formattedProducts,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong while fetching products.' });
    }
};

// Get a single product by ID
exports.getProductsById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const userId = req.userId; // Extract userId from the request
        const product = await Product.findById(id)
            .populate('category')
            .populate('subcategory');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const originalPrice = product.price || 0;
        const userDiscount = product.userDiscounts?.find(
            entry => entry.userId?.toString() === userId
        )?.discount || 0;
        const globalDiscount = product.discount || 0;
        const discount = Math.max(globalDiscount, userDiscount);

        const formattedProduct = {
            _id: product._id,
            name: product.name,
            discount: parseFloat(discount),
            finalPrice: parseFloat((originalPrice - (originalPrice * discount) / 100).toFixed(2)),
            oldPrice: parseFloat(product.price),
            category: product.category?.name,
            subcategory: product.subcategory?.name,
            quantity: parseInt(product.quantity || 0),
            attributes: product.attributes || [],
        };

        res.status(200).json({
            product: formattedProduct,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong while fetching the product.' });
    }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { subcategoryId, skip = 0, limit = 50, sort = 'asc' } = req.query;
        const userId = req.userId;

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ message: 'Invalid category ID' });
        }

        const products = await Product.find({
            category: categoryId,
            subcategory: subcategoryId,
        })
            .skip(parseInt(skip) * parseInt(limit))
            .limit(parseInt(limit))
            .sort({ name: sort })
            .populate('category', "name")
            .populate('subcategory', "name");

        const formattedProducts = products.map(product => {
            const originalPrice = parseFloat(product.price || 0);
            const userDiscount = parseFloat(product.userDiscounts?.find(
                entry => entry.userId?.toString() === userId
            )?.discount || 0);
            const globalDiscount = parseFloat(product.discount || 0);
            const discount = Math.max(globalDiscount, userDiscount);

            return {
                _id: product._id,
                name: product.name,
                discount: discount,
                finalPrice: parseFloat((originalPrice - (originalPrice * discount) / 100).toFixed(2)),
                oldPrice: parseFloat(product.price),
                category: product.category?.name,
                subcategory: product.subcategory?.name,
                quantity: parseInt(product.quantity || 0),
                attributes: product.attributes || [],
            };
        });

        if (formattedProducts.length === 0) {
            return res.status(404).json({ message: 'No products found for this category or subcategory.' });
        }

        res.status(200).json({
            products: formattedProducts,
            pages: Math.ceil(products.length / limit),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong while fetching products by category.' });
    }
};

// Get products by subcategory
exports.getProductsBySubcategory = async (req, res) => {
    try {
        const { subcategoryId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
            return res.status(400).json({ message: 'Invalid subcategory ID' });
        }

        const products = await Product.find({ subcategory: subcategoryId })
            .populate('category')
            .populate('subcategory');

        if (products.length === 0) {
            return res.status(404).json({ message: 'No products found for this subcategory.' });
        }

        res.status(200).json({ products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong while fetching products by subcategory.' });
    }
};

// Update a product
exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, price, description, images, categoryId, quantity, discount, attributes } = req.body;

    try {
        // Find product by ID
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Update product fields
        if (name) product.name = name;
        if (price) product.price = parseFloat(price);
        if (description) product.description = description;
        if (images) product.images = images;
        if (categoryId) product.category = categoryId;
        if (quantity) product.quantity = parseInt(quantity);
        if (discount) product.discount = discount;

        // Validate and update attributes
        if (attributes) {
            const subcategory = await Subcategory.findById(product.subcategory);
            const subcategoryAttributes = subcategory.attributes;

            const invalidAttributes = Object.keys(attributes).filter(
                attr => !subcategoryAttributes.includes(attr)
            );

            if (invalidAttributes.length > 0) {
                return res.status(400).json({
                    message: 'Invalid attributes provided',
                    invalidAttributes
                });
            }

            product.attributes = attributes;
        }
        // Save the updated product
        await product.save();

        res.status(200).json({ message: 'Product updated successfully', product });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong while updating the product.' });
    }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedProduct = await Product.findByIdAndDelete(id);
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong while deleting the product.' });
    }
};

// Apply discount to products
exports.applyDiscount = async (req, res) => {
    const { productIds, discountRate, userId } = req.body;

    try {
        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ message: 'No products provided for discount' });
        }

        const resetDiscount = discountRate === null;

        if (!resetDiscount && (discountRate < 0 || discountRate > 80)) {
            return res.status(400).json({ message: 'Discount percentage must be between 0 and 80' });
        }

        if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: `Invalid user ID: ${userId}` });
        }

        let user;
        if (userId) {
            user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: `User with ID ${userId} not found` });
            }
        }

        const updatedProducts = await Promise.all(
            productIds.map(async (productId) => {
                if (!mongoose.Types.ObjectId.isValid(productId)) {
                    throw new Error(`Invalid product ID: ${productId}`);
                }

                const product = await Product.findById(productId);
                if (!product) {
                    throw new Error(`Product with ID ${productId} not found`);
                }

                if (resetDiscount) {
                    if (userId) {
                        product.userDiscounts = product.userDiscounts.filter(
                            (discount) => discount.userId.toString() !== userId
                        );
                    } else {
                        product.discount = 0;
                        product.price = product.originalPrice;
                    }
                } else {
                    if (userId) {
                        // Ensure originalPrice is defined
                        const originalPrice = product.originalPrice || product.price;
                        if (isNaN(originalPrice)) {
                            throw new Error(`Invalid originalPrice for product ${productId}`);
                        }

                        const discountAmount = (originalPrice * discountRate) / 100;
                        const userPrice = parseFloat((originalPrice - discountAmount).toFixed(2));

                        const existingDiscount = product.userDiscounts.find(
                            (discount) => discount.userId.toString() === userId
                        );

                        if (existingDiscount) {
                            existingDiscount.discount = discountRate;
                            existingDiscount.userPrice = userPrice;
                        } else {
                            product.userDiscounts.push({
                                userId,
                                discount: discountRate,
                                userPrice,
                            });
                        }
                    } else {
                        // Ensure originalPrice is defined
                        const originalPrice = product.originalPrice || product.price;
                        if (isNaN(originalPrice)) {
                            throw new Error(`Invalid originalPrice for product ${productId}`);
                        }

                        const discountAmount = Math.round((originalPrice * discountRate) / 100);
                        const discountedPrice = parseFloat((originalPrice - discountAmount).toFixed(2));

                        product.discount = discountRate;
                        product.price = discountedPrice;
                    }
                }

                await product.save();
                return product;
            })
        );

        res.status(200).json({
            message: resetDiscount
                ? userId
                    ? 'User-specific discounts reset successfully'
                    : 'Global discounts have been reset'
                : userId
                ? 'User-specific discounts applied successfully'
                : 'Global discounts applied successfully',
            updatedProducts,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error applying or resetting discount', error: error.message });
    }
};