// Seed script: creates admin, 2 companies, 3 jobs, 8 students, and applications in each status
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

// Helper to print credentials in a readable format
const printCreds = (label, email, password) => {
  console.log(`  [${label}] email: ${email}  password: ${password}`);
};

const seed = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('\n=== Connected to MongoDB for seeding ===\n');

  // Drop the whole test database to remove all stale collection indexes
  await mongoose.connection.db.dropDatabase();
  console.log('Database dropped and fresh indexes ready.\n');

  // ───── 1. ADMIN ─────
  const admin = await User.create({ name: 'Admin DCRUST', email: 'admin@dcrust.com', password: 'admin123', role: 'ADMIN' });
  console.log('--- ADMIN ---');
  printCreds('ADMIN', 'admin@dcrust.com', 'admin123');

  // ───── 2. COMPANIES ─────
  const tcsUser = await User.create({ name: 'TCS', email: 'tcs@company.com', password: 'tcs123', role: 'COMPANY' });
  const infosysUser = await User.create({ name: 'Infosys', email: 'infosys@company.com', password: 'info123', role: 'COMPANY' });
  const tcs = await Company.create({ user: tcsUser._id, name: 'TCS' });
  const infosys = await Company.create({ user: infosysUser._id, name: 'Infosys' });
  console.log('\n--- COMPANIES ---');
  printCreds('TCS', 'tcs@company.com', 'tcs123');
  printCreds('INFOSYS', 'infosys@company.com', 'info123');

  // ───── 3. JOBS ─────
  // Job 1: Open for CSE, normal CGPA cutoff
  const job1 = await Job.create({
    company: tcs._id,
    title: 'Software Engineer (TCS)',
    description: 'Build and maintain web applications using Node.js and React',
    packageLPA: 7,
    requiredSkills: ['Node.js', 'React', 'JavaScript'],
    allowedBranches: ['CSE', 'IT'],
    minCgpa: 6.5,
    maxBacklogs: 1,
    batch: 2024,
    lastDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
  });

  // Job 2: High CGPA cutoff (8.5), open to CSE, ECE, IT
  const job2 = await Job.create({
    company: infosys._id,
    title: 'Data Engineer (Infosys)',
    description: 'Design data pipelines using Python and SQL',
    packageLPA: 10,
    requiredSkills: ['Python', 'SQL', 'Machine Learning'],
    allowedBranches: ['CSE', 'ECE', 'IT'],
    minCgpa: 8.5,
    maxBacklogs: 0,
    batch: 2024,
    lastDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
  });

  // Job 3: EXPIRED last date - testing expired job filtering
  const job3 = await Job.create({
    company: tcs._id,
    title: 'DevOps Intern (TCS - EXPIRED)',
    description: 'Setup CI/CD pipelines - this drive has expired',
    packageLPA: 5,
    requiredSkills: ['Docker', 'Linux', 'Git'],
    allowedBranches: ['CSE', 'ECE', 'IT', 'ME'],
    minCgpa: 6.0,
    maxBacklogs: 2,
    batch: 2024,
    lastDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days PAST
  });

  console.log('\n--- JOBS ---');
  console.log(`  Job1: "${job1.title}" (open, CSE/IT, minCGPA 6.5)`);
  console.log(`  Job2: "${job2.title}" (open, high cutoff minCGPA 8.5)`);
  console.log(`  Job3: "${job3.title}" (EXPIRED)`);

  // ───── 4. STUDENTS ─────
  // Helper to create a full student user + profile
  const createStudent = async (name, email, pwd, roll, branch, batch, cgpa, backlogs, phone, skills, consent) => {
    const user = await User.create({ name, email, password: pwd, role: 'STUDENT' });
    const student = await Student.create({
      user: user._id, rollNo: roll, branch, batch, cgpa, backlogs, phone, skills, consent,
      resumeText: `${name} is a ${branch} student skilled in ${skills.join(', ')}. Experienced in web development and software engineering.`,
    });
    return { user, student };
  };

  const s1 = await createStudent('Rahul Sharma', 'rahul@student.com', 'pass123', 'CSE001', 'CSE', 2024, 8.1, 0, '9811111111', ['Node.js', 'React', 'JavaScript', 'Python'], true);
  const s2 = await createStudent('Priya Verma', 'priya@student.com', 'pass123', 'CSE002', 'CSE', 2024, 9.1, 0, '9822222222', ['Python', 'SQL', 'Machine Learning', 'Node.js'], true);
  const s3 = await createStudent('Amit Yadav', 'amit@student.com', 'pass123', 'ECE001', 'ECE', 2024, 8.7, 0, '9833333333', ['Python', 'SQL', 'C++', 'Machine Learning'], true);
  const s4 = await createStudent('Sneha Gupta', 'sneha@student.com', 'pass123', 'IT001', 'IT', 2024, 7.2, 1, '9844444444', ['JavaScript', 'React', 'Node.js'], true);
  const s5 = await createStudent('Vikas Jain', 'vikas@student.com', 'pass123', 'ME001', 'ME', 2024, 6.8, 2, '9855555555', ['AutoCAD', 'SolidWorks'], false);  // no consent
  const s6 = await createStudent('Anjali Singh', 'anjali@student.com', 'pass123', 'CSE003', 'CSE', 2024, 6.3, 0, '9866666666', ['Java', 'C#', 'Node.js'], true); // below job1 minCGPA (6.5)
  const s7 = await createStudent('Rohit Meena', 'rohit@student.com', 'pass123', 'ECE002', 'ECE', 2024, 7.9, 1, '9877777777', ['Python', 'MATLAB', 'SQL'], true);
  const s8 = await createStudent('Kavita Patel', 'kavita@student.com', 'pass123', 'CSE004', 'CSE', 2024, 8.9, 0, '9888888888', ['Python', 'SQL', 'Machine Learning', 'React'], true);

  console.log('\n--- STUDENTS (all password: pass123) ---');
  [
    ['Rahul Sharma', 'rahul@student.com', 'CSE, CGPA 8.1, consent ✓'],
    ['Priya Verma', 'priya@student.com', 'CSE, CGPA 9.1, consent ✓'],
    ['Amit Yadav', 'amit@student.com', 'ECE, CGPA 8.7, consent ✓'],
    ['Sneha Gupta', 'sneha@student.com', 'IT, CGPA 7.2, 1 backlog, consent ✓'],
    ['Vikas Jain', 'vikas@student.com', 'ME, CGPA 6.8, NO consent'],
    ['Anjali Singh', 'anjali@student.com', 'CSE, CGPA 6.3 (below job1 cutoff), consent ✓'],
    ['Rohit Meena', 'rohit@student.com', 'ECE, CGPA 7.9, consent ✓'],
    ['Kavita Patel', 'kavita@student.com', 'CSE, CGPA 8.9, consent ✓'],
  ].forEach(([name, email, note]) => console.log(`  ${name} | ${email} | ${note}`));

  // ───── 5. APPLICATIONS (one per status) ─────
  // APPLIED: Sneha applied to job1
  await Application.create({ student: s4.user._id, job: job1._id, status: 'APPLIED', matchScore: 75 });
  // SHORTLISTED: Rahul shortlisted for job1
  await Application.create({ student: s1.user._id, job: job1._id, status: 'SHORTLISTED', matchScore: 90 });
  // SELECTED: Priya selected for job2
  await Application.create({ student: s2.user._id, job: job2._id, status: 'SELECTED', matchScore: 95 });
  // REJECTED: Rohit rejected from job2 (ECE not in CSE/ECE/IT but his CGPA was 7.9 < 8.5 cutoff)
  await Application.create({ student: s7.user._id, job: job2._id, status: 'REJECTED', matchScore: 40 });
  // APPLIED: Kavita applied to both jobs
  await Application.create({ student: s8.user._id, job: job1._id, status: 'APPLIED', matchScore: 70 });
  await Application.create({ student: s8.user._id, job: job2._id, status: 'SHORTLISTED', matchScore: 88 });
  // Amit applied to job2 (eligible with CGPA 8.7)
  await Application.create({ student: s3.user._id, job: job2._id, status: 'APPLIED', matchScore: 80 });

  console.log('\n--- APPLICATIONS ---');
  console.log('  Sneha -> TCS Software Engineer: APPLIED (75% match)');
  console.log('  Rahul -> TCS Software Engineer: SHORTLISTED (90% match)');
  console.log('  Priya -> Infosys Data Engineer: SELECTED (95% match)');
  console.log('  Rohit -> Infosys Data Engineer: REJECTED (40% match)');
  console.log('  Kavita -> TCS Software Engineer: APPLIED (70% match)');
  console.log('  Kavita -> Infosys Data Engineer: SHORTLISTED (88% match)');
  console.log('  Amit -> Infosys Data Engineer: APPLIED (80% match)');

  console.log('\n=== Seeding complete! ===\n');
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
