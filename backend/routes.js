// All API routes in one file
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { User, Job, Application, Resume } = require('./models');
const { protect, onlyAdmin } = require('./middleware');

const router = express.Router();

// Configure multer to store file in memory (max 1 MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      const err = new Error('Only PDF files are allowed.');
      err.status = 400;
      return cb(err, false);
    }
    cb(null, true);
  }
});

// Middleware to handle multer upload and format errors
function handleResumeUpload(req, res, next) {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Resume must be under 1 MB.' });
      }
      return res.status(400).json({ message: err.message || 'File upload error.' });
    }
    next();
  });
}

// helper: create a JWT for a user
function makeToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// ---- Health check ----
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ---- Auth: register (students only) ----
router.post('/auth/register', async (req, res, next) => {
  try {
    const { name, email, password, branch, cgpa } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    // check if email already exists
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name, email: email.toLowerCase(), password: hashed,
      role: 'STUDENT', branch: branch || '', cgpa: cgpa || 0
    });
    const token = makeToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) { next(err); }
});

// ---- Auth: login ----
router.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid email or password.' });

    const token = makeToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) { next(err); }
});

// ---- Auth: get current user ----
router.get('/auth/me', protect, (req, res) => {
  res.json({ user: req.user });
});

// ---- Jobs: list all (any logged-in user) ----
router.get('/jobs', protect, async (req, res, next) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) { next(err); }
});

// ---- Jobs: create (admin only) ----
router.post('/jobs', protect, onlyAdmin, async (req, res, next) => {
  try {
    const { title, companyName, description, packageLPA, minCgpa, lastDate } = req.body;
    if (!title || !companyName || !lastDate) {
      return res.status(400).json({ message: 'Title, company name and last date are required.' });
    }
    const job = await Job.create({ title, companyName, description, packageLPA, minCgpa, lastDate });
    res.status(201).json(job);
  } catch (err) { next(err); }
});

// ---- Jobs: delete (admin only) ----
router.delete('/jobs/:id', protect, onlyAdmin, async (req, res, next) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    // also remove all applications for this job
    await Application.deleteMany({ job: req.params.id });
    res.json({ message: 'Job deleted.' });
  } catch (err) { next(err); }
});

// ---- Jobs: student applies ----
router.post('/jobs/:id/apply', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ message: 'Only students can apply.' });
    }
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found.' });

    // check last date
    if (new Date(job.lastDate) < new Date()) {
      return res.status(400).json({ message: 'Application deadline has passed.' });
    }
    // check CGPA
    if (req.user.cgpa < job.minCgpa) {
      return res.status(400).json({ message: `Minimum CGPA required is ${job.minCgpa}. Your CGPA is ${req.user.cgpa}.` });
    }
    // check approved resume
    const resume = await Resume.findOne({ user: req.user._id });
    if (!resume || resume.status !== 'APPROVED') {
      return res.status(400).json({ message: 'You must have an approved resume to apply for jobs.' });
    }
    // check already applied
    const already = await Application.findOne({ user: req.user._id, job: job._id });
    if (already) {
      return res.status(400).json({ message: 'You have already applied to this job.' });
    }

    const app = await Application.create({ user: req.user._id, job: job._id });
    res.status(201).json(app);
  } catch (err) { next(err); }
});

// ---- Applications: student's own ----
router.get('/applications/my', protect, async (req, res, next) => {
  try {
    const apps = await Application.find({ user: req.user._id }).populate('job').sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) { next(err); }
});

// ---- Applications: all (admin) ----
router.get('/applications', protect, onlyAdmin, async (req, res, next) => {
  try {
    const apps = await Application.find()
      .populate('user', 'name email branch cgpa')
      .populate('job', 'title companyName')
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) { next(err); }
});

// ---- Applications: admin updates status ----
router.put('/applications/:id/status', protect, onlyAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['APPLIED', 'SHORTLISTED', 'SELECTED', 'REJECTED'];
    if (!valid.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${valid.join(', ')}` });
    }
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name email branch cgpa').populate('job', 'title companyName');
    if (!app) return res.status(404).json({ message: 'Application not found.' });
    res.json(app);
  } catch (err) { next(err); }
});

// ---- Resumes: upload (student only, max 1MB, PDF only) ----
router.post('/resume', protect, (req, res, next) => {
  if (req.user.role !== 'STUDENT') {
    return res.status(403).json({ message: 'Only students can upload resumes.' });
  }
  handleResumeUpload(req, res, async (err) => {
    if (err) return next(err);
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Please upload a resume file.' });
      }
      // verify PDF magic bytes (%PDF-)
      if (!req.file.buffer || req.file.buffer.length < 5 || req.file.buffer.toString('utf-8', 0, 5) !== '%PDF-') {
        return res.status(400).json({ message: 'File is not a valid PDF.' });
      }

      const resume = await Resume.findOneAndUpdate(
        { user: req.user._id },
        {
          filename: req.file.originalname,
          contentType: req.file.mimetype || 'application/pdf',
          size: req.file.size,
          data: req.file.buffer,
          status: 'PENDING',
          remarks: '',
          reviewedBy: null,
          reviewedAt: null
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).select('-data');

      res.status(200).json(resume);
    } catch (dbErr) {
      next(dbErr);
    }
  });
});

// ---- Resumes: get current student's resume ----
router.get('/resume/my', protect, async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ user: req.user._id });
    res.json(resume);
  } catch (err) { next(err); }
});

// ---- Resumes: list all (admin only) ----
router.get('/resumes', protect, onlyAdmin, async (req, res, next) => {
  try {
    const resumes = await Resume.find()
      .populate('user', 'name email branch cgpa')
      .sort({ createdAt: -1 });
    res.json(resumes);
  } catch (err) { next(err); }
});

// ---- Resumes: view/download PDF file (admin or owner only) ----
router.get('/resumes/:id/file', protect, async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id).select('+data');
    if (!resume) return res.status(404).json({ message: 'Resume not found.' });

    const isOwner = resume.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.setHeader('Content-Type', resume.contentType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${resume.filename || 'resume.pdf'}"`);
    res.send(resume.data);
  } catch (err) { next(err); }
});

// ---- Resumes: review/validate (admin only) ----
router.put('/resumes/:id/review', protect, onlyAdmin, async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Status must be APPROVED or REJECTED.' });
    }
    if (status === 'REJECTED' && (!remarks || !remarks.trim())) {
      return res.status(400).json({ message: 'Remarks are required when rejecting a resume.' });
    }

    const resume = await Resume.findByIdAndUpdate(
      req.params.id,
      {
        status,
        remarks: remarks ? remarks.trim() : '',
        reviewedBy: req.user._id,
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('user', 'name email branch cgpa');

    if (!resume) return res.status(404).json({ message: 'Resume not found.' });
    res.json(resume);
  } catch (err) { next(err); }
});

module.exports = router;

