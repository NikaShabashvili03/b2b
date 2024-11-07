const Category = require('../models/Category');
const validateObjectId = require('../utils/validateObjectId');

// Create a new category
exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const category = new Category({ name, description });
        await category.save();
        res.status(201).json(category);
    } catch (error) {
        res.status(400).json({ message: 'Category creation failed', error });
    }
};

// Get all categories
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().populate('subcategories');
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving categories', error });
    }
};

// Update a category
exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    // Validate ObjectId
    if (!validateObjectId(id)) {
        return res.status(400).json({ message: 'Invalid Category ID' });
    }

    try {
        const updatedCategory = await Category.findByIdAndUpdate(id, { name, description }, { new: true });
        if (!updatedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json(updatedCategory);
    } catch (error) {
        res.status(400).json({ message: 'Error updating category', error });
    }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
    const { id } = req.params;

    // Validate ObjectId
    if (!validateObjectId(id)) {
        return res.status(400).json({ message: 'Invalid Category ID' });
    }

    try {
        const deletedCategory = await Category.findByIdAndDelete(id);
        if (!deletedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json({ message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting category', error });
    }
};
