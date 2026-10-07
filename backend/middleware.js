// JWT auth middleware
const jwt = require('jsonwebtoken');
const { User } = require('./models');

// protect: verify JWT, attach req.user
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not logged in. Please send a token.' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found.' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is invalid or expired.' });
  }
};

// onlyAdmin: must be ADMIN role
const onlyAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access only.' });
  }
  next();
};

module.exports = { protect, onlyAdmin };
