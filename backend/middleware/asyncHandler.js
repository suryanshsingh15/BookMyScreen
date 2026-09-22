// LEVEL: INTERMEDIATE
// Wraps async controller functions so we don't repeat try/catch in every single one.
// If the wrapped function throws or rejects, it's forwarded to next(err),
// which lands in errorHandler.js above.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
