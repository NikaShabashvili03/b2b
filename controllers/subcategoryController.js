const Subcategory = require('../models/Subcategory');
const Category = require('../models/Category');

// Create Subcategory
exports.createSubcategory = async (req, res) => {
    try {
        const category = await Category.findById(req.body.categoryId);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        const subcategory = new Subcategory(req.body);
        await subcategory.save();

        category.subcategory.push(subcategory._id);
        await category.save();

        res.status(201).json(subcategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
