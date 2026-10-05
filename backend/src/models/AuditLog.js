// AuditLog model to record important actions for compliance and debugging
const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  // The user who performed the action
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Short action code e.g. LOGIN, APPLIED, STATUS_CHANGED
  action: { type: String, required: true },
  // Extra details stored as a flexible object
  details: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
