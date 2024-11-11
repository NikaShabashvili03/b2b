const Product = require('../models/Product'); // Import Product model

async function getProductQuantity(productId) {
    // Find product by MongoDB _id (not prod_ID)
    const product = await Product.findById(productId); // Use findById for MongoDB _id
    if (!product) {
        throw new Error('Product not found');
    }
    return product.quantity;  // Return the quantity of the product
}

module.exports = { getProductQuantity };  
