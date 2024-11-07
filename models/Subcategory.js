const mongoose = require('mongoose');

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
    // Add other fields as needed
});

const Subcategory = mongoose.model('Subcategory', subcategorySchema);

module.exports = Subcategory;
