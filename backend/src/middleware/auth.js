const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

// Verify token from cookie "token" or Authorization header
const authenticate = async (req, res, next) => {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  
  try {
    if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is missing');
    }
    const secret = process.env.JWT_SECRET || 'devsecret';
    const payload = jwt.verify(token, secret);
    const user = await User.findById(payload.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Role guard
const authorize = (roles = []) => {
  // roles can be string or array
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
