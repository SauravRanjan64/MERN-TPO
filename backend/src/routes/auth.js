const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Student = require('../models/Student');
const { writeAudit } = require('../utils/audit');

dotenv.config();
const router = express.Router();

const JWT_EXPIRES_IN = '7d';

const getSecret = () => {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing');
  }
  return process.env.JWT_SECRET || 'devsecret';
};

const isProd = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts from this IP, please try again after 15 minutes' }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: 'Too many accounts created from this IP, please try again after an hour' }
});

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format').transform((val) => val.toLowerCase().trim()),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format').transform((val) => val.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required')
});

router.post('/register', registerLimiter, async (req, res, next) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already used' });
    
    const user = new User({ name, email, password, role: 'STUDENT' });
    await user.save();
    
    await Student.create({ user: user._id, rollNo: `R${Date.now()}` });
    await writeAudit(user._id, 'STUDENT_CREATED', {});
    
    res.status(201).json({ message: 'User created', role: 'STUDENT' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    next(err);
  }
});

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    
    const match = await user.comparePassword(password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user._id, role: user.role }, getSecret(), { expiresIn: JWT_EXPIRES_IN });
    res.cookie('token', token, cookieOptions);
    
    await writeAudit(user._id, 'LOGIN', { email: user.email, role: user.role });
    res.json({ 
      message: 'Logged in', 
      token, // return token as well
      user: { id: user._id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    next(err);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', cookieOptions);
  res.json({ message: 'Logged out' });
});

router.get('/me', async (req, res, next) => {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) return res.status(401).json({ message: 'Not logged in' });
  try {
    const payload = jwt.verify(token, getSecret());
    const user = await User.findById(payload.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;
