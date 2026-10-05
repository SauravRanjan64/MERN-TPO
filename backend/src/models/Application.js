// Application schema linking student, job, status, and resume match score
const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  // Reference to the student (User) who applied
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Reference to the job drive
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  // Current status of the application
  status: { type: String, enum: ['APPLIED', 'SHORTLISTED', 'SELECTED', 'REJECTED'], default: 'APPLIED' },
  // Resume match score saved at apply time (0-100)
  matchScore: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Application', ApplicationSchema);
