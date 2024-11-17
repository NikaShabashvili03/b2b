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
// Get Products by Category function with original and discounted prices
exports.getProductsByCategory = async (req, res) => {
    try {
        const { categoryId, subcategoryId } = req.query;
        const { skip = 0, limit = 50, sort = 'asc' } = req.query;

        if (!ObjectId.isValid(categoryId)) {
            return res.status(400).json({ message: 'Invalid category ID' });
        }

        const userId = req.user.id; // Get user ID from request

        const products = await Product.find({ category: categoryId, subcategory: subcategoryId })
            .skip(parseInt(skip) * parseInt(limit))
            .limit(parseInt(limit))
            .sort({ name: sort })
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

            const quantity = 1; // Example quantity
            const totalPrice = finalPrice * quantity;

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

        res.status(200).json({
            product: formattedProducts,
            pages: Math.ceil(products.length / limit)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong while fetching products by category' });
    }
};


// Get Products by Subcategory function with original and discounted prices
// exports.getProductsBysubcategory = async (req, res) => {
//     try {
//         const { subcategoryId } = req.body;
//         const { skip = 0, limit = 50 } = req.query; 

//         if (!ObjectId.isValid(subcategoryId)) {
//             return res.status(400).json({ message: 'Invalid subcategory ID' });
//         }

//         const products = await Product.find({ subcategory: subcategoryId })
//             .skip(parseInt(skip) * parseInt(limit)) 
//             .limit(parseInt(limit)) 
//             .sort({ name: 'asc' }) 
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

//         res.status(200).json(productsWithPrices);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Something went wrong' });
//     }
// };
// Get Products by Subcategory function with original and discounted prices
exports.getProductsBysubcategory = async (req, res) => {
    try {
        const { subcategoryId } = req.body;
        const { skip = 0, limit = 50 } = req.query; 

        if (!ObjectId.isValid(subcategoryId)) {
            return res.status(400).json({ message: 'Invalid subcategory ID' });
        }

        const userId = req.user.id; // Get user ID from request

        const products = await Product.find({ subcategory: subcategoryId })
            .skip(parseInt(skip) * parseInt(limit)) 
            .limit(parseInt(limit)) 
            .sort({ name: 'asc' }) 
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

            const quantity = 1; // Example quantity
            const totalPrice = finalPrice * quantity;

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
        res.status(500).json({ message: 'Something went wrong' });
    }
};


exports.applyDiscount = async (req, res) => {
    const { productIds, discountPercentage, userId } = req.body;

    try {
        // Validate that the discount percentage is a number between 0 and 80
        if (discountPercentage < 0 || discountPercentage > 80) {
            return res.status(400).json({ message: 'Discount percentage must be between 0 and 80' });
        }

        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ message: 'No products provided for discount' });
        }

        // If userId is provided, validate if the user exists and their role
        if (userId) {
            // Validate the userId and check if the user exists
            if (!ObjectId.isValid(userId)) {
                return res.status(400).json({ message: `Invalid user ID: ${userId}` });
            }

            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ message: `User with ID ${userId} not found` });
            }

            // Only admins can assign discounts to specific users
            if (user.role !== 'Admin') {
                return res.status(403).json({ message: 'Only admins can assign discounts to users' });
            }
        }

        // Process each product ID
        const updatedProducts = await Promise.all(productIds.map(async (productId) => {
            if (!ObjectId.isValid(productId)) {
                throw new Error(`Invalid product ID: ${productId}`);
            }

            const product = await Product.findById(productId);
            if (!product) {
                throw new Error(`Product with ID ${productId} not found`);
            }

            const originalPrice = product.price; // Keep the original price
            const discountAmount = (originalPrice * discountPercentage) / 100;
            const discountedPrice = originalPrice - discountAmount;

            if (userId) {
                // Assign user-specific discount
                const existingDiscount = product.userDiscounts.find(
                    (d) => d.userId.toString() === userId
                );

                const userPrice = discountedPrice; // Discounted price for the user

                if (existingDiscount) {
                    existingDiscount.discount = discountPercentage; // Update existing discount
                    existingDiscount.userPrice = userPrice; // Update user-specific price
                } else {
                    product.userDiscounts.push({ userId, discount: discountPercentage, userPrice }); // Add new discount
                }
            } else {
                // Apply global discount
                product.discount = discountPercentage; // Store the global discount percentage
                product.price = discountedPrice; // Update the price with the discounted price
            }

            await product.save();
            return product;
        }));

        res.status(200).json({
            message: 'Discount applied successfully to the products',
            updatedProducts
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error applying discount', error: error.message });
    }
};

exports.UserDiscount = async (req, res) => {
    const { productIds, discountPercentage, userId } = req.body;

    try {
        // Validate discount percentage
        if (discountPercentage < 0 || discountPercentage > 80) {
            return res.status(400).json({ message: 'Discount percentage must be between 0 and 80' });
        }

        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ message: 'No products provided for discount' });
        }

        // Validate userId
        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ message: `Invalid user ID: ${userId}` });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: `User with ID ${userId} not found` });
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

                // Calculate the discounted price
                const discountAmount = (product.originalPrice * discountPercentage) / 100;
                const userPrice = product.originalPrice - discountAmount;

                // Check if the user already has a discount for this product
                const existingDiscount = product.userDiscounts.find(
                    (discount) => discount.userId.toString() === userId
                );

                if (existingDiscount) {
                    // Update existing discount and userPrice
                    existingDiscount.discount = discountPercentage;
                    existingDiscount.userPrice = userPrice;
                } else {
                    // Add new discount entry for the user
                    product.userDiscounts.push({ 
                        userId, 
                        discount: discountPercentage, 
                        userPrice 
                    });
                }

                // Save the updated product with the new or updated userDiscounts
                await product.save();

                return product;
            })
        );

        res.status(200).json({
            message: 'Discount applied successfully to the products',
            updatedProducts,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error applying discount', error: error.message });
    }
};


// exports.UserDiscount = async (req, res) => {
//     const { productId, userId, discountPercentage } = req.body;

//     try {
//         // Validate inputs
//         if (!ObjectId.isValid(productId)) {
//             return res.status(400).json({ message: 'Invalid product ID' });
//         }

//         if (!ObjectId.isValid(userId)) {
//             return res.status(400).json({ message: 'Invalid user ID' });
//         }

//         if (discountPercentage < 0 || discountPercentage > 80) {
//             return res.status(400).json({ message: 'Discount percentage must be between 0 and 80' });
//         }

//         // Check if the requester is an admin
//         const adminUser = await User.findById(req.userId);
//         if (!adminUser || adminUser.role !== 'admin') {
//             return res.status(403).json({ message: 'Only admins can assign user-specific discounts' });
//         }

//         // Find the product
//         const product = await Product.findById(productId);
//         if (!product) {
//             return res.status(404).json({ message: 'Product not found' });
//         }

//         // Find if a discount already exists for the user
//         const existingDiscountIndex = product.userDiscounts.findIndex(
//             (entry) => entry.userId.toString() === userId
//         );

//         if (existingDiscountIndex !== -1) {
//             // Update existing discount
//             product.userDiscounts[existingDiscountIndex].discount = discountPercentage;
//         } else {
//             // Add new discount
//             product.userDiscounts.push({ userId, discount: discountPercentage });
//         }

//         await product.save();

//         res.status(200).json({ message: 'User-specific discount assigned successfully', product });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Error assigning user-specific discount', error: error.message });
//     }
// };
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
