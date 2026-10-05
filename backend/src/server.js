// Server entry point for DCRUST Placement Portal backend
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const adminJobsRoutes = require('./routes/admin/jobs');
const adminCompaniesRoutes = require('./routes/admin/companies');
const adminAnalyticsRoutes = require('./routes/admin/analytics');
const adminExtrasRoutes = require('./routes/admin/extras');
const eligibilityRoutes = require('./routes/student/eligibility').router;
const applyRoutes = require('./routes/student/apply');
const studentProfileRoutes = require('./routes/student/profile');
const notificationsRoutes = require('./routes/notifications');
const companyRoutes = require('./routes/company');
const applicationsRoutes = require('./routes/applications');
const { errorHandler } = require('./middleware/errorHandler');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
});

// Make io available to routes via app.set
app.set('io', io);

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Global socket auth – read JWT from cookie, verify it, and join user room automatically
io.use((socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie || '';
  const tokenCookie = cookieHeader.split(';').find(c => c.trim().startsWith('token='));
  const token = tokenCookie ? tokenCookie.split('=')[1] : null;
  if (!token) return next(new Error('Authentication error'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    socket.userId = payload.id;
    // Automatically join the user's private room for targeted notifications
    socket.join(`user:${socket.userId}`);
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log('Socket connected for user', socket.userId);
  // No explicit join event needed; room already joined in io.use middleware.
});

// Health & Status check routes
app.get(['/', '/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    message: 'DCRUST Placement Portal API is running',
    timestamp: new Date().toISOString(),
  });
});
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminJobsRoutes);
app.use('/api/admin', adminCompaniesRoutes);
app.use('/api/admin', adminAnalyticsRoutes);
app.use('/api/admin', adminExtrasRoutes);
app.use('/api/student', eligibilityRoutes);
app.use('/api/student', applyRoutes);
app.use('/api/student', studentProfileRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Central error handler - must be last
app.use(errorHandler);

// Server error handling
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[ERROR] Port ${process.env.PORT || 5000} is already in use by another process.`);
    console.error(`Please stop the running process on port 5000 (e.g., 'npx kill-port 5000') and restart.\n`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

// Connect to DB and start server
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
