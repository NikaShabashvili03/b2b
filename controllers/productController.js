const Product = require('../models/Product');
const Category = require('../models/Category');  // Import the Category model
const validateObjectId = require('../utils/validateObjectId');
var ObjectId = require('mongoose').Types.ObjectId;

// Create Product function
exports.createProduct = async (req, res) => {
    try {
        const { name, prod_ID, price, description, images, categoryId } = req.body;

        // Validate categoryId
        if (!ObjectId.isValid(categoryId)) {
            return res.status(400).json({ message: 'Invalid category ID' });
        }

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const product = new Product({
            name,
            prod_ID,
            price,
            description,
            images,
            category: category._id,  // Assign category to product
        });

        const savedProduct = await product.save();
        res.status(201).json({ message: 'Product created successfully', product: savedProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};
// Get all Products function
exports.getAllProducts = async (req, res) => {
    try {
        // Fetch all products from the database
        const products = await Product.find().populate('Category'); // Populating category field to get category details
        res.status(200).json(products); // Return all products with category details
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong while fetching products' });
    }
};


// Get Products function by Category
exports.getProductsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.query;

        if (!ObjectId.isValid(categoryId)) {
            return res.status(400).json({ message: 'Invalid category ID' });
        }

        const products = await Product.find({ category: categoryId });
        res.status(200).json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong' });
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
    const { productId, name, price, description, images, categoryId, quantity } = req.body;

    try {
        // Find product by productId
        const product = await Product.findOne({ prod_ID: productId }); // Use prod_ID for searching

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
