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


const subcategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    attributes: [{
        type: String,
        required: true
    }],
    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 80
    },
    userDiscounts: [userDiscountSchema],  // Add user-specific discounts
});

module.exports = mongoose.model('Subcategory', subcategorySchema);
