// Catches anything thrown or passed to next(err) and returns clean JSON
// instead of an HTML stack trace. Keep this registered LAST in server.js.
function errorHandler(err, req, res, next) {
  console.error(err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // Duplicate key (e.g. employeeId already taken)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return res.status(409).json({ message: `${field} already exists` });
  }

  // Invalid MongoDB ObjectId in a route param
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
  }

  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Server error' });
}

module.exports = errorHandler;
