const mongoose = require('mongoose');

const userDiscountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    discount: {
        type: Number,
        required: true,
        min: 0,
        max: 80,
    },
    userPrice: {
        type: Number,
    },
}, { _id: false });

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    prod_id: {
        type: String,
        required: true,
        unique: true
    },
    price: {
        type: Number,
        required: true
    },
    originalPrice: {
        type: Number,
        required: true
    },
    description: {
        type: String
    },
    images: [String],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    subcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subcategory',
        required: true
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 80
    },
    userDiscounts: [userDiscountSchema],
    attributes: {
        type: Map, // Use a Map to store dynamic key-value pairs
        of: String // Values are strings (e.g., "8GB" for RAM)
    },
    quantity: {
        type: Number,
        required: true,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);