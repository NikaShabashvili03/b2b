const Product = require('../models/Product');
const validateObjectId = require('../utils/validateObjectId');
var ObjectId = require('mongoose').Types.ObjectId; 

// Create Product function
exports.createProduct = async (req, res) => {
    try {
        const { name, prod_id, price, description, images } = req.body;

        const product = new Product({ name, prod_id, price, description, images });
        const savedProduct = await product.save();
        
        res.status(201).json({ message: 'Product created successfully', product: savedProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};

// Get All Products function
exports.getAllProducts = async (req, res) => {
    const { subcategoryId } = req.params;

    if (!validateObjectId(subcategoryId)) {
        return res.status(400).json({ message: 'Invalid SubCategory ID' });
    }

    try {
        const products = await Product.find({ "subcategoryId":new ObjectId(subcategoryId)})
        console.log(products)
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving subcategories', error });
    }
};

// Get Single Product function
exports.getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};

// Update Product function
exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(updatedProduct);
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
