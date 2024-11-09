const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Reference to Product model
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1 // Default quantity is 1 if not provided
    }
});

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to User model
        required: true
    },
    cart: [cartItemSchema] // Array of cart items
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
