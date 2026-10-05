// Utility to create a notification and emit via Socket.IO
const Notification = require('../models/Notification');

/**
 * Save notification to DB and emit to the user's room.
 * @param {object} io - Socket.IO server instance
 * @param {string} userId - MongoDB ObjectId string of the recipient
 * @param {string} message - Notification text
 */
const notify = async (io, userId, message) => {
  try {
    const notif = await Notification.create({ user: userId, message });
    // Emit to the specific user room
    io.to(`user:${userId}`).emit('notification', { message: notif.message, id: notif._id });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};

module.exports = { notify };
