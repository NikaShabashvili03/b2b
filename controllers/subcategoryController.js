const Subcategory = require('../models/Subcategory');
const Category = require('../models/Category');
const validateObjectId = require('../utils/validateObjectId');

// Create a new subcategory
exports.createSubcategory = async (req, res) => {
    try {
        const { name, description, categoryId } = req.body;

        const subcategory = new Subcategory({ name, description, categoryId });
        await subcategory.save();

        await Category.findByIdAndUpdate(categoryId, { $push: { subcategories: subcategory._id } });

        res.status(201).json(subcategory);
    } catch (error) {
        res.status(400).json({ message: 'Subcategory creation failed', error });
    }
};

// Get all subcategories for a category
exports.getSubcategoriesByCategoryId = async (req, res) => {
    const { categoryId } = req.params;

    if (!validateObjectId(categoryId)) {
        return res.status(400).json({ message: 'Invalid Category ID' });
    }

    try {
        const subcategories = await Subcategory.find({ categoryId }).populate('products');
        res.status(200).json(subcategories);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving subcategories', error });
    }
};

// Update a subcategory
exports.updateSubcategory = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!validateObjectId(id)) {
        return res.status(400).json({ message: 'Invalid Subcategory ID' });
    }

    try {
        const updatedSubcategory = await Subcategory.findByIdAndUpdate(id, { name, description }, { new: true });
        if (!updatedSubcategory) {
            return res.status(404).json({ message: 'Subcategory not found' });
        }
        res.status(200).json(updatedSubcategory);
    } catch (error) {
        res.status(400).json({ message: 'Error updating subcategory', error });
    }
};

// Delete a subcategory
exports.deleteSubcategory = async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id)) {
        return res.status(400).json({ message: 'Invalid Subcategory ID' });
    }

    try {
        const deletedSubcategory = await Subcategory.findByIdAndDelete(id);
        if (!deletedSubcategory) {
            return res.status(404).json({ message: 'Subcategory not found' });
        }
        res.status(200).json({ message: 'Subcategory deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting subcategory', error });
    }
};
