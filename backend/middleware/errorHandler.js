// LEVEL: INTERMEDIATE → "centralized error handling" (explicitly on your resume)
//
// The idea: controllers never write their own try/catch + res.status(500).json(...)
// boilerplate everywhere. Instead they either:
//   (a) throw an error, or
//   (b) call next(error)
// ...and this single middleware formats every error response consistently.

// 404 handler — runs when no route matched the request.
const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Central error handler — must have 4 args (err, req, res, next) for Express
// to recognize it as an error-handling middleware.
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose bad ObjectId (e.g. malformed :id in URL)
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Resource not found";
  }

  // Mongoose duplicate key error (e.g. registering with an email that exists)
  if (err.code === 11000) {
    statusCode = 400;
    message = `Duplicate value for field: ${Object.keys(err.keyValue)}`;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };
