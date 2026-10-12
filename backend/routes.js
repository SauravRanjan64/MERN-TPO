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
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        cgpa: user.cgpa,
        phone: user.phone || '',
        skills: user.skills || []
      }
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
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        cgpa: user.cgpa,
        phone: user.phone || '',
        skills: user.skills || []
      }
    });
  } catch (err) { next(err); }
});

// ---- Auth: get current user ----
router.get('/auth/me', protect, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      branch: req.user.branch,
      cgpa: req.user.cgpa,
      phone: req.user.phone || '',
      skills: req.user.skills || []
    }
  });
});

// ---- Auth: change password ----
router.put('/auth/password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }

    // Load user WITH password hash (req.user from protect middleware has -password)
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check old password with bcrypt.compare (wrong -> 400, NOT 401 to prevent frontend auto-logout)
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    // New password validation: minimum 6 characters
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    // New password must be different from current password
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({ message: 'New password must be different from your current password.' });
    }

    // Hash new password and save
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password failed:', err.message);
    next(err);
  }
});

// ===== PROFILE ROUTES =====
// PUT /api/profile: update student branch, cgpa, phone, skills
router.put('/profile', protect, async (req, res, next) => {
  try {
    // Only students can update student profile
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ message: 'Only students can update profile.' });
    }

    const { branch, cgpa, phone, skills } = req.body;
    const updates = {};

    // Validate branch if provided
    if (branch !== undefined) {
      if (typeof branch !== 'string' || !branch.trim()) {
        return res.status(400).json({ message: 'Branch cannot be empty.' });
      }
      updates.branch = branch.trim();
    }

    // Validate CGPA if provided
    if (cgpa !== undefined) {
      const numCgpa = Number(cgpa);
      if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
        return res.status(400).json({ message: 'CGPA must be between 0 and 10.' });
      }
      updates.cgpa = numCgpa;
    }

    // Validate phone if provided (either empty string or 10-digit number)
    if (phone !== undefined) {
      const trimmedPhone = String(phone).trim();
      if (trimmedPhone !== '' && !/^\d{10}$/.test(trimmedPhone)) {
        return res.status(400).json({ message: 'Phone must be empty or a 10-digit number.' });
      }
      updates.phone = trimmedPhone;
    }

    // Validate skills if provided (array of short strings, no duplicates)
    if (skills !== undefined) {
      if (!Array.isArray(skills)) {
        return res.status(400).json({ message: 'Skills must be an array of strings.' });
      }
      const cleanedSkills = [];
      for (const item of skills) {
        if (typeof item !== 'string') {
          return res.status(400).json({ message: 'Each skill must be a string.' });
        }
        const trimmed = item.trim();
        if (!trimmed) continue;
        if (trimmed.length > 50) {
          return res.status(400).json({ message: 'Each skill must be 50 characters or less.' });
        }
        if (!cleanedSkills.includes(trimmed)) {
          cleanedSkills.push(trimmed);
        }
      }
      updates.skills = cleanedSkills;
    }

    // Save updates to database
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        branch: updatedUser.branch,
        cgpa: updatedUser.cgpa,
        phone: updatedUser.phone || '',
        skills: updatedUser.skills || []
      }
    });
  } catch (err) {
    console.error('Update profile failed:', err.message);
    next(err);
  }
});

// Helper: Escape special regex characters to prevent regex injection or crashes
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// ---- Jobs: list all (with optional search and filters) ----
router.get('/jobs', protect, async (req, res, next) => {
  try {
    const { company, minPackage, eligible } = req.query;
    const filter = {};

    // Filter by company name (partial match, case-insensitive, safely escaped)
    if (company && typeof company === 'string' && company.trim() !== '') {
      const safeCompany = escapeRegex(company.trim());
      filter.companyName = { $regex: safeCompany, $options: 'i' };
    }

    // Filter by minimum package (packageLPA >= value)
    if (minPackage !== undefined && minPackage !== '') {
      const parsedMinPackage = Number(minPackage);
      if (!isNaN(parsedMinPackage) && parsedMinPackage >= 0) {
        filter.packageLPA = { $gte: parsedMinPackage };
      }
    }

    // Filter by student eligibility (minCgpa <= student's CGPA)
    if (eligible === 'true' && req.user && req.user.role === 'STUDENT') {
      const studentCgpa = req.user.cgpa || 0;
      filter.minCgpa = { $lte: studentCgpa };
    }

    const jobs = await Job.find(filter).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    console.error('List jobs failed:', err.message);
    next(err);
  }
});

// ---- Jobs: create (admin only) ----
router.post('/jobs', protect, onlyAdmin, async (req, res, next) => {
  try {
    const { title, companyName, description, packageLPA, minCgpa, lastDate } = req.body;
    if (!title || !companyName || !lastDate) {
      return res.status(400).json({ message: 'Title, company name and last date are required.' });
    }

    // Treat date like "2026-10-20" as the end of that day (23:59:59.999 IST, UTC+05:30)
    let parsedLastDate;
    if (typeof lastDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(lastDate)) {
      parsedLastDate = new Date(`${lastDate}T23:59:59.999+05:30`);
    } else {
      parsedLastDate = new Date(lastDate);
    }

    const job = await Job.create({
      title,
      companyName,
      description,
      packageLPA,
      minCgpa,
      lastDate: parsedLastDate
    });
    res.status(201).json(job);
  } catch (err) {
    console.error('Create job failed:', err.message);
    next(err);
  }
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

