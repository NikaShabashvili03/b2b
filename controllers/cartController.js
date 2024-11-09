// controllers/cartController.js
const User = require('../models/User');
const Product = require('../models/Product');
const Sale = require('../models/SoldItem');  // Add this line
const Cart = require('../models/Cart'); // Import Cart model
const { getProductQuantity } = require('../utils/productUtils'); 

exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;  // Destructure quantity from the request body

        // Ensure that productId is passed and is valid
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        const availableQuantity = await getProductQuantity(productId);  // Call the function to get available stock

        if (availableQuantity < quantity) {
            return res.status(400).json({ message: 'Not enough stock available' });
        }

        // Find or create the user's cart
        let userCart = await Cart.findOneAndUpdate(
            { userId: req.userId },
            { $setOnInsert: { userId: req.userId, cart: [] } },
            { upsert: true, new: true }
        );

        // Check if the product is already in the cart
        const existingCartItem = userCart.cart.find(item => item.productId.toString() === productId);

        // Calculate total requested quantity
        const requestedTotalQuantity = existingCartItem 
            ? existingCartItem.quantity + quantity  // Add to existing quantity
            : quantity;  // Use the new quantity if not in the cart

        // Final check to ensure requested quantity doesn't exceed stock
        if (requestedTotalQuantity > availableQuantity) {
            return res.status(400).json({
                message: `You can only add ${availableQuantity - (existingCartItem ? existingCartItem.quantity : 0)} more of this item.`
            });
        }

        // Update existing item quantity or add new item to the cart
        if (existingCartItem) {
            // Update the quantity
            existingCartItem.quantity = requestedTotalQuantity;
        } else {
            userCart.cart.push({ productId, quantity });  // Use quantity here instead of cartQuantity
        }

        // Save the updated cart
        await userCart.save();

        return res.status(200).json({
            message: 'Product added to cart successfully.',
            cart: userCart
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error adding product to cart', error: error.message });
    }
};


// View user's cart
exports.viewCart = async (req, res) => {
    const userId = req.userId;

    try {
        // Find the user's cart and populate product details from the 'Product' model
        const userCart = await Cart.findOne({ userId }).populate('cart.productId');  // Populate the productId field

        if (!userCart) return res.status(404).json({ message: 'Cart not found' });

        // Map through the cart items and construct the response data
        const cartItems = userCart.cart.map(item => ({
            productId: item.productId._id,
            productName: item.productId.name, // Assuming 'name' field exists in Product model
            productPrice: item.productId.price, // Assuming 'price' field exists in Product model
            quantity: item.quantity,
            totalPrice: item.productId.price * item.quantity
        }));

        res.status(200).json({
            message: 'Cart fetched successfully',
            cartItems,
            totalAmount: cartItems.reduce((acc, item) => acc + item.totalPrice, 0)  // Calculate total amount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching cart', error: error.message });
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
                price: product.price
            });

            // Add to the total amount
            totalAmount += product.price * quantity;

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
                price: productSale.price,  // Sale price
                totalAmount: totalAmount,  // Total sale amount
                date: new Date(),  // Sale date
            });
            
            await sale.save();
            

            await sale.save();  // Save the sold item in the soldItems collection
        }

        // Save the updated cart
        await userCart.save();

        // Send the response with the total amount of the sale
        res.status(200).json({
            message: 'Sale completed successfully',
            totalAmount,
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
        // Find all sales for the user
        const sales = await Sale.find({ user: userId }).populate('products.product');
        if (!sales) return res.status(404).json({ message: 'No sales found' });

        res.status(200).json({ sales });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sale history', error });
    }
};