// Application status update route with flow validation and audit logging
const express = require('express');
const { authenticate } = require('../middleware/auth');
const { allowRoles } = require('../middleware/role');
const Application = require('../models/Application');
const Job = require('../models/Job');
const Company = require('../models/Company');
const Student = require('../models/Student');
const { notify } = require('../utils/notify');
const { writeAudit } = require('../utils/audit');

const router = express.Router();

// Allowed status transitions: each status maps to the statuses it can move to
const allowed = {
  APPLIED: ['SHORTLISTED', 'REJECTED'],
  SHORTLISTED: ['SELECTED', 'REJECTED'],
  SELECTED: [],
  REJECTED: [],
};

// PUT /api/applications/:id/status - update application status (ADMIN or owning COMPANY only)
router.put('/:id/status', authenticate, allowRoles('ADMIN', 'COMPANY'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'status is required' });
    // Load the application
    const application = await Application.findById(req.params.id).populate('job');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    // If the user is COMPANY, verify they own the job
    if (req.user.role === 'COMPANY') {
      const company = await Company.findOne({ user: req.user._id });
      if (!company) return res.status(403).json({ message: 'Company profile not found' });
      if (application.job.company.toString() !== company._id.toString()) {
        return res.status(403).json({ message: 'You do not own this job' });
      }
    }
    // Validate the status transition against the allowed flow
    const currentStatus = application.status;
    if (!allowed[currentStatus] || !allowed[currentStatus].includes(status)) {
      return res.status(400).json({ message: `Invalid status change from ${currentStatus} to ${status}` });
    }
    // Perform the update
    const oldStatus = application.status;
    application.status = status;
    await application.save();
    // Fetch student's user ID so notification goes to the right room
    const student = await Student.findOne({ user: application.student });
    const studentUserId = student ? student.user.toString() : application.student.toString();
    // Create notification for the student about the status change
    const message = `Your application status changed from ${oldStatus} to ${status} for ${application.job.title}`;
    await notify(req.app.get('io'), studentUserId, message);
    // Emit statusChanged event to the student's socket room
    const io = req.app.get('io');
    if (io) io.to(`user:${studentUserId}`).emit('statusChanged', { applicationId: application._id, status });
    // Write audit log for the status change
    await writeAudit(req.user._id, 'STATUS_CHANGED', {
      applicationId: application._id,
      oldStatus,
      newStatus: status,
    });
    res.json({ message: 'Status updated', application });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
