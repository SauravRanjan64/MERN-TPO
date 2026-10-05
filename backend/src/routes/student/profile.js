// Student profile routes: view/edit own profile, consent, jobs, applications, resume upload
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../../middleware/auth');
const { allowRoles } = require('../../middleware/role');
const Student = require('../../models/Student');
const Job = require('../../models/Job');
const Application = require('../../models/Application');
const { checkEligibility } = require('../../utils/eligibility');
const { computeMatch } = require('../../utils/resumeMatch');
const { writeAudit } = require('../../utils/audit');

const router = express.Router();

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer storage configuration: save to uploads/ with original extension
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `resume_${req.user._id}_${Date.now()}${path.extname(file.originalname)}`),
});

// Multer file filter: allow only PDF files by mimetype and extension
const fileFilter = (req, file, cb) => {
  const isPdf = file.mimetype === 'application/pdf' && path.extname(file.originalname).toLowerCase() === '.pdf';
  if (isPdf) return cb(null, true);
  cb(new Error('Only PDF files are allowed'));
};

// Create multer instance with 2MB file size limit
const upload = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } });

// GET /api/student/me - return student's own profile
router.get('/me', authenticate, allowRoles('STUDENT'), async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });
    res.json({ student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/student/me - update only phone and skills on own profile
router.put('/me', authenticate, allowRoles('STUDENT'), async (req, res) => {
  try {
    const { phone, skills } = req.body;
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });
    // Only allow updating phone and skills
    if (phone !== undefined) student.phone = phone;
    if (skills !== undefined) student.skills = skills;
    await student.save();
    res.json({ message: 'Profile updated', student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/student/consent - toggle placement consent for the student
router.put('/consent', authenticate, allowRoles('STUDENT'), async (req, res) => {
  try {
    const { consent } = req.body;
    if (typeof consent !== 'boolean') return res.status(400).json({ message: 'consent must be a boolean' });
    const student = await Student.findOneAndUpdate(
      { user: req.user._id },
      { consent },
      { new: true }
    );
    if (!student) return res.status(404).json({ message: 'Student profile not found' });
    res.json({ message: 'Consent updated', consent: student.consent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/student/jobs - list all jobs that have not passed their last date
router.get('/jobs', authenticate, allowRoles('STUDENT'), async (req, res) => {
  try {
    const now = new Date();
    // Only return jobs where lastDate is in the future (or not set)
    const jobs = await Job.find({ $or: [{ lastDate: { $gte: now } }, { lastDate: null }] })
      .populate({ path: 'company', populate: { path: 'user', select: 'name' } })
      .sort({ createdAt: -1 });
    res.json(jobs.map(job => ({
      _id: job._id,
      title: job.title,
      description: job.description,
      packageLPA: job.packageLPA,
      requiredSkills: job.requiredSkills,
      allowedBranches: job.allowedBranches,
      minCgpa: job.minCgpa,
      maxBacklogs: job.maxBacklogs,
      batch: job.batch,
      lastDate: job.lastDate,
      companyName: job.company?.name || 'Company',
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/student/jobs/:id - get single job drive details
router.get('/jobs/:id', authenticate, allowRoles('STUDENT'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate({ path: 'company', populate: { path: 'user', select: 'name' } });
    if (!job) return res.status(404).json({ message: 'Job drive not found' });
    res.json({
      _id: job._id,
      title: job.title,
      description: job.description,
      packageLPA: job.packageLPA,
      requiredSkills: job.requiredSkills,
      allowedBranches: job.allowedBranches,
      minCgpa: job.minCgpa,
      maxBacklogs: job.maxBacklogs,
      batch: job.batch,
      lastDate: job.lastDate,
      companyName: job.company?.name || 'Company',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/applications/my - list the student's own applications with job and company populated
router.get('/applications/my', authenticate, allowRoles('STUDENT'), async (req, res) => {
  try {
    const apps = await Application.find({ student: req.user._id })
      .populate({ path: 'job', populate: { path: 'company', select: 'name' } })
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/student/resume - upload PDF resume, extract text, save to student profile
router.post('/resume', authenticate, allowRoles('STUDENT'), upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded or invalid type' });
    // Extract text from the uploaded PDF using pdf-parse
    const pdfParse = require('pdf-parse/lib/pdf-parse.js');
    const fileBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(fileBuffer);
    const resumeText = pdfData.text || '';
    // Save extracted text to student profile
    const student = await Student.findOneAndUpdate(
      { user: req.user._id },
      { resumeText },
      { new: true }
    );
    if (!student) return res.status(404).json({ message: 'Student profile not found' });
    res.json({ message: 'Resume uploaded and text extracted', textLength: resumeText.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/student/eligibility/:jobId - check eligibility and resume match for a job
router.get('/eligibility/:jobId', authenticate, allowRoles('STUDENT'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });
    // Check if already applied for the duplicate check
    const existing = await Application.findOne({ student: req.user._id, job: job._id });
    const eligibility = await checkEligibility(student, job, !!existing);
    // Compute resume skill match
    const matchResult = computeMatch(student.resumeText, job.requiredSkills);
    res.json({ ...eligibility, ...matchResult });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
