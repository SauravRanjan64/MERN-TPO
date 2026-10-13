# DCRUST Placement Portal

A MERN stack campus recruitment portal built for Deenbandhu Chhotu Ram University of Science and Technology (DCRUST). Enables students to build profiles, upload PDF resumes, and apply to eligible campus drives, while training & placement officers (admins) manage recruitment drives, track student applications, review resumes, analyze statistics, and export reports.

---

## Features

### Student
- **Authentication & Security**: Register with academic details, secure login, change password, and forgot password via email reset link.
- **Profile Management**: Update branch, CGPA, phone number, and skills.
- **PDF Resume Upload**: Upload single-page PDF resumes (validated under 1 MB and verified with `%PDF-` file magic header).
- **Job Drives & Eligibility**: Browse recruitment drives with real-time eligibility checks (CGPA cutoff verification and deadline status).
- **Application Tracking**: One-click apply for eligible jobs and monitor application status (`APPLIED`, `SHORTLISTED`, `SELECTED`, `REJECTED`).

### Admin (TPO)
- **Drive Management**: Create, view, search, and delete job openings with package (LPA), minimum CGPA criteria, and deadlines.
- **Student Directory**: Searchable, paginated directory of registered students with academic performance and contact details.
- **Application Pipeline**: Paginated list of applications filtered by job, status, or student keyword; update applicant status with automatic email notification.
- **Resume Verification**: Review uploaded student resumes (inline PDF preview) and approve or reject with remarks.
- **Analytics & Export**: Placement metrics (total students, jobs, placed count, status breakdown, applications per company chart) and filtered CSV export.

---

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JWT, Bcrypt.js, Multer, Nodemailer
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Axios

---

## Project Structure

```
RESUMENEW/
├── backend/
│   ├── mailer.js         # Nodemailer SMTP setup for password resets & notifications
│   ├── middleware.js     # JWT verification (protect) & admin role guard (onlyAdmin)
│   ├── models.js         # Mongoose schemas: User, Job, Application, Resume
│   ├── routes.js         # Central Express router for all API endpoints
│   ├── server.js         # Express app entry point, MongoDB connection & seed logic
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # UI components: Button, Pagination
│   │   ├── hooks/        # useDebounce, usePaginatedFetch
│   │   ├── pages/        # Login, Register, ForgotPassword, ResetPassword, Dashboards
│   │   │   └── admin/    # OverviewTab, JobsTab, StudentsTab, ApplicationsTab
│   │   ├── utils/        # jobStatus deadline calculation and eligibility helpers
│   │   ├── api.js        # Axios instance configured with base URL and JWT interceptor
│   │   ├── App.jsx       # Client router and protected routes
│   │   ├── AuthContext.jsx # Auth state management & token storage
│   │   └── ToastContext.jsx # Global toast feedback notifications
│   ├── vercel.json       # SPA routing rewrite for Vercel deployment
│   ├── vite.config.js    # Vite configuration
│   └── package.json
└── README.md
```

---

## Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
# Configure backend/.env (see table below)
npm start
# Server runs on http://localhost:5000 (auto-seeds default admin & sample data if empty)
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

---

## Demo Credentials

The backend automatically creates default demo accounts on first run:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| **Admin** | `admin@dcrust.com` | `admin123` | Full TPO administrative access |
| **Student** | `rahul@student.com` | `pass123` | Sample student (ECE, 8.0 CGPA) |

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Example / Default |
|----------|-------------|-------------------|
| `PORT` | Backend port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/dcrust` |
| `JWT_SECRET` | Secret key for signing tokens | `your_secret_key_here` |
| `FRONTEND_URL` | Allowed CORS origins (comma-separated) | `http://localhost:5173` |
| `APP_URL` | Base URL used in password reset links | `http://localhost:5173` |
| `SMTP_HOST` | *(Optional)* SMTP host for emails | `smtp.gmail.com` |
| `SMTP_PORT` | *(Optional)* SMTP port | `587` |
| `SMTP_USER` | *(Optional)* SMTP username/email | `tpo@dcrust.ac.in` |
| `SMTP_PASS` | *(Optional)* SMTP password / app key | `app_password` |

