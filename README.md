# DCRUST Placement Portal — Full-Stack (MERN)

A beginner-friendly, production-ready MERN campus placement portal for **DCRUST (Deenbandhu Chhotu Ram University of Science and Technology)**.

- **Backend**: Node.js · Express · Mongoose · JWT (HttpOnly cookie) · Socket.IO · Zod · Multer · pdf-parse
- **Frontend**: React (Vite) · Tailwind CSS · Lucide React · React Router v6 · Axios · Socket.IO Client

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Tech Stack](#tech-stack)
3. [Setup & Installation](#setup--installation)
4. [Environment Variables](#environment-variables)
5. [Seed Credentials](#seed-credentials)
6. [Backend API Reference](#backend-api-reference)
   - [Auth Routes](#auth-routes)
   - [Student Routes](#student-routes)
   - [Company Routes](#company-routes)
   - [Application Status Flow](#application-status-flow)
   - [Admin Routes](#admin-routes)
   - [Utilities & Middleware](#utilities--middleware)
7. [Frontend Architecture](#frontend-architecture)
   - [Component Library](#component-library)
   - [Student Views](#student-views)
   - [Company Views](#company-views)
   - [Admin Views](#admin-views)
   - [Routing & Protected Routes](#routing--protected-routes)
8. [Postman API Test Checklist (10 Steps)](#postman-api-test-checklist)
9. [Frontend Manual Test Checklist (10 Steps)](#frontend-manual-test-checklist)

---

## Project Structure

```
RESUMENEW/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                    # MongoDB connection
│   │   ├── middleware/
│   │   │   ├── auth.js                  # JWT authenticate + authorize
│   │   │   ├── role.js                  # allowRoles(...) → 403 guard
│   │   │   └── errorHandler.js          # Central error handler (E11000, Zod, JWT)
│   │   ├── models/
│   │   │   ├── User.js                  # Role: ADMIN | COMPANY | STUDENT
│   │   │   ├── Student.js               # Student profile (linked to User)
│   │   │   ├── Company.js               # Company profile (linked to User)
│   │   │   ├── Job.js                   # Job drive schema
│   │   │   ├── Application.js           # Application with matchScore
│   │   │   ├── Notification.js          # In-app notifications
│   │   │   └── AuditLog.js              # Audit trail (user, action, details)
│   │   ├── routes/
│   │   │   ├── auth.js                  # /api/auth — register, login, logout, me
│   │   │   ├── applications.js          # /api/applications/:id/status
│   │   │   ├── notifications.js         # /api/notifications
│   │   │   ├── company.js               # /api/company — jobs + applicants
│   │   │   ├── admin/
│   │   │   │   ├── jobs.js              # /api/admin/jobs
│   │   │   │   ├── companies.js         # /api/admin/companies (list)
│   │   │   │   ├── analytics.js         # /api/admin/analytics
│   │   │   │   └── extras.js            # /api/admin/students|companies|applications|export|audit
│   │   │   └── student/
│   │   │       ├── profile.js           # /api/student/me|consent|jobs|applications|resume|eligibility
│   │   │       ├── eligibility.js       # /api/student/eligibility/:jobId
│   │   │       └── apply.js             # /api/student/apply/:jobId
│   │   ├── utils/
│   │   │   ├── notify.js                # Save notification + Socket.IO emit
│   │   │   ├── audit.js                 # writeAudit(userId, action, details)
│   │   │   ├── eligibility.js           # checkEligibility(student, job, alreadyApplied)
│   │   │   ├── maskPhone.js             # "9876543210" → "98******10"
│   │   │   └── resumeMatch.js           # computeMatch(resumeText, requiredSkills)
│   │   ├── seed.js                      # Full seed script with credentials printed
│   │   └── server.js                    # Express + Socket.IO entry point
│   ├── uploads/                         # Resume PDFs (gitignored)
│   ├── .gitignore
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── api.js                   # Axios instance with credentials
    │   │   ├── StatusBadge.jsx          # Visual status pill (icon + text)
    │   │   ├── JobCard.jsx              # Summary card for recruitment drives
    │   │   ├── Message.jsx              # Loading / Error with Retry / Empty
    │   │   ├── Navbar.jsx               # Header with role-specific navigation
    │   │   ├── NotificationBell.jsx     # Live bell dropdown with badge
    │   │   └── EligibilityCard.jsx      # Detailed 8-check eligibility card
    │   ├── context/
    │   │   └── AuthContext.jsx          # Session state & Socket.IO connection
    │   ├── pages/
    │   │   ├── Login.jsx                # Unified sign-in
    │   │   ├── Register.jsx             # Student-only registration
    │   │   ├── student/
    │   │   │   ├── Home.jsx             # 3 count cards + Browse Jobs CTA
    │   │   │   ├── Jobs.jsx             # Drive search + branch filter
    │   │   │   ├── JobDetail.jsx        # Eligibility + Resume match chips + Apply
    │   │   │   ├── Applications.jsx     # Track applications with live statusChanged reload
    │   │   │   └── Profile.jsx          # Academic record, contact, consent, PDF upload
    │   │   ├── company/
    │   │   │   ├── Dashboard.jsx        # Post job form + My drives list
    │   │   │   └── Applicants.jsx       # Pipeline with filters, masked phone, stage buttons
    │   │   └── admin/
    │   │       ├── Menu.jsx             # Navigation hub for admin modules
    │   │       ├── Dashboard.jsx        # Analytics charts & hiring breakdowns
    │   │       ├── JobDrives.jsx        # Drive management
    │   │       ├── Students.jsx         # Directory & enrollment
    │   │       ├── Companies.jsx        # Partner list & onboarding
    │   │       ├── Applications.jsx     # Global applications & CSV export
    │   │       └── AuditLogs.jsx        # Last 50 immutable system events
    │   ├── App.jsx                      # Router & ProtectedRoute by role
    │   ├── main.jsx                     # Vite mount
    │   └── index.css                    # Tailwind directives
    ├── vite.config.js                   # Reverse proxy for /api and /socket.io
    ├── tailwind.config.cjs              # Theme colors (primary: #2563EB)
    └── package.json
```

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Node.js, Express, MongoDB (Mongoose), JWT, Zod, Multer, pdf-parse, bcryptjs |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, React Router v6, Axios, Socket.IO Client |
| **Realtime** | Socket.IO rooms (`user:<id>`), automatic room joining in `io.use` |
| **Security** | HttpOnly Cookies, Role Authorization (403), Phone Masking, Audit Logs |

---

## Setup & Installation

### Backend
```bash
cd backend
npm install
npm run seed      # Populates test dataset and prints credentials
npm run dev       # Starts server on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev       # Starts Vite dev server on http://localhost:5173
```

---

## Environment Variables

Inside `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/dcrust
JWT_SECRET=devsecret_dcrust_key_2024
PORT=5000
FRONTEND_URL=http://localhost:5173
```

---

## Seed Credentials

The backend seeds its demo data on startup when the database is empty. If the database already contains users, it creates the demo admin only when that email is not already registered; it does not overwrite existing accounts.

### Admin
- **Email**: `admin@dcrust.com`
- **Password**: `admin123`

### Companies
- **TCS**: `tcs@company.com` / `tcs123`
- **Infosys**: `infosys@company.com` / `info123`

### Students (Password for all: `pass123`)
- `rahul@student.com` — CSE, CGPA 8.1, Consent ✓
- `priya@student.com` — CSE, CGPA 9.1, Consent ✓
- `amit@student.com` — ECE, CGPA 8.7, Consent ✓
- `sneha@student.com` — IT, CGPA 7.2, 1 backlog, Consent ✓
- `vikas@student.com` — ME, CGPA 6.8, No Consent ✗
- `anjali@student.com` — CSE, CGPA 6.3, Consent ✓
- `rohit@student.com` — ECE, CGPA 7.9, Consent ✓
- `kavita@student.com` — CSE, CGPA 8.9, Consent ✓

---

## Backend API Reference

### Auth Routes (`/api/auth`)
- `POST /register`: Always creates `STUDENT` role (ignores client body role). Creates empty `Student` doc.
- `POST /login`: Sets HttpOnly `token` cookie, logs `LOGIN` audit.
- `POST /logout`: Clears cookie.
- `GET /me`: Returns current user session.

### Student Routes (`/api/student`)
- `GET /me`: Get student academic profile.
- `PUT /me`: Update `phone` and `skills` only.
- `PUT /consent`: Update placement consent boolean.
- `GET /jobs`: Active drives where `lastDate >= now`.
- `GET /applications/my`: Student's own applications.
- `POST /resume`: Multer PDF upload (max 2 MB), extracts text via `pdf-parse`.
- `GET /eligibility/:jobId`: Evaluates 8 checks + skill matching.
- `POST /apply/:jobId`: Re-verifies eligibility, stores `matchScore`, logs `APPLIED`.

### Company Routes (`/api/company`)
- `POST /jobs`: Zod validated drive creation.
- `GET /jobs`: Company's own drives.
- `GET /jobs/:id/applicants?branch=&minCgpa=&maxBacklogs=&minMatch=`: Applicants pipeline with masked phone numbers (`98******10`).

### Application Status Flow (`PUT /api/applications/:id/status`)
- Allowed transitions:
  - `APPLIED` → `SHORTLISTED` | `REJECTED`
  - `SHORTLISTED` → `SELECTED` | `REJECTED`
- On valid transition: Saves status, emits Socket.IO `statusChanged`, sends student notification, logs `STATUS_CHANGED`.

### Admin Routes (`/api/admin`)
- `GET /students?search=&branch=`: Student directory with masked phone.
- `PUT /students/:id`: Update academic fields (`cgpa`, `backlogs`, `branch`, `batch`).
- `POST /students`: Enroll student user + profile.
- `GET /companies` & `POST /companies`: Onboard and list companies.
- `GET /applications?jobId=&status=`: Global application monitor.
- `GET /export`: Download plain CSV of applications (no external library).
- `GET /audit`: Fetch latest 50 immutable audit logs.
- `GET /analytics`: Status counts, branch selection stats, top drives.

---

## Frontend Architecture

- **Mobile-first design (360px minimum width)**.
- **ONE big primary button per page**.
- **Pure presentation**: Frontend never decides eligibility or status rules; it only displays backend results.
- **One-line comment above every function**.

### Component Library
1. `components/api.js`: Central Axios instance with `withCredentials: true`.
2. `components/StatusBadge.jsx`:
   - `APPLIED`: Blue badge with Clock icon
   - `SHORTLISTED`: Amber badge with Award icon
   - `SELECTED`: Green badge with CheckCircle icon
   - `REJECTED`: Red badge with XCircle icon
3. `components/JobCard.jsx`: Drive card with package, CGPA cutoff, branches, and deadline.
4. `components/Message.jsx`: Unified Loading, Error with Retry, and Empty state handling.

### Key Pages
- **Student Home** (`/student/home`): 3 summary cards + primary "Browse Job Drives" button.
- **Student Jobs** (`/student/jobs`): Search + branch dropdown filter.
- **Job Detail** (`/student/jobs/:id`): Eligibility criteria card alongside resume match % and green/red skill chips.
- **Applications** (`/student/applications`): Live updates via `socket.on('statusChanged')`.
- **Profile** (`/student/profile`): Read-only academic data, editable contact/skills, consent checkbox, PDF resume upload.
- **Company Dashboard** (`/company/dashboard`): Collapsible Zod-validated drive creation form + drive cards.
- **Company Applicants** (`/company/applicants`): Multi-filter pipeline, masked phone, match %, and stage transition buttons.
- **Admin Control Center** (`/admin/menu`): Fast navigation hub to Dashboard, Job Drives, Students, Companies, Applications, and Audit Logs.
- **Admin Applications** (`/admin/applications`): Stage promotion buttons + "Export Applications (CSV)".
- **Admin Audit Trail** (`/admin/audit`): Latest 50 security and operational action cards.

---

## Postman API Test Checklist

1. **POST /api/auth/register** with body `{ role: "ADMIN" }` → Expect `201` and verify role is forced to `STUDENT`.
2. **POST /api/auth/login** as `rahul@student.com` → Expect `200` with HttpOnly `token` cookie set.
3. **GET /api/student/jobs** → Expect `200` with open drives (expired drive excluded).
4. **GET /api/student/eligibility/:job1_id** → Expect `200` with 8 eligibility checks and match score details.
5. **POST /api/student/apply/:job1_id** → Expect `201` on first apply; repeat to expect `400` duplicate rejection.
6. **POST /api/student/resume** → Upload PDF file, expect `200` with extracted character length.
7. **POST /api/company/jobs** as TCS → Expect `201` with created drive attached to TCS.
8. **GET /api/company/jobs/:id/applicants** → Expect `200` with masked phones (`98******10`).
9. **PUT /api/applications/:id/status** → Test valid transition `APPLIED` → `SHORTLISTED` (`200`) and invalid transition `SHORTLISTED` → `APPLIED` (`400`).
10. **GET /api/admin/export** → Expect `200` with `text/csv` attachment.

---

## Frontend Manual Test Checklist

1. **Student Login**: Sign in with `rahul@student.com` / `pass123` → Redirects to `/student/home` showing 3 count cards.
2. **Student Profile**: Open `/student/profile`, verify read-only CGPA/backlogs/branch, update phone & skills, check consent, upload PDF resume → Verify confirmation alert.
3. **Student Browse Jobs**: Click "Browse Job Drives" on `/student/home` → Test branch filter ("CSE") and search bar on `/student/jobs`.
4. **Student Eligibility & Skill Match**: Open TCS Software Engineer drive (`/student/jobs/:id`) → Verify 8 checks in `EligibilityCard`, match %, matched skills (green chips), and missing skills (red chips).
5. **Student Apply & Tracker**: Click "Apply for this Job Drive" → Open `/student/applications` to inspect application card with `APPLIED` StatusBadge; verify live reload on `statusChanged`.
6. **Company Login**: Sign out and sign in with `tcs@company.com` / `tcs123` → Redirects to `/company/dashboard` listing TCS drives.
7. **Company Post Drive**: Click "Post New Job Drive", fill fields, submit form → Verify newly created job drive appears in the list.
8. **Company Screen Applicants**: Click "View Applicants" (`/company/applicants`), test filters (Min CGPA, Min Match %), verify masked phone (e.g. `98******10`), and click "Shortlist" button.
9. **Admin Login & Management**: Sign out and sign in with `admin@dcrust.com` / `admin123` → Open `/admin/menu`, check `/admin/students` (masked phones) and `/admin/companies` partner list.
10. **Admin Applications & Audit**: In `/admin/applications`, filter by job/status and click "Export Applications (CSV)" to download; visit `/admin/audit` to view latest 50 security and status action logs.
