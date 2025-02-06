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

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    subcategory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subcategory'  // Reference to subcategories
    }],
    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 80
    },
    userDiscounts: [userDiscountSchema],  // Add user-specific discounts

}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
