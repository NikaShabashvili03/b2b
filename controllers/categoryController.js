const Category = require('../models/Category');
const validateObjectId = require('../utils/validateObjectId');
const Product = require('../models/Product'); // Ensure this path is correct
// const { applyDiscountToSubcategory } = require('./subcategoryController'); // Assuming the function is in the same file

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
        const categories = await Category.find().populate('subcategory');
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
        console.log(deletedCategory)
        res.status(200).json(deletedCategory);
    } catch (error) {
        res.status(500).json({ message: 'Error deleting category', error });
    }
};

exports.applyDiscountToCategory = async (req, res) => {
    const { categoryId } = req.params;
    const { discountPercentage, userId } = req.body;

    if (!validateObjectId(categoryId)) {
        return res.status(400).json({ message: 'Invalid Category ID' });
    }
    if (userId && !validateObjectId(userId)) {
        return res.status(400).json({ message: 'Invalid User ID' });
    }

    try {
        // Find the category and its subcategories
        const category = await Category.findById(categoryId).populate('subcategory');
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        let updatedSubcategories = [];

        // Iterate through subcategories and handle product discounts
        for (const subcategory of category.subcategory) {
            const products = await Product.find({ subcategory: subcategory._id });

            if (products.length === 0) {
                continue; // Skip if no products are found
            }

            const updatedProducts = await Promise.all(
                products.map(async (product) => {
                    let updatedPrice = product.price; // Start with the current price

                    if (discountPercentage === null || discountPercentage === 0) {
                        // Reset the discount fields to original price
                        if (userId) {
                            const userDiscount = product.userDiscounts.find(
                                (discount) => discount.userId.toString() === userId
                            );
                            if (userDiscount) {
                                userDiscount.discount = 0; // Reset user discount
                                userDiscount.userPrice = product.originalPrice || product.price; // Reset to original price
                            }
                        } else {
                            product.discount = 0; // Reset global discount
                            updatedPrice = product.originalPrice || product.price; // Reset to original price
                        }
                    } else {
                        if (discountPercentage < 0 || discountPercentage > 80) {
                            return res.status(400).json({ message: 'Discount percentage must be between 0 and 80' });
                        }

                        const originalPrice = product.originalPrice || product.price;
                        const discountAmount = (originalPrice * discountPercentage) / 100;
                        updatedPrice = parseFloat((originalPrice - discountAmount).toFixed(2));

                        if (userId) {
                            // Update or add user-specific discount
                            const existingDiscount = product.userDiscounts.find(
                                (discount) => discount.userId.toString() === userId
                            );

                            if (existingDiscount) {
                                existingDiscount.discount = discountPercentage;
                                existingDiscount.userPrice = updatedPrice;
                            } else {
                                product.userDiscounts.push({
                                    userId,
                                    discount: discountPercentage,
                                    userPrice: updatedPrice,
                                });
                            }
                        } else {
                            // Apply global discount
                            product.discount = discountPercentage;
                        }
                    }

                    product.price = updatedPrice; // Set the final price
                    await product.save();
                    return product;
                })
            );

            updatedSubcategories.push({ subcategory, updatedProducts });
        }

        if (updatedSubcategories.length === 0) {
            return res.status(404).json({ message: 'No products found in any subcategories' });
        }

        res.status(200).json({
            message: discountPercentage === null
                ? (userId
                    ? 'User-specific discount removed successfully from category products'
                    : 'Global discount removed successfully from category products')
                : (userId
                    ? 'User-specific discount applied successfully to category products'
                    : 'Global discount applied successfully to category products'),
            updatedSubcategories,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error applying discount to category', error: error.message });
    }
};
