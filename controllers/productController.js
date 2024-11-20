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
            price, // Discounted price (initially the same as originalPrice)
            originalPrice: price, // Store the original price
            description,
            images,
            category: category._id, 
            subcategory: subcategory._id, 
            quantity,
            attributes
        });

        const savedProduct = await product.save();
        res.status(201).json({ message: 'Product created successfully', product: savedProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
};

// Get all Products function with original and discounted prices
// exports.getAllProducts = async (req, res) => {
//     try {
//         const { skip = 0, limit = 50, sort = 'asc' } = req.query;

//         const products = await Product.find()
//             .skip(parseInt(skip) * parseInt(limit))
//             .limit(parseInt(limit))
//             .sort({ name: sort })
//             .populate('category')
//             .populate('subcategory');

//         // Map products to include original and discounted prices
//         const productsWithPrices = products.map(product => {
//             const originalPrice = product.price;
//             const discountAmount = product.discount
//                 ? (originalPrice * product.discount) / 100
//                 : 0;
//             const discountedPrice = originalPrice - discountAmount;

//             return {
//                 ...product._doc,         
//                 originalPrice,           
//                 discountedPrice,         
//             };
//         });

//         res.status(200).json(productsWithPrices);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Something went wrong while fetching products' });
//     }
// };

exports.getAllProducts = async (req, res) => {
    try {
        const userId = req.user.id; // Extract userId from the request (e.g., from a token)
        const products = await Product.find()
            .populate('category')
            .populate('subcategory');

        const formattedProducts = products.map(product => {
            let discount = 0; // Default discount is 0
            let finalPrice = product.price; // Default to product's original price

            // Check for a user-specific discount
            const userDiscount = product.userDiscounts.find(
                entry => entry.userId.toString() === userId
            );

            if (userDiscount) {
                // Apply user-specific discount
                discount = userDiscount.discount;
                finalPrice = product.price - (product.price * discount) / 100;
            } else if (product.discount > 0) {
                // Apply general discount if no user-specific discount
                discount = product.discount;
                finalPrice = product.price - (product.price * discount) / 100;
            }

            // Example quantity: Assume 1 for now or modify based on request data
            const quantity = 1;
            const totalPrice = finalPrice * quantity;

            // Return the formatted product object
            return {
                productId: {
                    discount, // Discount percentage applied
                    ...product._doc, // Spread all product details
                },
                quantity, // Product quantity
                totalPrice: totalPrice.toFixed(2), // Total price for the quantity
                discount: (product.price * quantity - totalPrice).toFixed(2), // Total discount amount
            };
        });

        res.status(200).json(formattedProducts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong while fetching products' });
    }
};

// Get Product by ID function with original and discounted prices
// exports.getProductsById = async (req, res) => {
//     try {
//         const { productId } = req.query;

//         if (!ObjectId.isValid(productId)) {
//             return res.status(400).json({ message: 'Invalid product ID' });
//         }

//         const product = await Product.findById(productId);

//         if (!product) {
//             return res.status(404).json({ message: 'Product not found' });
//         }

//         const originalPrice = product.price;
//         const discountAmount = product.discount ? (originalPrice * product.discount) / 100 : 0;
//         const discountedPrice = originalPrice - discountAmount;

//         res.status(200).json({
//             ...product._doc,
//             originalPrice,
//             discountedPrice,
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Something went wrong' });
//     }
// };
// Get Product by ID function with original and discounted prices

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

        let discount = 0; // Default discount is 0
        let finalPrice = product.price; // Default to product's original price

        // Check for a user-specific discount
        const userDiscount = product.userDiscounts.find(
            entry => entry.userId.toString() === userId
        );

        if (userDiscount) {
            // Apply user-specific discount
            discount = userDiscount.discount;
            finalPrice = product.price - (product.price * discount) / 100;
        } else if (product.discount > 0) {
            // Apply general discount if no user-specific discount
            discount = product.discount;
            finalPrice = product.price - (product.price * discount) / 100;
        }

        const quantity = 1; // Assume quantity 1
        const totalPrice = finalPrice * quantity;

        res.status(200).json({
            productId: {
                discount, // Discount percentage applied
                ...product._doc, // Spread all product details
            },
            quantity, // Product quantity
            totalPrice: totalPrice.toFixed(2), // Total price for the quantity
            discount: (product.price * quantity - totalPrice).toFixed(2), // Total discount amount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};


// Get Products by Category function with original and discounted prices
// exports.getProductsByCategory = async (req, res) => {
//     try {
//         const { categoryId, subcategoryId } = req.query;
//         const { skip = 0, limit = 50, sort = 'asc' } = req.query;
        
//         if (!ObjectId.isValid(categoryId)) {
//             return res.status(400).json({ message: 'Invalid category ID' });
//         }

//         const products = await Product.find({ category: categoryId, subcategory: subcategoryId })
//             .skip(parseInt(skip) * parseInt(limit))
//             .limit(parseInt(limit))
//             .sort({ name: sort })
//             .populate('category')
//             .populate('subcategory');

//         const productsWithPrices = products.map(product => {
//             const originalPrice = product.price;
//             const discountAmount = product.discount ? (originalPrice * product.discount) / 100 : 0;
//             const discountedPrice = originalPrice - discountAmount;

//             return {
//                 ...product._doc,
//                 originalPrice,
//                 discountedPrice,
//             };
//         });

//         res.status(200).json({
//             product: productsWithPrices,
//             pages: Math.ceil(products.length / limit)
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Something went wrong while fetching products by category' });
//     }
// };


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
                const originalPrice = product.price || 0;
                        
                const userDiscount = product.userDiscounts?.find(
                    entry => entry.userId?.toString() === userId
                )?.discount || 0;
    
                const globalDiscount = product.discount;
    
                const discount = globalDiscount > userDiscount ? globalDiscount : userDiscount;
                console.log(discount)

                
                return {
                    _id: product._id,
                    name: product.name,
                    discount: `${discount}%`, 
                    finalPrice: parseFloat((originalPrice - (originalPrice * discount) / 100).toFixed(2)), 
                    oldPrice: product.price,
                    category: product.category?.name, 
                    subcategory: product.subcategory?.name, 
                    quantity: product.quantity || 0, 
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
                        const discountAmount = (originalPrice * discountRate) / 100;
                        const discountedPrice = parseFloat((originalPrice - discountAmount).toFixed(2));;

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
        product.price = price || product.price;
        product.description = description || product.description;
        product.images = images || product.images;
        product.Category = categoryId || product.Category;
        product.quantity = quantity || product.quantity;
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
