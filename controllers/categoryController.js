const express = require('express');
const Category = require('../models/Category');
const categoryController = require('../controllers/categoryController');  // Ensure this path is correct
const router = express.Router();

// Create a category
exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const category = new Category({ name, description });
        const savedCategory = await category.save();
        res.status(201).json({ message: 'Category created successfully', category: savedCategory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};

// Create a subcategory
exports.createSubcategory = async (req, res) => {
    try {
        const { name, description, categoryId } = req.body;

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        category.subcategory.push({ name, description });
        await category.save();

        res.status(201).json({ message: 'Subcategory created successfully', subcategory: category.subcategory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find();  // Assuming you have a Category model
        res.status(200).json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};
