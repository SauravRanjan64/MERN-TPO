// Notification routes: get latest 20 and mark all as read
const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const Notification = require('../models/Notification');

const router = express.Router();

// GET latest 20 notifications for logged-in user
router.get('/', authenticate, async (req, res) => {
  try {
    const notifs = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /read-all marks all user's notifications as read
router.put('/read-all', authenticate, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
