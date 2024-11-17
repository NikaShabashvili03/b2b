// controllers/cartController.js
const User = require('../models/User');
const Product = require('../models/Product');
const Sale = require('../models/SoldItem');  // Add this line
const Cart = require('../models/Cart'); // Import Cart model
const { getProductQuantity } = require('../utils/productUtils'); 


// {
//     productId: {
//       discount: 0,
//       _id: new ObjectId('673296dbafdae2762253a0db'),
//       name: 'producti2',
//       prod_id: '11111',
//       price: 222,
//       description: 'ragac producti',
//       images: [],
//       category: new ObjectId('66f82ff87d6908f938a5a1b8'),
//       quantity: 4,
//       attributes: [],
//       createdAt: 2024-11-11T23:44:27.414Z,
//       updatedAt: 2024-11-11T23:44:27.414Z,
//       __v: 0
//     },
//     quantity: 1,
//     _id: new ObjectId('67365283b9b85a81c67ae3b7'),
//     totalPrice: 222,
//     discount: 199.8
//   }

exports.addToCart = async (req, res) => {
    try {
        const { productId } = req.body;  // Destructure quantity from the request body
        const userId = req.userId;

        const product = await Product.findById(productId);
        
        if(!productId){
            return res.status(400).json({ message: 'Product ID is required' });
        }

        const userCart = await Cart.findOne({ userId: userId })

        const productInCart = userCart.cart.find((item) => item.productId.toString() === productId)
        
        if(productInCart && product.quantity <= productInCart.quantity){
            return res.status(400).json({ message: "Quantity is more..."})
        }

        if(productInCart){
            const index = userCart.cart.indexOf(productInCart);
            userCart.cart[index].quantity++;
        }else{
            userCart.cart.push({ productId: productId, quantity: 1 })
        }

        const savedCart = await (await userCart.save()).populate("cart.productId")

        const discountRate = 10;
        const cartItems = savedCart.cart.map(item => {
            const originalPrice = item.productId.price * item.quantity;
            const discount = (originalPrice * discountRate) / 100;
            const discountedPrice = originalPrice - discount;

            return {
                ...item._doc,
                totalPrice: originalPrice,
                discount: discountedPrice,
            };
        });
        
        res.status(200).json(cartItems);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error adding product to cart', error: error.message });
    }
};

exports.viewCart = async (req, res) => {
    const userId = req.userId;

    try {
        const userCart = await Cart.findOne({ userId }).populate('cart.productId');

        if (!userCart) return res.status(404).json({ message: 'Cart not found' });

        const discountRate = 10;
        const cartItems = userCart.cart.map(item => {
            const originalPrice = item.productId.price * item.quantity;
            const discount = (originalPrice * discountRate) / 100;
            const discountedPrice = originalPrice - discount;

            return {
                ...item._doc,
                totalPrice: originalPrice,
                discount: discountedPrice,
            };
        });
        

        res.status(200).json(cartItems);
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
        const userCart = await Cart.findOne({ userId: userId })
        if (!userCart) return res.status(404).json({ message: 'User not found' });
        
        const filteredCart = userCart.cart.find((item) => item.productId.toString() === id)
        
        
        userCart.cart = userCart.cart.filter(item => item._id !== filteredCart._id);
        await userCart.save();

        console.log(userCart)

        res.status(200).json({ message: 'Product removed from cart', cart: filteredCart });
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