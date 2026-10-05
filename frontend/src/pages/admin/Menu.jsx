// Admin central navigation menu providing fast access to all administrative modules
import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, Building, FileCheck, ShieldCheck, ChevronRight } from 'lucide-react';

const menuItems = [
  {
    title: 'Analytics Dashboard',
    description: 'Placement statistics, branch hiring distribution, and top recruiter drives.',
    path: '/admin/dashboard',
    icon: <LayoutDashboard size={24} className="text-blue-600" />,
    badge: 'Overview',
  },
  {
    title: 'Manage Job Drives',
    description: 'Create, update, and publish campus recruitment opportunities for companies.',
    path: '/admin/jobdrives',
    icon: <Briefcase size={24} className="text-amber-600" />,
    badge: 'Recruitment',
  },
  {
    title: 'Student Directory',
    description: 'Search student records, verify academic CGPA and backlogs, and enroll students.',
    path: '/admin/students',
    icon: <Users size={24} className="text-green-600" />,
    badge: 'Students',
  },
  {
    title: 'Registered Companies',
    description: 'View corporate recruiters and register new company partner accounts.',
    path: '/admin/companies',
    icon: <Building size={24} className="text-purple-600" />,
    badge: 'Partners',
  },
  {
    title: 'Campus Applications',
    description: 'Track candidate status progression, shortlist or reject, and export CSV.',
    path: '/admin/applications',
    icon: <FileCheck size={24} className="text-indigo-600" />,
    badge: 'Workflow',
  },
  {
    title: 'System Audit Logs',
    description: 'Inspect the last 50 recorded security and operational portal events.',
    path: '/admin/audit',
    icon: <ShieldCheck size={24} className="text-red-600" />,
    badge: 'Security',
  },
];

// Admin portal navigation hub linking to all administrative views
const AdminMenu = () => {
  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Admin Control Center</h1>
        <p className="mt-1 text-sm text-gray-500">
          Select an administration section to manage campus placement operations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-primary transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg bg-gray-50 group-hover:bg-blue-50 transition">
                  {item.icon}
                </div>
                <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-bold text-gray-900 group-hover:text-primary transition">
                {item.title}
              </h2>
              <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-primary">
              <span>Open Module</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition" />
            </div>
          </Link>
        ))}
      </div>

      {/* ONE Big Primary Button */}
      <div className="pt-2">
        <Link
          to="/admin/dashboard"
          className="w-full flex items-center justify-center space-x-2 rounded-xl bg-primary py-4 px-6 text-center font-bold text-white shadow-md hover:bg-blue-700 transition"
        >
          <LayoutDashboard size={20} />
          <span>Go to Analytics Dashboard</span>
        </Link>
      </div>
    </main>
  );
};

export default AdminMenu;
