// controllers/cartController.js
const User = require('../models/User');
const Product = require('../models/Product');

// Add a product to the cart
exports.addToCart = async (req, res) => {
    const userId = req.userId; // Assuming authentication middleware sets req.userId
    const { productIds } = req.body; // Expecting an array of product IDs

    try {
        // Validate and find all requested products
        const products = await Product.find({ _id: { $in: productIds } });
        
        if (products.length === 0) {
            return res.status(404).json({ message: 'No products found' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Extract product IDs and add them to the cart if not already present
        const productIdsToAdd = products.map(product => product._id);
        user.cart.push(...productIdsToAdd);
        await user.save();

        res.status(200).json({ message: 'Products added to cart', cart: user.cart });
    } catch (error) {
        res.status(500).json({ message: 'Error adding products to cart', error });
    }
};

// View user's cart
exports.viewCart = async (req, res) => {
    const userId = req.userId;

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
    const userId = req.userId;
    const { cartId } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Remove the product from the cart
        user.cart = user.cart.filter(item => item._id.toString() !== cartId);
        await user.save();

        res.status(200).json({ message: 'Product removed from cart', cart: user.cart });
    } catch (error) {
        res.status(500).json({ message: 'Error removing product from cart', error });
    }
};