### Frontend (`frontend/.env` / `frontend/.env.production`)
| Variable | Description | Example / Default |
|----------|-------------|-------------------|
| `VITE_API_URL` | Base URL of backend API | `http://localhost:5000` |

---

## API Overview

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| `POST` | `/api/auth/register` | Public | Student account registration |
| `POST` | `/api/auth/login` | Public | Login and receive JWT |
| `GET` | `/api/auth/me` | Protected | Get current user session |
| `PUT` | `/api/auth/password` | Protected | Change account password |
| `POST` | `/api/auth/forgot-password` | Public | Send password reset token email |
| `POST` | `/api/auth/reset-password/:token` | Public | Set new password with token |
| `PUT` | `/api/profile` | Student | Update student profile |
| `GET` | `/api/jobs` | Protected | List active jobs with search/eligibility filters |
| `POST` | `/api/jobs` | Admin | Create new job recruitment drive |
| `DELETE` | `/api/jobs/:id` | Admin | Delete a job and associated applications |
| `POST` | `/api/jobs/:id/apply` | Student | Apply to a job drive |
| `GET` | `/api/applications/my` | Student | View current student's applications |
| `PUT` | `/api/applications/:id/status` | Admin | Update student application status |
| `POST` | `/api/resume` | Student | Upload PDF resume (max 1 MB) |
| `GET` | `/api/resume/my` | Student | Fetch student resume details |
| `GET` | `/api/resumes` | Admin | List student resumes |
| `GET` | `/api/resumes/:id/file` | Admin/Owner | View/download resume PDF |
| `PUT` | `/api/resumes/:id/review` | Admin | Approve or reject resume |
| `GET` | `/api/admin/jobs` | Admin | Paginated jobs list with search |
| `GET` | `/api/admin/students` | Admin | Paginated students list with search |
| `GET` | `/api/admin/applications` | Admin | Paginated applications list with filters |
| `GET` | `/api/admin/stats` | Admin | Aggregate placement metrics & company chart |
| `GET` | `/api/admin/export/applications` | Admin | Export filtered applications as CSV |

---

## How It Works (Interview Explanation)

1. **Authentication (JWT)**: On login, the server verifies hashed passwords with bcrypt and returns a signed JSON Web Token (JWT) containing the user ID, which the frontend stores and automatically attaches via Axios request interceptors to authenticate subsequent requests.
2. **Applying Rules & Verification**: Before a student can apply to any job drive, the backend strictly verifies that the application deadline has not passed, that the student's CGPA meets or exceeds the minimum cutoff, and that the student has an approved resume uploaded to the portal.
3. **Forgot Password Flow**: Requesting a reset generates a cryptographically secure 32-byte hex token, stores a SHA-256 hash with a 1-hour expiration timestamp in MongoDB, and triggers an unawaited email link to prevent user enumeration timing leaks while always returning a constant response.
4. **Dashboard Aggregation Chart**: The admin overview uses a multi-stage MongoDB Aggregation Pipeline (`$lookup`, `$unwind`, `$group`, `$sort`, `$limit`, and `$project`) to count applications across companies directly on the database engine for clean frontend visualization.
5. **Pagination and Search**: Admin tables utilize reusable server-side query helpers (`getPageParams` and `buildApplicationFilter`) to compute skip offsets, validate limits, safely escape regex search patterns, and handle cross-collection filtering efficiently.
6. **CSV Export Security**: The CSV export formats applicant records on the fly, prepends a UTF-8 Byte Order Mark (BOM) for compatibility with Microsoft Excel, and prefixes sensitive symbols (`=`, `+`, `-`, `@`) with an apostrophe to guard against CSV/spreadsheet formula injection attacks.
