const jwt = require('jsonwebtoken');

exports.checkAdmin = (req, res, next) => {
    const token = (req.headers.authorization || '').replace(/Bearer\s?/, '');

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET); // Ensure this matches your secret for admin
            req.adminId = decoded._id; // Store the admin ID for use in the controller
            next();
        } catch (err) {
            console.error(err); // Log the error for debugging
            return res.status(403).json({
                message: 'You don\'t have access 2'
            });
        }
    } else {
        return res.status(403).json({
            message: 'You don\'t have access'
        });
    }
};
