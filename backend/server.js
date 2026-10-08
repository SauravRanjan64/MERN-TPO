// Entry point: setup express, connect DB, start server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const routes = require('./routes');
const { User, Job } = require('./models');

const app = express();

// ---- Check required env vars ----
if (!process.env.MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is not set in environment variables.');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is not set in environment variables.');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

// ---- CORS setup ----
// Allow frontend origins (comma-separated in env) + localhost dev + deployed Vercel domain
const allowedOrigins = [
  'http://localhost:5173',
  'https://tpo-frontend-sigma.vercel.app',
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(u => u.trim().replace(/\/$/, ''))
    : [])
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (curl, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS: origin not allowed: ' + origin));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ---- Parse JSON bodies ----
app.use(express.json());

// ---- Root health check ----
app.get('/', (req, res) => res.json({ status: 'ok' }));

// ---- Mount all API routes under /api ----
app.use('/api', routes);

// ---- Global error handler (always returns JSON) ----
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// ---- Seed default data if database is empty ----
async function seedIfEmpty() {
  const count = await User.countDocuments();
  const adminExists = await User.exists({ email: 'admin@dcrust.com' });

  if (!adminExists) {
    const adminPass = await bcrypt.hash('admin123', 10);
    await User.create({
      name: 'Admin TPO', email: 'admin@dcrust.com',
      password: adminPass, role: 'ADMIN'
    });
    console.log('Default admin account created.');
  }

  if (count > 0) return; // keep existing user and job data

  console.log('Database empty — seeding default data...');

  // create a sample student
  const stuPass = await bcrypt.hash('pass123', 10);
  await User.create({
    name: 'Rahul Sharma', email: 'rahul@student.com',
    password: stuPass, role: 'STUDENT', branch: 'ECE', cgpa: 8.0
  });

  // create 2 sample jobs (lastDate = 30 days from now)
  const future = new Date();
  future.setDate(future.getDate() + 30);

  await Job.create({
    title: 'Software Engineer', companyName: 'TCS',
    description: 'Full-time SE role for freshers.',
    packageLPA: 3.5, minCgpa: 6.5, lastDate: future
  });
  await Job.create({
    title: 'Backend Developer', companyName: 'Infosys',
    description: 'Backend role with Node.js experience preferred.',
    packageLPA: 5, minCgpa: 7.0, lastDate: future
  });

  console.log('Seeding complete: admin, student, 2 jobs created.');
}

// ---- Connect to MongoDB, seed, then start server ----
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await seedIfEmpty();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
