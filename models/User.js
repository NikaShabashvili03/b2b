const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    company: {
        type: String,
        required: true,
    },
    position: {
        type: String,
        required: true,
    },
    identify: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,      
    },
    lastname: {
        type: String,
        required: true,      
    },
    phone: {  
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    hashedPassword: {
        type: String,
        required: true,
    },
    cart: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
}, {
    timestamps: true,
});

module.exports = mongoose.model('User', userSchema);