// All API routes in one file
const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { User, Job, Application, Resume } = require('./models');
const { protect, onlyAdmin } = require('./middleware');
const { sendMail } = require('./mailer');

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

// ---- Auth: forgot password ----
router.post('/auth/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    // If user exists, create token, store hash, and send email
    if (user) {
      // Generate 32-byte secure random hex token
      const rawToken = crypto.randomBytes(32).toString('hex');
      // Store SHA-256 hash in database
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour from now
      await user.save();

      // Reset link sent to student
      const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
      const resetLink = `${appUrl}/reset-password/${rawToken}`;

      const emailText = `Hello ${user.name},\n\nYou requested a password reset for your DCRUST Placement Portal account.\n\nPlease click the link below or paste it into your browser to set a new password:\n${resetLink}\n\nThis link is valid for 1 hour.\n\nIf you did not request this, please ignore this email and your password will remain unchanged.`;

      // Send mail (or log to console if SMTP env missing)
      try {
        await sendMail({
          to: user.email,
          subject: 'DCRUST Placement Portal - Password Reset',
          text: emailText
        });
      } catch (mailErr) {
        console.error('Failed to send reset email:', mailErr.message);
      }
    }

    // ALWAYS reply with the exact same message whether or not email exists
    res.json({
      message: 'If an account exists with that email, a password reset link has been sent.'
    });
  } catch (err) {
    console.error('Forgot password failed:', err.message);
    next(err);
  }
});

// ---- Auth: reset password with token ----
router.post('/auth/reset-password/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // Hash the token provided in the URL to compare with database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching unexpired token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    }).select('+password +resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ message: 'Password reset link is invalid or has expired.' });
    }

    // Set new hashed password and clear reset token fields
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful! You can now log in with your new password.' });
  } catch (err) {
    console.error('Reset password failed:', err.message);
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

    // Load existing application to verify old status and get student & job details
    const existingApp = await Application.findById(req.params.id)
      .populate('user', 'name email branch cgpa')
      .populate('job', 'title companyName');

    if (!existingApp) return res.status(404).json({ message: 'Application not found.' });

    const oldStatus = existingApp.status;
    existingApp.status = status;
    const updatedApp = await existingApp.save();

    // ONLY if the status actually changed, send an email to the student (unawaited & caught)
    if (oldStatus !== status && existingApp.user?.email) {
      const studentName = existingApp.user.name;
      const jobTitle = existingApp.job?.title || 'Job';
      const companyName = existingApp.job?.companyName || 'Company';

      const emailSubject = `Application Update: ${jobTitle} at ${companyName} - ${status}`;
      const emailBody = `Hello ${studentName},\n\nYour application status for the position of "${jobTitle}" at "${companyName}" has been updated to: ${status}.\n\nPlease log in to the DCRUST Placement Portal to view the full details.\n\nBest regards,\nTraining & Placement Cell, DCRUST`;

      // Non-blocking fire-and-forget: mail problem will never fail the status update
      sendMail({
        to: existingApp.user.email,
        subject: emailSubject,
        text: emailBody
      }).catch((mailErr) => {
        console.error('Failed to send status update email:', mailErr.message);
      });
    }

    res.json(updatedApp);
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

    // Load existing resume to check old status
    const existingResume = await Resume.findById(req.params.id).populate('user', 'name email branch cgpa');
    if (!existingResume) return res.status(404).json({ message: 'Resume not found.' });

    const oldStatus = existingResume.status;
    const cleanRemarks = remarks ? remarks.trim() : '';

    existingResume.status = status;
    existingResume.remarks = cleanRemarks;
    existingResume.reviewedBy = req.user._id;
    existingResume.reviewedAt = new Date();
    const savedResume = await existingResume.save();

    // If status changed, send email to student (non-blocking)
    if (oldStatus !== status && existingResume.user?.email) {
      const studentName = existingResume.user.name;
      const emailSubject = `Resume Review Update: ${status}`;
      let emailBody = `Hello ${studentName},\n\nYour uploaded resume has been reviewed by the Placement Cell.\nStatus: ${status}`;
      if (cleanRemarks) {
        emailBody += `\nRemarks: ${cleanRemarks}`;
      }
      emailBody += `\n\nPlease log in to the DCRUST Placement Portal for details.\n\nBest regards,\nTraining & Placement Cell, DCRUST`;

      sendMail({
        to: existingResume.user.email,
        subject: emailSubject,
        text: emailBody
      }).catch((mailErr) => {
        console.error('Failed to send resume review email:', mailErr.message);
      });
    }

    res.json(savedResume);
  } catch (err) { next(err); }
});

// ===== ADMIN PAGINATION & SEARCH ROUTES =====

// GET /api/admin/jobs: paginated jobs list with search
router.get('/admin/jobs', protect, onlyAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    const query = {};
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { companyName: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const [total, data] = await Promise.all([
      Job.countDocuments(query),
      Job.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      data,
      total,
      page,
      limit,
      totalPages
    });
  } catch (err) {
    console.error('Admin list jobs failed:', err.message);
    next(err);
  }
});

