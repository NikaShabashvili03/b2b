const validationError= require('express-validator');
exports.handleValidationError = (req, res, next) => {
    const errors = validationError.validationResult(req);
    console.log(errors);
    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array());

    }
    next();
}