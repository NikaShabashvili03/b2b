const Product = require('../models/Product');
const Category = require('../models/Category');  // Import the Category model
const validateObjectId = require('../utils/validateObjectId');
var ObjectId = require('mongoose').Types.ObjectId;

// Create Product function
exports.createProduct = async (req, res) => {
    try {
        const { name, prod_id, price, description, images, categoryId } = req.body;

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
            prod_id,
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
