// Main app: routing, navbar, protected routes
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';

// ProtectedRoute: only allows logged-in users with the right role
function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center">Loading...</p>;
  if (!user) return <Navigate to="/login" />;
  // wrong role -> go to correct dashboard
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/student'} />;
  }
  return children;
}

// Navbar shown when logged in
function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">DCRUST Placement Portal</Link>
      <div className="nav-right">
        <span className="nav-user">{user.name} ({user.role})</span>
        <button onClick={handleLogout} className="btn btn-sm">Logout</button>
      </div>
    </nav>
  );
}

// Home: redirect based on role
function Home() {
  const { user, loading } = useAuth();
  if (loading) return <p className="center">Loading...</p>;
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/student'} />;
}

function AppContent() {
  return (
    <>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/student" element={
            <ProtectedRoute role="STUDENT"><StudentDashboard /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>
          } />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
