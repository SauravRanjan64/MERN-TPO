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

module.exports = {
  User:        mongoose.model('User', userSchema),
  Job:         mongoose.model('Job', jobSchema),
  Application: mongoose.model('Application', applicationSchema)
};
