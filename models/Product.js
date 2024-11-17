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

const userDiscountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    discount: {
        type: Number, // Discount percentage
        required: true,
        min: 0,
        max: 80,
    },
    userPrice: {
        type: Number, // Discounted price specific to the user
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
        required: true // Discounted price
    },
    originalPrice: { 
        type: Number, 
        required: true // Original price, remains constant
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
        type: Number, // General discount percentage
        default: 0,
        min: 0,
        max: 80
    },
    userDiscounts: [userDiscountSchema], // Array of user-specific discounts
    attributes: [attributeSchema],
    quantity: {
        type: Number,
        required: true,
        default: 0
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

// // models/Product.js
// const mongoose = require('mongoose');

// const attributeSchema = new mongoose.Schema({
//     name: { 
//         type: String, 
//         required: true 
//     },
//     value: { 
//         type: String, 
//         required: true 
//     }
// });

// const productSchema = new mongoose.Schema({
//     name: { 
//         type: String, 
//         required: true 
//     },
//     prod_id: { 
//         type: String, 
//         required: true 
//     },
//     price: { 
//         type: Number, 
//         required: true },
//     description: { 
//         type: String 
//     },
//     images: [String],
//     category: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Category',
//     },
//     subcategory: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Subcategory',
//     },
//     discount: {  
//         type: Number,
//         default: 0
//     },
//     attributes: [attributeSchema],
//     quantity: {
//         type: Number,
//         required: true,
//         default: 0
//     }
// }, { timestamps: true });

// const Product = mongoose.model('Product', productSchema);

// module.exports = Product;

