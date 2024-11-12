// models/Product.js
const mongoose = require('mongoose');

const attributeSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    value: { 
        type: String, 
        required: true 
    }
});

const productSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    prod_id: { 
        type: String, 
        required: true 
    },
    price: { 
        type: Number, 
        required: true },
    description: { 
        type: String 
    },
    images: [String],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    },
    attributes: [attributeSchema],
    quantity: {
        type: Number,
        required: true,
        default: 0
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
