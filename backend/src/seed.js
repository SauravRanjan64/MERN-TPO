const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Company = require('./models/Company');
const Job = require('./models/Job');
const Application = require('./models/Application');
const Student = require('./models/Student');
const Notification = require('./models/Notification');
const AuditLog = require('./models/AuditLog');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dcrust';

const printCreds = (label, email, password) => {
  console.log(`  [${label}] email: ${email}  password: ${password}`);
};

const runSeed = async (reset = false) => {
  if (reset) {
    await mongoose.connection.db.dropDatabase();
    console.log('Database dropped and fresh indexes ready.\n');
  } else {
    // Only seed if empty, or just upsert
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already contains data, skipping seed.');
      return;
    }
  }

  // ───── 1. ADMIN ─────
  const admin = await User.findOneAndUpdate(
    { email: 'admin@dcrust.com' },
    { name: 'Admin DCRUST', password: 'admin123', role: 'ADMIN' },
    { upsert: true, new: true }
  );

  // ───── 2. COMPANIES ─────
  const tcsUser = await User.findOneAndUpdate(
    { email: 'tcs@company.com' },
    { name: 'TCS', password: 'tcs123', role: 'COMPANY' },
    { upsert: true, new: true }
  );
  const infosysUser = await User.findOneAndUpdate(
    { email: 'infosys@company.com' },
    { name: 'Infosys', password: 'info123', role: 'COMPANY' },
    { upsert: true, new: true }
  );
  const tcs = await Company.findOneAndUpdate({ user: tcsUser._id }, { name: 'TCS' }, { upsert: true, new: true });
  const infosys = await Company.findOneAndUpdate({ user: infosysUser._id }, { name: 'Infosys' }, { upsert: true, new: true });

  // ───── 3. JOBS ─────
  const job1 = await Job.findOneAndUpdate(
    { title: 'Software Engineer (TCS)' },
    {
      company: tcs._id,
      description: 'Build and maintain web applications using Node.js and React',
      packageLPA: 7,
      requiredSkills: ['Node.js', 'React', 'JavaScript'],
      allowedBranches: ['CSE', 'IT'],
      minCgpa: 6.5,
      maxBacklogs: 1,
      batch: 2024,
      lastDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    },
    { upsert: true, new: true }
  );

  const job2 = await Job.findOneAndUpdate(
    { title: 'Data Engineer (Infosys)' },
    {
      company: infosys._id,
      description: 'Design data pipelines using Python and SQL',
      packageLPA: 10,
      requiredSkills: ['Python', 'SQL', 'Machine Learning'],
      allowedBranches: ['CSE', 'ECE', 'IT'],
      minCgpa: 8.5,
      maxBacklogs: 0,
      batch: 2024,
      lastDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    },
    { upsert: true, new: true }
  );

  const createStudent = async (name, email, pwd, roll, branch, batch, cgpa, backlogs, phone, skills, consent) => {
    const user = await User.findOneAndUpdate(
      { email },
      { name, password: pwd, role: 'STUDENT' },
      { upsert: true, new: true }
    );
    const student = await Student.findOneAndUpdate(
      { user: user._id },
      {
        rollNo: roll, branch, batch, cgpa, backlogs, phone, skills, consent,
        resumeText: `${name} is a ${branch} student skilled in ${skills.join(', ')}. Experienced in web development and software engineering.`,
      },
      { upsert: true, new: true }
    );
    return { user, student };
  };

  const s1 = await createStudent('Rahul Sharma', 'rahul@student.com', 'pass123', 'CSE001', 'CSE', 2024, 8.1, 0, '9811111111', ['Node.js', 'React', 'JavaScript', 'Python'], true);
  const s2 = await createStudent('Priya Verma', 'priya@student.com', 'pass123', 'CSE002', 'CSE', 2024, 9.1, 0, '9822222222', ['Python', 'SQL', 'Machine Learning', 'Node.js'], true);
  
  await Application.findOneAndUpdate({ student: s1.user._id, job: job1._id }, { status: 'SHORTLISTED', matchScore: 90 }, { upsert: true });
  await Application.findOneAndUpdate({ student: s2.user._id, job: job2._id }, { status: 'SELECTED', matchScore: 95 }, { upsert: true });

  console.log('Seeding complete!');
};

if (require.main === module) {
  const reset = process.argv.includes('--reset');
  mongoose.connect(MONGODB_URI).then(() => {
    return runSeed(reset);
  }).then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runSeed };
