// Role-based access middleware: restrict routes to specific roles
// Usage: allowRoles('ADMIN') or allowRoles('COMPANY', 'ADMIN')
const allowRoles = (...roles) => {
  return (req, res, next) => {
    // Ensure user is authenticated first
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    // Check if the user role is in the allowed list
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied. Requires role: ${roles.join(' or ')}` });
    }
    next();
  };
};

module.exports = { allowRoles };
