// Server entry point for DCRUST Placement Portal backend
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');

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
const mongoose = require('mongoose');

dotenv.config();

// Build an allow-list from FRONTEND_URL (comma-separated) + localhost fallback
const allowedOrigins = [
  ...(process.env.FRONTEND_URL || '')
    .split(',')
    .map((u) => u.trim().replace(/\/+$/, ''))
    .filter(Boolean),
  'http://localhost:5173',
  'http://localhost:3000',
];
const vercelPreviewRegex = process.env.VERCEL_PREVIEW_REGEX ? new RegExp(process.env.VERCEL_PREVIEW_REGEX) : null;

// Shared CORS handler used by both Express and Socket.IO
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    
    // Normalize origin by removing trailing slash
    const normalizedOrigin = origin.replace(/\/+$/, '');
    
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    if (vercelPreviewRegex && vercelPreviewRegex.test(normalizedOrigin)) {
      return callback(null, true);
    }
    callback(new Error('NotAllowedByCORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
};

const app = express();
app.set('trust proxy', 1); // for Render

// Collapse repeated slashes in req.url to fix //api/auth/login 404s
app.use((req, res, next) => {
  req.url = req.url.replace(/\/\/+/g, '/');
  next();
});

// Middleware
app.use(helmet());
app.use(mongoSanitize());

// CORS config
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Clean 403 for CORS errors instead of 500
app.use((err, req, res, next) => {
  if (err.message === 'NotAllowedByCORS') {
    return res.status(403).json({ message: 'CORS: Origin not allowed' });
  }
  next(err);
});

app.use(express.json());
app.use(cookieParser());

const server = http.createServer(app);
const io = socketIo(server, { 
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Make io available to routes via app.set
app.set('io', io);

// Global socket auth
io.use((socket, next) => {
  if (!process.env.JWT_SECRET) {
    return next(new Error('Server configuration error: Missing JWT_SECRET'));
  }
  
  let token = socket.handshake.auth?.token;
  if (!token && socket.handshake.headers.cookie) {
    const cookies = cookie.parse(socket.handshake.headers.cookie);
    token = cookies.token;
  }
  
  if (!token) {
    console.warn('Socket connect failed: No token provided');
    return next(new Error('Authentication error'));
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.id;
    socket.role = payload.role || 'USER'; // Default role if missing
    socket.join(`user:${socket.userId}`);
    if (socket.role) {
      socket.join(`role:${socket.role}`);
    }
    next();
  } catch (err) {
    console.warn('Socket connect failed: Invalid token');
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`Socket connected for user ${socket.userId}`);
  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected for user ${socket.userId}, reason: ${reason}`);
  });
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

// Crash on startup if JWT_SECRET is missing in production
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in production.');
  process.exit(1);
}

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
let serverInstance;
connectDB().then(async () => {
  if (process.env.AUTO_SEED === 'true') {
    const { runSeed } = require('./seed');
    console.log('AUTO_SEED is true, checking if seeding is needed...');
    await runSeed(false);
  }
  
  const PORT = process.env.PORT || 5000;
  serverInstance = server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('Received kill signal, shutting down gracefully');
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('Closed out remaining connections');
      mongoose.connection.close(false).then(() => {
        console.log('MongoDb connection closed.');
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
