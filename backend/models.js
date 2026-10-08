// All Mongoose models in one file
const mongoose = require('mongoose');

// ---- User schema (student or admin) ----
const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },           // hashed with bcryptjs
  role:     { type: String, enum: ['STUDENT', 'ADMIN'], default: 'STUDENT' },
  branch:   { type: String, default: '' },
  cgpa:     { type: Number, default: 0 }
}, { timestamps: true });

// ---- Job schema (posted by admin) ----
const jobSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  companyName: { type: String, required: true },
  description: { type: String, default: '' },
  packageLPA:  { type: Number, default: 0 },
  minCgpa:     { type: Number, default: 0 },
  lastDate:    { type: Date, required: true }
}, { timestamps: true });

// ---- Application schema (student applies to a job) ----
const applicationSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job:    { type: mongoose.Schema.Types.ObjectId, ref: 'Job',  required: true },
  status: {
    type: String,
    enum: ['APPLIED', 'SHORTLISTED', 'SELECTED', 'REJECTED'],
    default: 'APPLIED'
  }
}, { timestamps: true });

// one student can apply to a job only once
applicationSchema.index({ user: 1, job: 1 }, { unique: true });

// ---- Resume schema (uploaded by student, reviewed by admin) ----
const resumeSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  filename:    { type: String, default: '' },
  contentType: { type: String, default: 'application/pdf' },
  size:        { type: Number, default: 0 },
  data:        { type: Buffer, required: true, select: false },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  remarks:     { type: String, default: '' },
  reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt:  { type: Date }
}, { timestamps: true });

module.exports = {
  User:        mongoose.model('User', userSchema),
  Job:         mongoose.model('Job', jobSchema),
  Application: mongoose.model('Application', applicationSchema),
  Resume:      mongoose.model('Resume', resumeSchema)
};

