// Job Drive schema
const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  title: { type: String, required: true },
  description: { type: String },
  packageLPA: { type: Number },
  requiredSkills: [{ type: String }],
  allowedBranches: [{ type: String }],
  minCgpa: { type: Number },
  maxBacklogs: { type: Number },
  batch: { type: String },
  lastDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);
