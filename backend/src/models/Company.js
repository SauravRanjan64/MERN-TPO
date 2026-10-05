// Company schema linking to a user with role COMPANY
const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  // additional fields can be added later
}, { timestamps: true });

module.exports = mongoose.model('Company', CompanySchema);
