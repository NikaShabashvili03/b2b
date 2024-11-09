// controllers/cartController.js
const User = require('../models/User');
const Product = require('../models/Product');
const Sale = require("../models/Sale");
const Cart = require('../models/Cart'); // Import Cart model

exports.addToCart = async (req, res) => {
    const { productId, quantity } = req.body;

    // Default quantity to 1 if not provided
    const cartQuantity = quantity || 1;

    try {
        // Fetch product from the database to check the available quantity
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if the requested quantity is more than available stock
        const availableQuantity = product.quantity; // Assuming 'quantity' field in product
        if (cartQuantity > availableQuantity) {
            return res.status(400).json({
                message: `Only ${availableQuantity} items are available. ${availableQuantity} items have been added to your cart.`
            });
        }

        // Fetch the user's cart
        let userCart = await Cart.findOne({ userId: req.userId });

        if (!userCart) {
            // Create a new cart if it doesn't exist
            userCart = new Cart({
                userId: req.userId,
                cart: [{ productId, quantity: cartQuantity }]
            });
            await userCart.save();
            return res.status(201).json({
                message: 'Product added to cart successfully.',
                cart: userCart
            });
        }

        // Check if the product is already in the cart
        const existingItem = userCart.cart.find(item => item.productId.toString() === productId);

        if (existingItem) {
            // If product already exists in the cart, check the quantity
            if (existingItem.quantity + cartQuantity > availableQuantity) {
                return res.status(400).json({
                    message: `You can only add ${availableQuantity - existingItem.quantity} more of this item.`
                });
            }
            // Increment the existing product quantity
            existingItem.quantity += cartQuantity;
        } else {
            // If product doesn't exist, add it to the cart
            userCart.cart.push({ productId, quantity: cartQuantity });
        }

        // Save the updated cart
        await userCart.save();

        return res.status(200).json({
            message: `Product added to cart successfully.`,
            cart: userCart
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error adding product to cart' });
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