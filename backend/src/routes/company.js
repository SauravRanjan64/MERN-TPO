// Company routes: post jobs, view own jobs, view applicants with filters
const express = require('express');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');
const { allowRoles } = require('../middleware/role');
const { maskPhone } = require('../utils/maskPhone');
const { writeAudit } = require('../utils/audit');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Student = require('../models/Student');

const router = express.Router();

// Zod schema for validating job creation by a company
const jobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  packageLPA: z.number().optional(),
  requiredSkills: z.array(z.string()).optional(),
  allowedBranches: z.array(z.string()).optional(),
  minCgpa: z.number().optional(),
  maxBacklogs: z.number().optional(),
  batch: z.number().optional(),
  lastDate: z.preprocess(arg => arg ? new Date(arg) : undefined, z.date().optional()),
});

// POST /api/company/jobs - create a new job for the authenticated company
router.post('/jobs', authenticate, allowRoles('COMPANY'), async (req, res) => {
  try {
    const parseResult = jobSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ message: 'Validation error', errors: parseResult.error.errors });
    // Find the company doc that belongs to this logged-in user
    const company = await Company.findOne({ user: req.user._id });
    if (!company) return res.status(404).json({ message: 'Company profile not found' });
    const job = await Job.create({ ...parseResult.data, company: company._id });
    // Audit log for job creation by company
    await writeAudit(req.user._id, 'JOB_CREATED', { jobId: job._id, companyId: company._id });
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/company/jobs - list all jobs posted by this company
router.get('/jobs', authenticate, allowRoles('COMPANY'), async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user._id });
    if (!company) return res.status(404).json({ message: 'Company profile not found' });
    const jobs = await Job.find({ company: company._id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/company/jobs/:id/applicants - get applicants for a specific job with filters
router.get('/jobs/:id/applicants', authenticate, allowRoles('COMPANY'), async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user._id });
    if (!company) return res.status(404).json({ message: 'Company profile not found' });
    // Verify this job belongs to the logged-in company
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.company.toString() !== company._id.toString()) {
      return res.status(403).json({ message: 'This job does not belong to your company' });
    }
    // Get all applications for this job
    const applications = await Application.find({ job: job._id }).populate('student', 'name email');
    // Read optional filter query params
    const { branch, minCgpa, maxBacklogs, minMatch } = req.query;
    const result = [];
    for (const app of applications) {
      // Load student profile for filtering
      const studentProfile = await Student.findOne({ user: app.student._id });
      if (!studentProfile) continue;
      // Apply branch filter (case-insensitive)
      if (branch && (studentProfile.branch || '').toLowerCase() !== branch.toLowerCase()) continue;
      // Apply minimum CGPA filter
      if (minCgpa && (studentProfile.cgpa || 0) < parseFloat(minCgpa)) continue;
      // Apply maximum backlogs filter
      if (maxBacklogs && (studentProfile.backlogs || 0) > parseInt(maxBacklogs)) continue;
      // Apply minimum match score filter
      if (minMatch && (app.matchScore || 0) < parseInt(minMatch)) continue;
      result.push({
        applicationId: app._id,
        status: app.status,
        matchScore: app.matchScore,
        appliedAt: app.createdAt,
        student: {
          id: app.student._id,
          name: app.student.name,
          email: app.student.email,
          rollNo: studentProfile.rollNo,
          branch: studentProfile.branch,
          batch: studentProfile.batch,
          cgpa: studentProfile.cgpa,
          backlogs: studentProfile.backlogs,
          // Phone is masked for company users
          phone: maskPhone(studentProfile.phone),
          skills: studentProfile.skills,
        },
      });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
