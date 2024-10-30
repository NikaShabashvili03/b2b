const Subsubcategory = require('../models/Subsubcategory');
const Subcategory = require('../models/Subcategory');
const validateObjectId = require('../utils/validateObjectId');

// Create a new subsubcategory
exports.createSubsubcategory = async (req, res) => {
    try {
        const { name, description, subcategoryId } = req.body;

        const subsubcategory = new Subsubcategory({ name, description, subcategoryId });
        await subsubcategory.save();

        // Optionally, update subcategory to include this new subsubcategory
        await Subcategory.findByIdAndUpdate(subcategoryId, { $push: { subsubcategories: subsubcategory._id } });

        res.status(201).json(subsubcategory);
    } catch (error) {
        res.status(400).json({ message: 'Subsubcategory creation failed', error });
    }
};

// Get all subsubcategories for a subcategory
exports.getSubsubcategoriesBySubcategoryId = async (req, res) => {
    const { subcategoryId } = req.params;

    if (!validateObjectId(subcategoryId)) {
        return res.status(400).json({ message: 'Invalid Subcategory ID' });
    }

    try {
        const subsubcategories = await Subsubcategory.find({ subcategoryId }).populate('products');
        res.status(200).json(subsubcategories);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving subsubcategories', error });
    }
};

// Update a subsubcategory
exports.updateSubsubcategory = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!validateObjectId(id)) {
        return res.status(400).json({ message: 'Invalid Subsubcategory ID' });
    }

    try {
        const updatedSubsubcategory = await Subsubcategory.findByIdAndUpdate(id, { name, description }, { new: true });
        if (!updatedSubsubcategory) {
            return res.status(404).json({ message: 'Subsubcategory not found' });
        }
        res.status(200).json(updatedSubsubcategory);
    } catch (error) {
        res.status(400).json({ message: 'Error updating subsubcategory', error });
    }
};

// Delete a subsubcategory
exports.deleteSubsubcategory = async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id)) {
        return res.status(400).json({ message: 'Invalid Subsubcategory ID' });
    }

    try {
        const deletedSubsubcategory = await Subsubcategory.findByIdAndDelete(id);
        if (!deletedSubsubcategory) {
            return res.status(404).json({ message: 'Subsubcategory not found' });
        }
        res.status(200).json({ message: 'Subsubcategory deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting subsubcategory', error });
    }
};
