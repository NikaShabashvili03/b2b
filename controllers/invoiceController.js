const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const User = require('../models/User');

// Create a new invoice
exports.createInvoice = async (req, res) => {
    try {
        const { userId, products } = req.body;

        // Validate user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Validate products and calculate total amount
        let totalAmount = 0;
        const productDetails = await Promise.all(products.map(async (item) => {
            const product = await Product.findById(item.product);
            if (!product) {
                throw new Error(`Product with ID ${item.product} not found`);
            }
            const price = product.price * item.quantity;
            totalAmount += price;
            return {
                product: product._id,
                quantity: item.quantity,
                price: product.price
            };
        }));

        // Create new invoice
        const invoice = new Invoice({
            user: user._id,
            products: productDetails,
            totalAmount
        });

        const savedInvoice = await invoice.save();
        res.status(201).json({ message: 'Invoice created successfully', invoice: savedInvoice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
};

// Get all invoices
exports.getAllInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find()
            .populate('user', 'name email')
            .populate('products.product', 'name price');

        res.status(200).json(invoices);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
};

// Get invoice by ID
exports.getInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid invoice ID' });
        }

        const invoice = await Invoice.findById(id)
            .populate('user', 'name email')
            .populate('products.product', 'name price');

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.status(200).json(invoice);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
};
exports.deleteInvoice = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid invoice ID' });
        }

        const invoice = await Invoice.findByIdAndDelete(id);

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.status(200).json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
};
exports.updateInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid invoice ID' });
        }

        const invoice = await Invoice.findById(id);

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        if (status) invoice.status = status;

        const updatedInvoice = await invoice.save();
        res.status(200).json({ message: 'Invoice updated successfully', invoice: updatedInvoice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
};