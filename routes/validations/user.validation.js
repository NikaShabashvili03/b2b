const { body } = require("express-validator");


    exports.create = [
        body('name')
            .notEmpty()
            .withMessage('Name is required')
            .isLength({ min: 2 })
            .withMessage('Name must be at least 2 characters long'),

        body('lastname')
            .notEmpty()
            .withMessage('Last name is required')
            .isLength({ min: 2 })
            .withMessage('Last name must be at least 2 characters long'),

        body('company')
            .notEmpty()
            .withMessage('Company name is required')
            .isLength({ min: 2 })
            .withMessage('Company name must be at least 2 characters long'),
    
        body('position')
            .notEmpty()
            .withMessage('Position is required')
            .isLength({ min: 2 })
            .withMessage('Position must be at least 2 characters long'),
    
        body('email')
            .isEmail()
            .withMessage('Please provide a valid email address'),
    
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long')
    
];


exports.login = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
]