// Utility to write audit log entries to the database
const AuditLog = require('../models/AuditLog');

// Save an audit entry: action is a string like 'LOGIN', userId is the acting user
const writeAudit = async (userId, action, details = {}) => {
  try {
    await AuditLog.create({ user: userId, action, details });
  } catch (err) {
    // Don't crash the app if audit fails - just log it
    console.error('Audit write failed:', err.message);
  }
};

module.exports = { writeAudit };
