// Student profile model linked to a User account
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  // Reference to the User account (one-to-one)
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  // Unique roll number assigned to the student
  rollNo: { type: String, unique: true, sparse: true },
  // Engineering branch e.g. CSE, ECE, ME
  branch: { type: String },
  // Graduation batch year e.g. 2024
  batch: { type: Number },
  // Cumulative Grade Point Average
  cgpa: { type: Number },
  // Number of active backlogs
  backlogs: { type: Number, default: 0 },
  // Contact phone number
  phone: { type: String },
  // List of technical skills
  skills: [{ type: String }],
  // Extracted text from uploaded resume PDF
  resumeText: { type: String },
  // Whether the student has given placement consent
  consent: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
