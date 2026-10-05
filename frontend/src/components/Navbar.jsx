// Navigation bar with role-based navigation links, real-time alerts bell, and logout action
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { LayoutDashboard, Briefcase, Users, Building, FileCheck, ShieldCheck, Home, User, Menu } from 'lucide-react';

// Render navigation header with dynamic links according to active user role
const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  // Return home route according to role
  const getHomeLink = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    if (user.role === 'COMPANY') return '/company/dashboard';
    return '/student/home';
  };

  return (
    <header className="bg-primary text-white shadow-sm sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center space-x-4">
          <Link to={getHomeLink()} className="font-extrabold text-lg sm:text-xl tracking-tight">
            DCRUST Placements
          </Link>

          {/* Student navigation links */}
          {user?.role === 'STUDENT' && (
            <nav className="flex items-center space-x-1 sm:space-x-3 text-xs sm:text-sm">
              <Link to="/student/home" className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-blue-700 transition">
                <Home size={15} />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <Link to="/student/jobs" className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-blue-700 transition">
                <Briefcase size={15} />
                <span>Jobs</span>
              </Link>
              <Link to="/student/applications" className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-blue-700 transition">
                <FileCheck size={15} />
                <span>Applications</span>
              </Link>
              <Link to="/student/profile" className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-blue-700 transition">
                <User size={15} />
                <span>Profile</span>
              </Link>
            </nav>
          )}

          {/* Company navigation links */}
          {user?.role === 'COMPANY' && (
            <nav className="flex items-center space-x-1 sm:space-x-3 text-xs sm:text-sm">
              <Link to="/company/dashboard" className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-blue-700 transition">
                <Briefcase size={15} />
                <span>My Drives</span>
              </Link>
              <Link to="/company/applicants" className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-blue-700 transition">
                <Users size={15} />
                <span>Applicants</span>
              </Link>
            </nav>
          )}

          {/* Admin navigation links */}
          {user?.role === 'ADMIN' && (
            <nav className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
              <Link to="/admin/menu" className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-blue-700 transition">
                <Menu size={15} />
                <span className="hidden sm:inline">Menu</span>
              </Link>
              <Link to="/admin/dashboard" className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-blue-700 transition">
                <LayoutDashboard size={15} />
                <span className="hidden md:inline">Dashboard</span>
              </Link>
              <Link to="/admin/jobdrives" className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-blue-700 transition">
                <Briefcase size={15} />
                <span className="hidden md:inline">Drives</span>
              </Link>
              <Link to="/admin/applications" className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-blue-700 transition">
                <FileCheck size={15} />
                <span className="hidden lg:inline">Applications</span>
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {user && <NotificationBell />}
          {user && (
            <button
              onClick={logout}
              className="bg-white text-primary text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-blue-50 transition"
            >
              Sign out
            </button>
          )}
          {!user && (
            <Link
              to="/login"
              className="bg-white text-primary text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-blue-50 transition"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
