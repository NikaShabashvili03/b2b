// controllers/cartController.js
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Sale = require('../models/SoldItem');  // Add this line
const Cart = require('../models/Cart'); // Import Cart model
const { getProductQuantity } = require('../utils/productUtils'); 

exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body; // Quantity can be positive or negative
        const userId = req.userId;

        if (!productId || !Number.isInteger(quantity)) {
            return res.status(400).json({ message: 'Product ID and quantity are required' });
        }

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const maxAvailable = await getProductQuantity(productId);

        let userCart = await Cart.findOne({ userId });
        if (!userCart) {
            // Create a new cart if the user doesn't have one
            userCart = new Cart({ userId, cart: [] });
        }

        const productInCart = userCart.cart.find((item) => item.productId.toString() === productId);

        if (quantity > 0) {
            // Add products to the cart
            if (productInCart) {
                const newQuantity = productInCart.quantity + Math.floor(quantity);  // Ensure it's an integer

                if (newQuantity > maxAvailable) {
                    return res.status(400).json({ message: `Exceeds available stock. Max available: ${maxAvailable}` });
                }

                productInCart.quantity = newQuantity;
            } else {
                if (quantity > maxAvailable) {
                    return res.status(400).json({ message: `Exceeds available stock. Max available: ${maxAvailable}` });
                }

                userCart.cart.push({ productId, quantity: Math.floor(quantity) });  // Ensure it's an integer
            }
        } else if (quantity < 0) {
            // Subtract products from the cart
            if (productInCart) {
                const newQuantity = productInCart.quantity + Math.floor(quantity);  // Ensure it's an integer

                if (newQuantity < 0) {
                    return res.status(400).json({ message: 'Quantity cannot be less than 0' });
                } else if (newQuantity === 0) {
                    // Remove the product from the cart if quantity reaches 0
                    userCart.cart = userCart.cart.filter((item) => item.productId.toString() !== productId);
                } else {
                    productInCart.quantity = newQuantity;
                }
            } else {
                return res.status(400).json({ message: 'Cannot subtract a product not in the cart' });
            }
        } else {
            return res.status(400).json({ message: 'Quantity cannot be 0' });
        }

        const savedCart = await userCart.save();
        await savedCart.populate('cart.productId');

        res.status(200).json({
            message: 'Cart updated successfully',
            cart: savedCart.cart.map((item) => ({
                product: {
                    id: item.productId._id,
                    name: item.productId.name,
                    originalPrice: parseFloat(item.productId.originalPrice),  // Ensure it's a float
                    discountedPrice: parseFloat(item.productId.price),  // Ensure it's a float
                    discount: parseFloat(item.productId.discount || 0),  // Ensure it's a float
                },
                quantity: item.quantity,
                totalPrice: (item.quantity * parseFloat(item.productId.price)).toFixed(2),  // Calculate as float
            })),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating cart', error: error.message });
    }
};
// View Cart
exports.viewCart = async (req, res) => {
    const userId = req.userId;

    try {
        const userCart = await Cart.findOne({ userId }).populate('cart.productId');

        if (!userCart || !userCart.cart.length) {
            return res.status(404).json({ message: 'Cart is empty', cart: [] });
        }

        const formattedCartItems = userCart.cart.map((item) => {
            let discount = parseFloat(item.productId.discount || 0);  // Ensure it's a float
            let finalPrice = parseFloat(item.productId.price);  // Ensure it's a float

            const userDiscount = item.productId.userDiscounts?.find(
                (entry) => entry.userId.toString() === userId
            );

            if (userDiscount) {
                discount = parseFloat(userDiscount.discount);  // Ensure it's a float
                finalPrice -= (finalPrice * discount) / 100;
            }

            const quantity = parseInt(item.quantity, 10);  // Ensure it's an integer
            const totalPrice = (finalPrice * quantity).toFixed(2);  // Calculate as float and round to 2 decimal places

            return {
                product: {
                    id: item.productId._id,
                    name: item.productId.name,
                    originalPrice: parseFloat(item.productId.originalPrice),  // Ensure it's a float
                    discountedPrice: finalPrice.toFixed(2),  // Format as float
                    discount: discount,
                },
                quantity,
                totalPrice: totalPrice,
            };
        });

        res.status(200).json({
            message: 'Cart retrieved successfully',
            cart: formattedCartItems,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching cart', error: error.message });
    }
};


// Delete a specific product from the cart
exports.deleteProductFromCart = async (req, res) => {
    const userId = req.userId;
    const { id } = req.params;

    try {
        const userCart = await Cart.findOne({ userId });
        if (!userCart) {
            return res.status(404).json({ message: 'Cart not found', cart: [] });
        }

        const productInCart = userCart.cart.find((item) => item.productId.toString() === id);
        if (!productInCart) {
            return res.status(404).json({ message: 'Product not found in cart', cart: [] });
        }

        userCart.cart = userCart.cart.filter((item) => item.productId.toString() !== id);
        await userCart.save();

        res.status(200).json({
            message: 'Product removed from cart successfully',
            cart: userCart.cart,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error removing product from cart', error: error.message });
    }
};
exports.cartSale = async (req, res) => {
    const userId = req.userId;
    const { cartItems } = req.body;  // Expecting an array of { productId, quantity }

    try {
        // Find the user's cart and populate product details from the 'Product' model
        const userCart = await Cart.findOne({ userId }).populate('cart.productId');
        if (!userCart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Check if the cartItems array is empty
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: 'No products selected for sale' });
        }

        let totalAmount = 0;
        const productsToSell = [];
        const outOfStockProducts = [];

        // Loop through the cart items and process the sale
        for (const cartItem of cartItems) {
            const { productId, quantity } = cartItem;

            // Find the cart item and the product in the cart
            const cartProduct = userCart.cart.find(item => item.productId._id.toString() === productId);
            if (!cartProduct) {
                return res.status(404).json({ message: `Product with ID ${productId} not found in cart` });
            }

            // Ensure that the user has enough of the product in their cart
            if (cartProduct.quantity < quantity) {
                return res.status(400).json({
                    message: `Not enough stock in cart for ${cartProduct.productId.name}`
                });
            }

            // Get the product details from the cart, not from the Product model
            const product = cartProduct.productId;

            // Check if there's enough stock in the Product collection (using the product in the cart)
            if (product.quantity < quantity) {
                outOfStockProducts.push({
                    productId: product._id,
                    availableQuantity: product.quantity,
                    requestedQuantity: quantity
                });
                continue;  // Skip the product and move to the next
            }

            // Update the product stock in the Product model
            product.quantity -= quantity;
            await product.save();

            // Add to the productsToSell array
            productsToSell.push({
                productId: product._id,
                quantity,
                price: parseFloat(product.price),  // Ensure price is a float
            });

            // Add to the total amount
            totalAmount += parseFloat(product.price) * quantity;

            // Reduce the quantity in the user's cart
            cartProduct.quantity -= quantity;
            if (cartProduct.quantity === 0) {
                userCart.cart = userCart.cart.filter(item => item.productId._id.toString() !== productId);
            }
        }

        // If there are out-of-stock products, return an error
        if (outOfStockProducts.length > 0) {
            return res.status(400).json({
                message: 'Some products are out of stock',
                outOfStockProducts
            });
        }

        // Move the sold items to the soldItems collection
        for (const productSale of productsToSell) {
            const sale = new Sale({
                userId: req.userId,  // User ID of the person making the sale
                prod_id: productSale.productId,  // Use ObjectId of the product
                quantity: productSale.quantity,
                price: productSale.price,
                totalAmount: totalAmount.toFixed(2),  // Format as float
                date: new Date(),  // Sale date
            });
            
            await sale.save();
        }

        // Save the updated cart
        await userCart.save();

        // Send the response with the total amount of the sale
        res.status(200).json({
            message: 'Sale completed successfully',
            totalAmount: totalAmount.toFixed(2),
            productsToSell,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error during sale', error: error.message });
    }
};


exports.viewSaleHistory = async (req, res) => {
    const userId = req.userId;

    try {
        const sales = await Sale.find({ userId }).populate('productId');
        if (!sales.length) {
            return res.status(404).json({ message: 'No sales found', saleHistory: [] });
        }

        const formattedSales = sales.map((sale) => ({
            productId: sale.productId._id,
            name: sale.productId.name,
            price: sale.productId.price,
            quantity: sale.quantity,
            totalPrice: sale.totalAmount,
            date: sale.date,
        }));

        res.status(200).json({
            message: 'Sales history retrieved successfully',
            saleHistory: formattedSales,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching sales history', error: error.message });
    }
};