const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Create Admin function
exports.createAdmin = async (req, res) => {
    try {
        const { name, lastname, email, password } = req.body;

        // Check if the admin already exists
        const existAdmin = await Admin.findOne({ email });
        if (existAdmin) {
            return res.status(409).json({ message: 'Admin already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Create new admin
        const admin = new Admin({
            name,
            lastname,
            email,
            hashedPassword: hash,
        });

        const savedAdmin = await admin.save();
        res.status(201).json({ message: 'Admin created successfully', admin: savedAdmin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};

// Admin login function
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if the admin exists
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ message: 'Email not found' });
        }

        // Compare the password
        const isValidPass = await bcrypt.compare(password, admin.hashedPassword);
        if (!isValidPass) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        // Generate a token
        const token = jwt.sign({ _id: admin._id }, process.env.ADMIN_JWT_SECRET, { expiresIn: '30d' });

        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};
exports.profile = async (req, res) => {
    try {
        const adminId = req.adminId; // Get admin ID from middleware
        const admin = await Admin.findById(adminId);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const { hashedPassword, ...adminData } = admin._doc; // Exclude hashed password
        res.json(adminData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};
