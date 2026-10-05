// Apply route: re-checks eligibility, computes resume match, saves application
const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { allowRoles } = require('../../middleware/role');
const Job = require('../../models/Job');
const Application = require('../../models/Application');
const Student = require('../../models/Student');
const { notify } = require('../../utils/notify');
const { checkEligibility } = require('../../utils/eligibility');
const { computeMatch } = require('../../utils/resumeMatch');
const { writeAudit } = require('../../utils/audit');

const router = express.Router();

// POST /api/student/apply/:jobId - apply for a job after eligibility re-check
router.post('/apply/:jobId', authenticate, allowRoles('STUDENT'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId)
      .populate({ path: 'company', populate: { path: 'user', select: 'name _id' } });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    // Load the student profile for eligibility checks
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
    // Check if already applied (used in eligibility duplicate check)
    const existing = await Application.findOne({ student: req.user._id, job: job._id });
    // Re-run eligibility checks - returns 400 with reasons if not eligible
    const { eligible, reasons } = await checkEligibility(student, job, !!existing);
    if (!eligible) return res.status(400).json({ success: false, reasons });
    // Compute resume match score and save it on the application
    const { matchScore } = computeMatch(student.resumeText, job.requiredSkills);
    const application = await Application.create({ student: req.user._id, job: job._id, matchScore });
    // Notify the company that a new student applied
    if (job.company && job.company.user) {
      const compMsg = `${req.user.name} applied for ${job.title}`;
      await notify(req.app.get('io'), job.company.user._id.toString(), compMsg);
    }
    // Write audit log for this application
    await writeAudit(req.user._id, 'APPLIED', { jobId: job._id, applicationId: application._id });
    res.status(201).json({ success: true, application });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
