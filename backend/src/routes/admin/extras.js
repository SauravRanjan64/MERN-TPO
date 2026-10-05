// Admin extras: students management, companies management, applications view, CSV export, audit log
const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { allowRoles } = require('../../middleware/role');
const { maskPhone } = require('../../utils/maskPhone');
const { writeAudit } = require('../../utils/audit');
const User = require('../../models/User');
const Student = require('../../models/Student');
const Company = require('../../models/Company');
const Application = require('../../models/Application');
const AuditLog = require('../../models/AuditLog');
const Job = require('../../models/Job');

const router = express.Router();

// GET /api/admin/students?search=&branch= - list all students with optional filters
router.get('/students', authenticate, allowRoles('ADMIN'), async (req, res) => {
  try {
    const { search, branch } = req.query;
    let query = {};
    // Filter by branch if provided
    if (branch) query.branch = { $regex: branch, $options: 'i' };
    const students = await Student.find(query).populate('user', 'name email');
    // Filter by name/email search if provided
    const filtered = students.filter(s => {
      if (!search) return true;
      const term = search.toLowerCase();
      return (
        (s.user?.name || '').toLowerCase().includes(term) ||
        (s.user?.email || '').toLowerCase().includes(term) ||
        (s.rollNo || '').toLowerCase().includes(term)
      );
    });
    // Mask phone before sending to admin
    const result = filtered.map(s => ({
      _id: s._id,
      name: s.user?.name,
      email: s.user?.email,
      rollNo: s.rollNo,
      branch: s.branch,
      batch: s.batch,
      cgpa: s.cgpa,
      backlogs: s.backlogs,
      phone: maskPhone(s.phone),
      skills: s.skills,
      consent: s.consent,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/students/:id - update student academic fields (cgpa, backlogs, branch, batch)
router.put('/students/:id', authenticate, allowRoles('ADMIN'), async (req, res) => {
  try {
    const { cgpa, backlogs, branch, batch } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    // Only allow updating academic/profile fields, not sensitive identity fields
    if (cgpa !== undefined) student.cgpa = cgpa;
    if (backlogs !== undefined) student.backlogs = backlogs;
    if (branch !== undefined) student.branch = branch;
    if (batch !== undefined) student.batch = batch;
    await student.save();
    res.json({ message: 'Student updated', student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/students - admin creates a student user + student profile
router.post('/students', authenticate, allowRoles('ADMIN'), async (req, res) => {
  try {
    const { name, email, password, rollNo, branch, batch, cgpa, backlogs, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'name, email, password required' });
    const user = await User.create({ name, email, password, role: 'STUDENT' });
    const student = await Student.create({ user: user._id, rollNo, branch, batch, cgpa, backlogs, phone });
    await writeAudit(req.user._id, 'STUDENT_CREATED', { studentId: student._id });
    res.status(201).json({ message: 'Student created', user: { id: user._id, email }, student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/companies - admin creates a company user + company profile
router.post('/companies', authenticate, allowRoles('ADMIN'), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'name, email, password required' });
    const user = await User.create({ name, email, password, role: 'COMPANY' });
    const company = await Company.create({ user: user._id, name });
    res.status(201).json({ message: 'Company created', user: { id: user._id, email }, company });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/companies - list all companies with their user info
router.get('/companies', authenticate, allowRoles('ADMIN'), async (req, res) => {
  try {
    const companies = await Company.find().populate('user', 'name email');
    res.json(companies.map(c => ({
      _id: c._id,
      name: c.name,
      userId: c.user?._id,
      userName: c.user?.name,
      userEmail: c.user?.email,
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/applications?jobId=&status= - list applications with optional filters
router.get('/applications', authenticate, allowRoles('ADMIN'), async (req, res) => {
  try {
    const { jobId, status } = req.query;
    let query = {};
    if (jobId) query.job = jobId;
    if (status) query.status = status;
    const apps = await Application.find(query)
      .populate('student', 'name email')
      .populate({ path: 'job', populate: { path: 'company', select: 'name' } })
      .sort({ createdAt: -1 });
    // Get student profile for phone (masked)
    const result = [];
    for (const app of apps) {
      const studentProfile = await Student.findOne({ user: app.student._id });
      result.push({
        _id: app._id,
        status: app.status,
        matchScore: app.matchScore,
        appliedAt: app.createdAt,
        student: {
          name: app.student?.name,
          email: app.student?.email,
          phone: maskPhone(studentProfile?.phone),
        },
        job: { title: app.job?.title, company: app.job?.company?.name },
      });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/export - download applications as CSV (no library, plain string building)
router.get('/export', authenticate, allowRoles('ADMIN'), async (req, res) => {
  try {
    const apps = await Application.find()
      .populate('student', 'name email')
      .populate({ path: 'job', populate: { path: 'company', select: 'name' } });
    // Build CSV header row
    const rows = ['StudentName,StudentEmail,JobTitle,Company,Status,MatchScore,AppliedAt'];
    for (const app of apps) {
      // Escape any commas in string fields
      const escape = v => `"${String(v || '').replace(/"/g, '""')}"`;
      rows.push([
        escape(app.student?.name),
        escape(app.student?.email),
        escape(app.job?.title),
        escape(app.job?.company?.name),
        escape(app.status),
        escape(app.matchScore || 0),
        escape(app.createdAt ? new Date(app.createdAt).toISOString() : ''),
      ].join(','));
    }
    const csv = rows.join('\n');
    // Set headers to trigger CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="applications.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/audit - return the latest 50 audit log entries
router.get('/audit', authenticate, allowRoles('ADMIN'), async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('user', 'name email');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
