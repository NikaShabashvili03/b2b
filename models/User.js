const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
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
