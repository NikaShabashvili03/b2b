const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Get token from headers
    if (!token) return res.status(403).json({ message: 'No token provided' });

    jwt.verify(token, process.env.ADMIN_JWT_SECRET, (err, decoded) => {
        if (err) return res.status(500).json({ message: 'Failed to authenticate token' });

        req.adminId = decoded._id; // Set adminId to request object
        next();
    });
};
