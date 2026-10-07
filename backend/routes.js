// All API routes in one file
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Job, Application } = require('./models');
const { protect, onlyAdmin } = require('./middleware');

const router = express.Router();

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

module.exports = router;
