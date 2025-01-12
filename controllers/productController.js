const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category'); 
const Subcategory = require('../models/Subcategory');  
const User =require('../models/User')
const validateObjectId = require('../utils/validateObjectId');
var ObjectId = require('mongoose').Types.ObjectId;
// Create Product function
exports.createProduct = async (req, res) => {
    try {
        const { name, prod_id, price, description, images, categoryId, quantity, subcategoryId, attributes } = req.body;

        // Validate categoryId
        if (!ObjectId.isValid(categoryId)) {
            return res.status(400).json({ message: 'Invalid category ID' });
        }

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Validate subcategoryId
        if (!ObjectId.isValid(subcategoryId)) {
            return res.status(400).json({ message: 'Invalid subcategory ID' });
        }

        const subcategory = await Subcategory.findById(subcategoryId);
        if (!subcategory) {
            return res.status(404).json({ message: 'Subcategory not found' });
        }

        // Create new product
        const product = new Product({
            name,
            prod_id,
            price: parseFloat(price), // Ensure price is stored as a float
            originalPrice: parseFloat(price),
            description,
            images,
            category: category._id, 
            subcategory: subcategory._id, 
            quantity: parseInt(quantity), // Ensure quantity is an integer
            attributes
        });

        const savedProduct = await product.save();
        res.status(201).json({ message: 'Product created successfully', product: savedProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
};

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
            
                const discount = Math.max(globalDiscount, userDiscount); // Pick the greater discount
            
                return {
                    _id: product._id,
                    name: product.name,
                    discount: discount, // Return as an integer
                    finalPrice: parseFloat((originalPrice - (originalPrice * discount) / 100).toFixed(2)), // Final price
                    oldPrice: parseFloat(product.price), // Original price
                    category: product.category?.name, // Category name
                    subcategory: product.subcategory?.name, // Subcategory name
                    quantity: parseInt(product.quantity || 0), // Product quantity
                    attributes: product.attributes || [], // Product attributes
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

exports.getProductsById = async (req, res) => {
    try {
        const { productId } = req.query;

        if (!ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const userId = req.user.id; // Get user ID from request

        const product = await Product.findById(productId)
            .populate('category')
            .populate('subcategory');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const originalPrice = product.price || 0;

        const userDiscount = product.userDiscounts?.find(
            entry => entry.userId?.toString() === userId
        )?.discount || 0;

        const globalDiscount = product.discount;

        const discount = globalDiscount > userDiscount ? globalDiscount : userDiscount;

        const formattedProduct = {
            _id: product._id,
            name: product.name,
            discount: parseFloat(discount), // Discount as a float
            finalPrice: parseFloat((originalPrice - (originalPrice * discount) / 100).toFixed(2)), // Final price
            oldPrice: parseFloat(product.price), // Original price
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


exports.getProductsByCategory = async (req, res) => {
    try {
        const { categoryId, subcategoryId, skip = 0, limit = 50, sort = 'asc' } = req.query;
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
                console.log(products)
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


exports.applyDiscount = async (req, res) => {
    const { productIds, discountRate, userId } = req.body;

    try {
        // Validate input
        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ message: 'No products provided for discount' });
        }

        const resetDiscount = discountRate === null;

        if (!resetDiscount && (discountRate < 0 || discountRate > 80)) {
            return res.status(400).json({ message: 'Discount percentage must be between 0 and 80' });
        }

        if (userId && !ObjectId.isValid(userId)) {
            return res.status(400).json({ message: `Invalid user ID: ${userId}` });
        }

        let user;
        if (userId) {
            user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: `User with ID ${userId} not found` });
            }
        }

        // Process all products
        const updatedProducts = await Promise.all(
            productIds.map(async (productId) => {
                if (!ObjectId.isValid(productId)) {
                    throw new Error(`Invalid product ID: ${productId}`);
                }

                const product = await Product.findById(productId);
                if (!product) {
                    throw new Error(`Product with ID ${productId} not found`);
                }

                if (resetDiscount) {
                    if (userId) {
                        // Remove user-specific discount
                        product.userDiscounts = product.userDiscounts.filter(
                            (discount) => discount.userId.toString() !== userId
                        );
                    } else {
                        // Reset global discount
                        product.discount = 0;
                        product.price = product.originalPrice;
                    }
                } else {
                    if (userId) {
                        // Apply user-specific discount
                        const discountAmount = (product.originalPrice * discountRate) / 100;
                        const userPrice =  parseFloat((product.originalPrice - discountAmount).toFixed(2));;

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
                        // Apply global discount
                        const originalPrice = product.originalPrice || product.price;
                        const discountAmount = Math.round((originalPrice * discountRate) / 100);
                        const discountedPrice = parseFloat((originalPrice - discountAmount).toFixed(2));

                        product.discount = discountRate;
                        product.price = discountedPrice ;
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



exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedProduct = await Product.findByIdAndDelete(id);
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};


exports.updateProduct = async (req, res) => {
    const { productId, name, price, description, images, categoryId, quantity, discount } = req.body;

    try {
        // Find product by productId
        const product = await Product.findOne({ prod_id: productId }); // Use prod_ID for searching

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Update product fields
        product.name = name || product.name;
        product.price = price ? parseFloat(price) : product.price;
        product.description = description || product.description;
        product.images = images || product.images;
        product.Category = categoryId || product.Category;
        product.quantity = quantity ? parseInt(quantity) : product.quantity;
        product.discount = discount || product.discount;

        // Save the updated product
        await product.save();

        return res.json({
            message: "Product updated successfully",
            product
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
