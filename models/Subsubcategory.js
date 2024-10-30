const mongoose = require('mongoose');

const subsubcategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    subcategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subcategory', // Reference to the Subcategory
        required: true,
    },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }] // Ref to products
}, { timestamps: true });

module.exports = mongoose.model('Subsubcategory', subsubcategorySchema);
