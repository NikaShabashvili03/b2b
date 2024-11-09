const mongoose = require('mongoose');

const soldItemSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    prod_id: { 
        type: mongoose.Schema.Types.ObjectId,  // Changed to ObjectId to reference Product model
        ref: 'Product', 
        required: true 
    },
    quantity: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const Sale = mongoose.model('Sale', soldItemSchema);
module.exports = Sale;
