// Admin route to list companies (for job drive creation)
const express = require('express');
const { authenticate, authorize } = require('../../middleware/auth');
const Company = require('../../models/Company');
const User = require('../../models/User');

const router = express.Router();

router.get('/companies', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const companies = await Company.find().populate('user', 'name');
    const formatted = companies.map(c => ({ _id: c._id, name: c.name, userId: c.user._id, userName: c.user.name }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
