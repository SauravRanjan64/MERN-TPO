import React, { useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentHome from './pages/student/Home';
import StudentJobs from './pages/student/Jobs';
import JobDetail from './pages/student/JobDetail';
import StudentApplications from './pages/student/Applications';
import StudentProfile from './pages/student/Profile';
import CompanyDashboard from './pages/company/Dashboard';
import CompanyApplicants from './pages/company/Applicants';
import AdminMenu from './pages/admin/Menu';
import AdminDashboard from './pages/admin/Dashboard';
import AdminJobDrives from './pages/admin/JobDrives';
import AdminStudents from './pages/admin/Students';
import AdminCompanies from './pages/admin/Companies';
import AdminApplications from './pages/admin/Applications';
import AdminAuditLogs from './pages/admin/AuditLogs';

// Role-based route guard that validates active authenticated session
const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : user.role === 'COMPANY' ? '/company/dashboard' : '/student/home'} replace />;
  }
  return children;
};

// Redirect root route to role dashboard or login
const RootRedirect = () => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : user.role === 'COMPANY' ? '/company/dashboard' : '/student/home'} replace />;
};

const ServerWakeBanner = () => {
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    const handleWaking = () => setWaking(true);
    const handleAwake = () => setWaking(false);
    
    window.addEventListener('server:waking', handleWaking);
    window.addEventListener('server:awake', handleAwake);
    
    return () => {
      window.removeEventListener('server:waking', handleWaking);
      window.removeEventListener('server:awake', handleAwake);
    };
  }, []);

  if (!waking) return null;
  
  return (
    <div className="bg-amber-100 text-amber-800 px-4 py-2 text-center text-sm font-medium z-50">
      Waking up server... This might take up to a minute on the free tier. Please wait.
    </div>
  );
};

// Main application component setting up router, notifications, and navigation
const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans text-base pb-16">
            <ServerWakeBanner />
            <Navbar />
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/student/home" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentHome /></ProtectedRoute>} />
                <Route path="/student/jobs" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentJobs /></ProtectedRoute>} />
                <Route path="/student/jobs/:id" element={<ProtectedRoute allowedRoles={['STUDENT']}><JobDetail /></ProtectedRoute>} />
                <Route path="/student/applications" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentApplications /></ProtectedRoute>} />
                <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentProfile /></ProtectedRoute>} />
                <Route path="/company/dashboard" element={<ProtectedRoute allowedRoles={['COMPANY']}><CompanyDashboard /></ProtectedRoute>} />
                <Route path="/company/jobs" element={<ProtectedRoute allowedRoles={['COMPANY']}><CompanyDashboard /></ProtectedRoute>} />
                <Route path="/company/applicants" element={<ProtectedRoute allowedRoles={['COMPANY']}><CompanyApplicants /></ProtectedRoute>} />
                <Route path="/admin/menu" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminMenu /></ProtectedRoute>} />
                <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/jobdrives" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminJobDrives /></ProtectedRoute>} />
                <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminStudents /></ProtectedRoute>} />
                <Route path="/admin/companies" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminCompanies /></ProtectedRoute>} />
                <Route path="/admin/applications" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminApplications /></ProtectedRoute>} />
                <Route path="/admin/audit" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminAuditLogs /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <BottomNav />
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
