const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// User Registration function

exports.registerUser = async (req, res) => {
    try {
        const { company, position, identify, name, lastname, phone, email, password } = req.body;

        const existUser = await User.findOne({ email });
        if (existUser) {
            return res.status(409).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            company,
            position,
            identify,
            name,
            lastname,
            phone,
            email,
            hashedPassword
        });

        const savedUser = await user.save();
        res.status(201).json({ message: 'User created successfully', user: savedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};

// User Login function
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Email not found' });
        }

        const isValidPass = await bcrypt.compare(password, user.hashedPassword);
        if (!isValidPass) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        const token = jwt.sign({ _id: user._id }, process.env.USER_JWT_SECRET, { expiresIn: '30d' });

        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};