// GET /api/admin/students: paginated students list with search
router.get('/admin/students', protect, onlyAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    const query = { role: 'STUDENT' };
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
        { branch: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const [total, students] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      data: students,
      total,
      page,
      limit,
      totalPages
    });
  } catch (err) {
    console.error('Admin list students failed:', err.message);
    next(err);
  }
});

// GET /api/admin/applications: paginated applications with search, status, and jobId filters
router.get('/admin/applications', protect, onlyAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const status = (req.query.status || '').trim();
    const jobId = (req.query.jobId || '').trim();

    const query = {};

    // Filter by application status
    if (status && status !== 'ALL') {
      query.status = status;
    }

    // Filter by specific job
    if (jobId) {
      query.job = jobId;
    }

    // Because student/job details live in separate collections, find matching IDs first
    if (search) {
      const safeSearch = escapeRegex(search);
      const [matchingUsers, matchingJobs] = await Promise.all([
        User.find({
          $or: [
            { name: { $regex: safeSearch, $options: 'i' } },
            { email: { $regex: safeSearch, $options: 'i' } },
            { branch: { $regex: safeSearch, $options: 'i' } }
          ]
        }).select('_id'),
        Job.find({
          $or: [
            { title: { $regex: safeSearch, $options: 'i' } },
            { companyName: { $regex: safeSearch, $options: 'i' } }
          ]
        }).select('_id')
      ]);

      const userIds = matchingUsers.map((u) => u._id);
      const jobIds = matchingJobs.map((j) => j._id);

      query.$or = [
        { user: { $in: userIds } },
        { job: { $in: jobIds } }
      ];
    }

    const [total, data] = await Promise.all([
      Application.countDocuments(query),
      Application.find(query)
        .populate('user', 'name email branch cgpa phone skills')
        .populate('job', 'title companyName packageLPA minCgpa lastDate')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      data,
      total,
      page,
      limit,
      totalPages
    });
  } catch (err) {
    console.error('Admin list applications failed:', err.message);
    next(err);
  }
});

// GET /api/admin/stats: aggregate placement and portal metrics for charts and summary cards
router.get('/admin/stats', protect, onlyAdmin, async (req, res, next) => {
  try {
    // 1. Fetch total count of students
    const totalStudents = await User.countDocuments({ role: 'STUDENT' });

    // 2. Fetch total count of posted jobs
    const totalJobs = await Job.countDocuments();

    // 3. Fetch total count of applications submitted
    const totalApplications = await Application.countDocuments();

    // 4. Fetch placed students (distinct student IDs having at least one 'SELECTED' application)
    const placedStudentsList = await Application.distinct('user', { status: 'SELECTED' });
    const placedStudents = placedStudentsList.length;

    // 5. Count applications grouped by status (APPLIED, SHORTLISTED, SELECTED, REJECTED)
    const statusAgg = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    const statusCounts = {
      APPLIED: 0,
      SHORTLISTED: 0,
      SELECTED: 0,
      REJECTED: 0
    };
    statusAgg.forEach((item) => {
      if (item._id && statusCounts[item._id] !== undefined) {
        statusCounts[item._id] = item.count;
      }
    });

    // 6. MongoDB Aggregation Pipeline: Calculate applications per company
    // Stage 1: $lookup joins the 'jobs' collection using Application.job -> Job._id
    // Stage 2: $unwind flattens the joined job array into an object for each application
    // Stage 3: $group groups applications by job.companyName and sums the total applications
    // Stage 4: $sort orders the companies from highest number of applications to lowest
    // Stage 5: $limit caps the results to the top 10 companies for clean charting
    // Stage 6: $project formats the output with readable keys (company, applications)
    const applicationsPerCompany = await Application.aggregate([
      // Stage 1: Join jobs collection to access companyName
      {
        $lookup: {
          from: 'jobs',
          localField: 'job',
          foreignField: '_id',
          as: 'jobDetails'
        }
      },
      // Stage 2: Unwind jobDetails array so jobDetails is a single document
      {
        $unwind: '$jobDetails'
      },
      // Stage 3: Group by companyName and count occurrences
      {
        $group: {
          _id: '$jobDetails.companyName',
          count: { $sum: 1 }
        }
      },
      // Stage 4: Sort descending by count
      {
        $sort: { count: -1 }
      },
      // Stage 5: Limit to top 10 companies
      {
        $limit: 10
      },
      // Stage 6: Format fields for frontend chart
      {
        $project: {
          _id: 0,
          company: '$_id',
          applications: '$count'
        }
      }
    ]);

    res.json({
      totalStudents,
      totalJobs,
      totalApplications,
      placedStudents,
      statusCounts,
      applicationsPerCompany
    });
  } catch (err) {
    console.error('Admin stats calculation failed:', err.message);
    next(err);
  }
});

module.exports = router;

