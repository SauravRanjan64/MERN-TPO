// Central error handler middleware - must be registered LAST in Express
// Provides friendly messages for known error types
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message || err);

  // Handle Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    return res.status(409).json({
      message: `Duplicate value: "${value}" is already taken for ${field}.`,
    });
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError' || (err.errors && Array.isArray(err.errors))) {
    const messages = (err.errors || []).map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return res.status(400).json({ message: `Validation error: ${messages}` });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  // Default server error
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
};

module.exports = { errorHandler };
