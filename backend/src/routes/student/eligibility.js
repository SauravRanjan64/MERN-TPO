// Eligibility route for a student to check a job's eligibility with resume match
const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { allowRoles } = require('../../middleware/role');
const Job = require('../../models/Job');
const Application = require('../../models/Application');
const Student = require('../../models/Student');
const { checkEligibility } = require('../../utils/eligibility');
const { computeMatch } = require('../../utils/resumeMatch');

const router = express.Router();

// GET /api/student/eligibility/:jobId - check full eligibility and resume match for a job
router.get('/eligibility/:jobId', authenticate, allowRoles('STUDENT'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    // Load student profile from Student collection
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });
    // Check if already applied for the duplicate check
    const existing = await Application.findOne({ student: req.user._id, job: job._id });
    // Run eligibility checks using shared utility
    const eligibility = await checkEligibility(student, job, !!existing);
    // Compute resume skill match
    const matchResult = computeMatch(student.resumeText, job.requiredSkills);
    res.json({ ...eligibility, ...matchResult });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = { router };
