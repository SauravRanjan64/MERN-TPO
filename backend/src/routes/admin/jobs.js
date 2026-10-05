// Admin routes for managing job drives
const express = require('express');
const { authenticate, authorize } = require('../../middleware/auth');
const Job = require('../../models/Job');
const Company = require('../../models/Company');
const User = require('../../models/User');
const { z } = require('zod');
const { notify } = require('../../utils/notify');

const router = express.Router();

// Zod schema for job validation
const jobSchema = z.object({
  companyId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  packageLPA: z.number().optional(),
  requiredSkills: z.array(z.string()).optional(),
  allowedBranches: z.array(z.string()).optional(),
  minCgpa: z.number().optional(),
  maxBacklogs: z.number().optional(),
  batch: z.string().optional(),
  lastDate: z.preprocess(arg => new Date(arg), z.date()).optional(),
});

// Helper to audit actions (simple console log for now)
const audit = (action, details) => {
  console.log(`AUDIT ${action}:`, details);
};

// CREATE job drive (ADMIN only, company must have role COMPANY)
router.post('/jobs', authenticate, authorize('ADMIN'), async (req, res) => {
  const parseResult = jobSchema.safeParse(req.body);
  if (!parseResult.success) return res.status(400).json(parseResult.error);
  const data = parseResult.data;
  // Ensure company exists and belongs to a user with COMPANY role
  const company = await Company.findById(data.companyId).populate('user');
  if (!company) return res.status(400).json({ message: 'Company not found' });
  if (company.user.role !== 'COMPANY') return res.status(400).json({ message: 'User is not a company' });

  const job = await Job.create({ ...data, company: company._id });
  audit('JOB_CREATED', { admin: req.user.id, jobId: job._id });
  res.status(201).json(job);
});

// UPDATE job drive
router.put('/jobs/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  const parseResult = jobSchema.safeParse(req.body);
  if (!parseResult.success) return res.status(400).json(parseResult.error);
  const data = parseResult.data;
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  // If companyId provided, verify same checks as create
  if (data.companyId) {
    const company = await Company.findById(data.companyId).populate('user');
    if (!company) return res.status(400).json({ message: 'Company not found' });
    if (company.user.role !== 'COMPANY') return res.status(400).json({ message: 'User is not a company' });
    data.company = company._id;
  }
  Object.assign(job, data);
  await job.save();
  audit('JOB_UPDATED', { admin: req.user.id, jobId: job._id });
  res.json(job);
});

// LIST all jobs with company name populated
router.get('/jobs', authenticate, authorize('ADMIN'), async (req, res) => {
  const jobs = await Job.find().populate({ path: 'company', populate: { path: 'user', select: 'name' } });
  const formatted = jobs.map(j => ({
    _id: j._id,
    title: j.title,
    description: j.description,
    packageLPA: j.packageLPA,
    requiredSkills: j.requiredSkills,
    allowedBranches: j.allowedBranches,
    minCgpa: j.minCgpa,
    maxBacklogs: j.maxBacklogs,
    batch: j.batch,
    lastDate: j.lastDate,
    companyName: j.company.user.name,
  }));
  res.json(formatted);
});

module.exports = router;
