const mongoose = require('mongoose');
const Category = require('./Category'); // Import Category model

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    prod_id: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    images: [String], // Assuming images are an array of strings
    Category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',  // Reference to Category model
    },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
