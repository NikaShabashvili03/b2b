// controllers/cartController.js
const User = require('../models/User');
const Product = require('../models/Product');

// Add a product to the cart
exports.addToCart = async (req, res) => {
    const userId = req.user._id; // Assuming authentication middleware sets req.user
    const { productId } = req.body;

    try {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Add the product to the user's cart
        user.cart.push(product._id);
        await user.save();

        res.status(200).json({ message: 'Product added to cart', cart: user.cart });
    } catch (error) {
        res.status(500).json({ message: 'Error adding product to cart', error });
    }
    console.log('Decoded user:', verified);
    req.user = verified;

// In your addToCart function
    console.log('User ID:', req.user);
};

// View user's cart
exports.viewCart = async (req, res) => {
    const userId = req.user._id;

    try {
        const user = await User.findById(userId).populate('cart'); // Populate cart with product details
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({ cart: user.cart });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cart', error });
    }
};

// Delete a specific product from the cart
exports.deleteProductFromCart = async (req, res) => {
    const userId = req.user._id;
    const { productId } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Remove the product from the cart
        user.cart = user.cart.filter(item => item.toString() !== productId);
        await user.save();

        res.status(200).json({ message: 'Product removed from cart', cart: user.cart });
    } catch (error) {
        res.status(500).json({ message: 'Error removing product from cart', error });
    }
};
