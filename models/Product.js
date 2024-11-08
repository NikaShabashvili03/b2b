const mongoose = require('mongoose');
const Category = require('./Category'); // Import Category model

const attributeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    value: {
        type: String,
        required: true,
    }
});

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
attributes: [attributeSchema], 
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
