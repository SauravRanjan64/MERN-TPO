// Fixed bottom navigation bar with icons and labels for active role
import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Briefcase, FileCheck, User, Users, Menu, LayoutDashboard } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

// Render navigation item with active styling and min-44px touch target
const NavItem = ({ to, icon: Icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <NavLink
      to={to}
      className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 text-xs transition active:scale-95 ${
        isActive ? 'text-primary font-bold' : 'text-gray-500 hover:text-gray-900 font-medium'
      }`}
    >
      <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
      <span className="text-[11px] mt-0.5 leading-tight">{label}</span>
    </NavLink>
  );
};

// Render fixed bottom navigation bar tailored to user role
const BottomNav = () => {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40 px-2 py-1 shadow-md">
      <div className="mx-auto max-w-lg flex items-center justify-around">
        {user.role === 'STUDENT' && (
          <>
            <NavItem to="/student/home" icon={Home} label="Home" />
            <NavItem to="/student/jobs" icon={Briefcase} label="Jobs" />
            <NavItem to="/student/applications" icon={FileCheck} label="Applications" />
            <NavItem to="/student/profile" icon={User} label="Profile" />
          </>
        )}

        {user.role === 'COMPANY' && (
          <>
            <NavItem to="/company/dashboard" icon={Home} label="Home" />
            <NavItem to="/company/applicants" icon={Users} label="Applicants" />
          </>
        )}

        {user.role === 'ADMIN' && (
          <>
            <NavItem to="/admin/menu" icon={Menu} label="Menu" />
            <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/admin/jobdrives" icon={Briefcase} label="Drives" />
            <NavItem to="/admin/applications" icon={FileCheck} label="Apps" />
          </>
        )}
      </div>
    </nav>
  );
};

export default BottomNav;
