const Subcategory = require('../models/Subcategory');
const Category = require('../models/Category');
const Product = require('../models/Product');
const validateObjectId = require('../utils/validateObjectId');

// Create a new subcategory
exports.createSubcategory = async (req, res) => {
    try {
        const { name, description, categoryId, attributes } = req.body;

        if (!validateObjectId(categoryId)) {
            return res.status(400).json({ message: 'Invalid Category ID' });
        }

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const subcategory = new Subcategory({ name, description, categoryId, attributes });
        await subcategory.save();

        await Category.findByIdAndUpdate(categoryId, { $push: { subcategory: subcategory._id } });

        res.status(201).json({
            message: 'Subcategory created successfully',
            subcategory
        });
    } catch (error) {
        res.status(500).json({ message: 'Subcategory creation failed', error: error.message });
    }
};

// Get all subcategories for a category
exports.getSubcategoriesByCategoryId = async (req, res) => {
    const { categoryId } = req.params;

    if (!validateObjectId(categoryId)) {
        return res.status(400).json({ message: 'Invalid Category ID' });
    }

    try {
        const subcategories = await Subcategory.find({ categoryId }).populate('categoryId', 'name');

        if (subcategories.length === 0) {
            return res.status(404).json({ message: 'No subcategories found for this category.' });
        }

        const formattedSubcategories = subcategories.map(subcat => ({
            _id: subcat._id,
            name: subcat.name,
            description: subcat.description,
            category: subcat.categoryId.name,
            attributes: subcat.attributes
        }));

        res.status(200).json(formattedSubcategories);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving subcategories', error: error.message });
    }
};

// Update a subcategory
exports.updateSubcategory = async (req, res) => {
    const { id } = req.params;
    const { name, description, attributes } = req.body;

    if (!validateObjectId(id)) {
        return res.status(400).json({ message: 'Invalid Subcategory ID' });
    }

    try {
        const updatedSubcategory = await Subcategory.findByIdAndUpdate(
            id,
            { name, description, attributes },
            { new: true }
        );

        if (!updatedSubcategory) {
            return res.status(404).json({ message: 'Subcategory not found' });
        }

        res.status(200).json({ message: 'Subcategory updated successfully', subcategory: updatedSubcategory });
    } catch (error) {
        res.status(500).json({ message: 'Error updating subcategory', error: error.message });
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
        res.status(200).json(deletedSubcategory);
    } catch (error) {
        res.status(500).json({ message: 'Error deleting subcategory', error: error.message });
    }
};

exports.addAttributes = async (req, res) => {
    const { id } = req.params;
    const { attributes } = req.body;

    if (!validateObjectId(id)) {
        return res.status(400).json({ message: 'Invalid Subcategory ID' });
    }

    try {
        // Find the subcategory
        const subcategory = await Subcategory.findById(id);
        if (!subcategory) {
            return res.status(404).json({ message: 'Subcategory not found' });
        }

        // Add new attributes if provided
        if (attributes && Array.isArray(attributes)) {
            attributes.forEach(attr => {
                if (!subcategory.attributes.includes(attr)) {
                    subcategory.attributes.push(attr); // Add new attribute if it doesn't already exist
                }
            });
        }

        // Save the updated subcategory
        const updatedSubcategory = await subcategory.save();

        res.status(200).json(updatedSubcategory);
    } catch (error) {
        res.status(400).json({ message: 'Error adding attributes', error });
    }
};

// Apply user-specific discount to subcategory products
exports.applyDiscountToSubcategory = async (req, res) => { 
    const { subcategoryId } = req.params;
    const { discountPercentage, userId } = req.body;

    // Validate subcategory ID and user ID if present
    if (!validateObjectId(subcategoryId)) {
        return res.status(400).json({ message: 'Invalid Subcategory ID' });
    }
    if (userId && !validateObjectId(userId)) {
        return res.status(400).json({ message: 'Invalid User ID' });
    }

    try {
        // Find products in the specified subcategory
        const products = await Product.find({ subcategory: subcategoryId });

        // If no products found, return error
        if (products.length === 0) {
            return res.status(404).json({ message: 'No products found for this subcategory.' });
        }

        // Apply discount to all products in the subcategory
        const updatedProducts = await Promise.all(
            products.map(async (product) => {
                if (discountPercentage === null) {
                    // Remove the discount by setting it to null
                    if (userId) {
                        // Remove user-specific discount
                        product.userDiscounts = product.userDiscounts.filter(
                            (discount) => discount.userId.toString() !== userId
                        );
                    } else {
                        // Remove global discount
                        product.discount = null;
                        product.price = product.originalPrice || product.price; // Reset to original price
                    }
                } else {
                    // Validate discount percentage
                    if (discountPercentage < 0 || discountPercentage > 80) {
                        return res.status(400).json({ message: 'Discount percentage must be between 0 and 80' });
                    }

                    const originalPrice = product.originalPrice || product.price;
                    const discountAmount = (originalPrice * discountPercentage) / 100;
                    const discountedPrice = parseFloat((originalPrice - discountAmount).toFixed(2));

                    // Apply user-specific discount or global discount
                    if (userId) {
                        const existingDiscount = product.userDiscounts.find(
                            (discount) => discount.userId.toString() === userId
                        );

                        if (existingDiscount) {
                            existingDiscount.discount = discountPercentage;
                            existingDiscount.userPrice = discountedPrice;
                        } else {
                            product.userDiscounts.push({
                                userId,
                                discount: discountPercentage,
                                userPrice: discountedPrice,
                            });
                        }
                    } else {
                        product.discount = discountPercentage;
                        product.price = discountedPrice;
                    }
                }

                // Save the updated product
                await product.save();
                return product;
            })
        );

        // Return success message with updated products
        res.status(200).json({
            message: discountPercentage === null
                ? (userId
                    ? 'User-specific discount removed successfully from subcategory products'
                    : 'Global discount removed successfully from subcategory products')
                : (userId
                    ? 'User-specific discount applied successfully to subcategory products'
                    : 'Global discount applied successfully to subcategory products'),
            updatedProducts,
        });
    } catch (error) {
        // Handle errors
        res.status(500).json({ message: 'Error applying discount', error: error.message });
    }
};



