const { validationResult } = require("express-validator");

// LEVEL: INTERMEDIATE
// Runs after express-validator's `body(...)` checks. If any check failed,
// short-circuit with a 400 and a clean list of messages instead of letting
// bad data reach the controller/DB.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = validate;
