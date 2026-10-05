// Auth routes: register, login, logout, get current user
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
const JWT_EXPIRES_IN = '7d';

// Register a new user (student or company or admin)
router.post('/register', async (req, res) => {
  // Force role to STUDENT regardless of client input
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already used' });
    const user = new User({ name, email, password, role: 'STUDENT' });
    await user.save();
    // Create linked empty Student profile
    const Student = require('../models/Student');
    await Student.create({ user: user._id, rollNo: `R${Date.now()}` });
    // Audit log for student creation
    const { writeAudit } = require('../utils/audit');
    await writeAudit(user._id, 'STUDENT_CREATED', {});
    res.status(201).json({ message: 'User created', role: 'STUDENT' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const isProd = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
};

// Login -> set httpOnly cookie and write audit log
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const match = await user.comparePassword(password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.cookie('token', token, cookieOptions);
    // Audit the login event
    const { writeAudit } = require('../utils/audit');
    await writeAudit(user._id, 'LOGIN', { email: user.email, role: user.role });
    res.json({ message: 'Logged in', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Logout -> clear cookie
router.post('/logout', (req, res) => {
  res.clearCookie('token', cookieOptions);
  res.json({ message: 'Logged out' });
});

// Get current user
router.get('/me', async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Not logged in' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;
