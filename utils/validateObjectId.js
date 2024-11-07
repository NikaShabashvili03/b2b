const mongoose = require('mongoose');

// Utility to validate MongoDB ObjectId
const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

module.exports = validateObjectId;
