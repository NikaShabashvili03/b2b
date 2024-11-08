// controllers/cartController.js
const User = require('../models/User');
const Product = require('../models/Product');
const Sale = require("../models/Sale");

// Add a product to the cart
exports.addToCart = async (req, res) => {
    const userId = req.userId; // Assuming authentication middleware sets req.user
    const { productId } = req.body;

    try {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Add the product to the user's cart
        user.cart.push(productId);
        await user.save();

        res.status(200).json({ message: 'Product added to cart', cart: user.cart });
    } catch (error) {
        res.status(500).json({ message: 'Error adding product to cart', error });
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
const mongoose = require('mongoose');  // Ensure mongoose is required
exports.checkout = async (req, res) => {
    const userId = req.userId; // Ensure you're getting the userId correctly

    try {
        const user = await User.findById(userId).populate('cart.productId'); // Ensure you're populating the correct path

        if (!user) return res.status(404).json({ message: 'User not found' });

        let totalAmount = 0;
        const productsToBuy = [];

        for (const cartProduct of user.cart) {
            if (!cartProduct.productId) {
                return res.status(400).json({ message: 'Product ID is missing for item in cart' });
            }

            // Use mongoose's findById for proper ObjectId casting
            const productData = await Product.findById(cartProduct.productId);

            if (productData) {
                productsToBuy.push({
                    productId: productData._id,
                    quantity: cartProduct.quantity
                });
                totalAmount += productData.price * cartProduct.quantity;
            } else {
                return res.status(404).json({ message: `Product with ID ${cartProduct.productId} not found` });
            }
        }

        const sale = new Sale({
            user: userId,
            products: productsToBuy,
            totalAmount
        });

        await sale.save();

        user.cart = [];
        await user.save();

        res.status(200).json({
            message: 'Checkout successful',
            sale: sale,
            cart: user.cart
        });
    } catch (error) {
        console.error('Error during checkout:', error);
        res.status(500).json({ message: 'Error during checkout', error: error.message || error });
    }
};
exports.viewSaleHistory = async (req, res) => {
    const userId = req.userId;

    try {
        // Find all sales for the user
        const sales = await Sale.find({ user: userId }).populate('products.product');
        if (!sales) return res.status(404).json({ message: 'No sales found' });

        res.status(200).json({ sales });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sale history', error });
    }
};