const Product = require('../models/Product');
const Category = require('../models/Category'); 
const Subcategory = require('../models/Subcategory');  
const validateObjectId = require('../utils/validateObjectId');
var ObjectId = require('mongoose').Types.ObjectId;

// Create Product function
exports.createProduct = async (req, res) => {
    try {
        const { name, prod_id, price, description, images, categoryId, quantity, subcategoryId, attributes, } = req.body;

        // Validate categoryId
        if (!ObjectId.isValid(categoryId)) {
            return res.status(400).json({ message: 'Invalid category ID' });
        }

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        if (!ObjectId.isValid(subcategoryId)) {
            return res.status(400).json({ message: 'Invalid subcategory ID' });
        }

        const subcategory = await Subcategory.findById(subcategoryId);
        if (!subcategory) {
            return res.status(404).json({ message: 'Subcategory not found' });
        }

        const product = new Product({
            name,
            prod_id,
            price,
            description,
            images,
            category: category._id, 
            subcategory: subcategory._id, 
            quantity,
            attributes,
        });

        const savedProduct = await product.save();
        res.status(201).json({ message: 'Product created successfully', product: savedProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};
// Get all Products function
// Get all Products function with original and discounted prices
exports.getAllProducts = async (req, res) => {
    try {
        const { skip = 0, limit = 50, sort = 'asc' } = req.query;

        const products = await Product.find()
            .skip(parseInt(skip) * parseInt(limit))
            .limit(parseInt(limit))
            .sort({ name: sort })
            .populate('category')
            .populate('subcategory');

        // Map products to include original and discounted prices
        const productsWithPrices = products.map(product => {
            const originalPrice = product.price;
            const discountAmount = product.discount
                ? (originalPrice * product.discount) / 100
                : 0;
            const discountedPrice = originalPrice - discountAmount;

            return {
                ...product._doc,         
                originalPrice,           
                discountedPrice,         
            };
        });

        res.status(200).json(productsWithPrices);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong while fetching products' });
    }
};

// Get Product by ID function with original and discounted prices
exports.getProductsById = async (req, res) => {
    try {
        const { productId } = req.query;

        if (!ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const originalPrice = product.price;
        const discountAmount = product.discount ? (originalPrice * product.discount) / 100 : 0;
        const discountedPrice = originalPrice - discountAmount;

        res.status(200).json({
            ...product._doc,
            originalPrice,
            discountedPrice,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};

// Get Products by Category function with original and discounted prices
exports.getProductsByCategory = async (req, res) => {
    try {
        const { categoryId, subcategoryId } = req.query;
        const { skip = 0, limit = 50, sort = 'asc' } = req.query;
        
        if (!ObjectId.isValid(categoryId)) {
            return res.status(400).json({ message: 'Invalid category ID' });
        }

        const products = await Product.find({ category: categoryId, subcategory: subcategoryId })
            .skip(parseInt(skip) * parseInt(limit))
            .limit(parseInt(limit))
            .sort({ name: sort })
            .populate('category')
            .populate('subcategory');

        const productsWithPrices = products.map(product => {
            const originalPrice = product.price;
            const discountAmount = product.discount ? (originalPrice * product.discount) / 100 : 0;
            const discountedPrice = originalPrice - discountAmount;

            return {
                ...product._doc,
                originalPrice,
                discountedPrice,
            };
        });

        res.status(200).json({
            product: productsWithPrices,
            pages: Math.ceil(products.length / limit)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong while fetching products by category' });
    }
};

// Get Products by Subcategory function with original and discounted prices
exports.getProductsBysubcategory = async (req, res) => {
    try {
        const { subcategoryId } = req.body;
        const { skip = 0, limit = 50 } = req.query; 

        if (!ObjectId.isValid(subcategoryId)) {
            return res.status(400).json({ message: 'Invalid subcategory ID' });
        }

        const products = await Product.find({ subcategory: subcategoryId })
            .skip(parseInt(skip) * parseInt(limit)) 
            .limit(parseInt(limit)) 
            .sort({ name: 'asc' }) 
            .populate('subcategory'); 

        const productsWithPrices = products.map(product => {
            const originalPrice = product.price;
            const discountAmount = product.discount ? (originalPrice * product.discount) / 100 : 0;
            const discountedPrice = originalPrice - discountAmount;

            return {
                ...product._doc,
                originalPrice,
                discountedPrice,
            };
        });

        res.status(200).json(productsWithPrices);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};

exports.applyDiscount = async (req, res) => {
    const { productIds, discountPercentage, userId } = req.body;

    try {
        // Validate that the discount percentage is a number between 0 and 100
        if (discountPercentage < 0 || discountPercentage > 100) {
            return res.status(400).json({ message: 'Discount percentage must be between 0 and 100' });
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

            // Optionally, check if the user has the required role or permission
            if (user.role !== 'client') {
                return res.status(403).json({ message: 'Discount can only be applied for clients' });
            }
        }

        // Use reduce to process all the product IDs
        const updatedProducts = await productIds.reduce(async (acc, productId) => {
            const accumulator = await acc;  // Ensure async processing

            if (!ObjectId.isValid(productId)) {
                throw new Error(`Invalid product ID: ${productId}`);
            }

            // Find the product by its ID
            const product = await Product.findById(productId);

            if (!product) {
                throw new Error(`Product with ID ${productId} not found`);
            }

            // Calculate the discount
            const originalPrice = product.price;
            const discountAmount = (originalPrice * discountPercentage) / 100;
            const discountedPrice = originalPrice - discountAmount;

            // Update the product's price with the discounted price
            product.price = discountedPrice;

            // Save the updated product
            await product.save();

            // Accumulate the updated product to the result array
            accumulator.push(product);

            return accumulator;
        }, Promise.resolve([]));  // Initialize accumulator as an empty array

        res.status(200).json({
            message: 'Discount applied successfully to the products',
            updatedProducts
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error applying discount', error: error.message });
    }
};
// Delete Product function
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
