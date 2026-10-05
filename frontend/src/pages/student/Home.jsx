// Student home dashboard with stats links, profile completion banner, and closing drives
import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, FileCheck, Award, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import api from '../../components/api';
import { AuthContext } from '../../context/AuthContext';
import { Skeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';

// Render student overview metrics, action banner, and urgent job opportunities
const StudentHome = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [data, setData] = useState({ jobs: [], apps: [], profile: null });
  const [loading, setLoading] = useState(true);

  // Load metrics, candidate profile completeness, and job drives
  const loadDashboard = async () => {
    try {
      const [jobsRes, appsRes, meRes] = await Promise.all([
        api.get('/api/student/jobs'),
        api.get('/api/student/applications/my'),
        api.get('/api/student/me').catch(() => ({ data: { student: null } })),
      ]);
      setData({ jobs: jobsRes.data || [], apps: appsRes.data || [], profile: meRes.data?.student });
    } catch {
      showToast('Failed to load dashboard.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  const shortlisted = data.apps.filter((a) => ['SHORTLISTED', 'SELECTED'].includes(a.status)).length;
  const isProfileIncomplete = data.profile && (!data.profile.phone || !data.profile.skills?.length || !data.profile.resumeText || !data.profile.consent);
  const closingSoon = data.jobs.filter((j) => j.lastDate && new Date(j.lastDate) - new Date() <= 3 * 86400000 && new Date(j.lastDate) >= new Date());

  if (loading) return <div className="p-4 max-w-3xl mx-auto space-y-4"><Skeleton className="h-28 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-32 w-full" /></div>;

  return (
    <main className="mx-auto max-w-3xl p-4 pb-20 space-y-4">
      <div className="bg-primary text-white p-5 rounded-2xl shadow space-y-1">
        <h1 className="text-xl sm:text-2xl font-extrabold">Welcome back, {user?.name || 'Student'}!</h1>
        <p className="text-xs text-blue-100">Track recruitments and verify your placement eligibility.</p>
      </div>

      {isProfileIncomplete && (
        <div className="flex items-center justify-between p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
          <div className="flex items-center space-x-2 mr-2">
            <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
            <span className="font-semibold">Complete your profile (phone, skills, resume) to unlock eligibility.</span>
          </div>
          <Link to="/student/profile" className="min-h-[44px] px-3 py-1.5 bg-amber-600 text-white rounded-lg font-bold flex items-center flex-shrink-0 active:scale-95 transition">
            Fix <ChevronRight size={14} />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Link to="/student/jobs" className="bg-white p-3 rounded-xl border shadow-sm text-center active:scale-95 transition min-h-[44px]">
          <Briefcase size={18} className="mx-auto text-primary mb-1" />
          <span className="text-lg font-extrabold block text-gray-900">{data.jobs.length}</span>
          <span className="text-[11px] text-gray-500 font-medium">Jobs</span>
        </Link>
        <Link to="/student/applications" className="bg-white p-3 rounded-xl border shadow-sm text-center active:scale-95 transition min-h-[44px]">
          <FileCheck size={18} className="mx-auto text-amber-600 mb-1" />
          <span className="text-lg font-extrabold block text-gray-900">{data.apps.length}</span>
          <span className="text-[11px] text-gray-500 font-medium">Applied</span>
        </Link>
        <Link to="/student/applications" className="bg-white p-3 rounded-xl border shadow-sm text-center active:scale-95 transition min-h-[44px]">
          <Award size={18} className="mx-auto text-green-600 mb-1" />
          <span className="text-lg font-extrabold block text-gray-900">{shortlisted}</span>
          <span className="text-[11px] text-gray-500 font-medium">Shortlisted</span>
        </Link>
      </div>

      {closingSoon.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900 flex items-center">
            <Clock size={15} className="mr-1 text-red-500" /> Closing Soon (≤ 3 Days)
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {closingSoon.map((j) => (
              <Link key={j._id} to={`/student/jobs/${j._id}`} className="min-w-[220px] bg-white p-3.5 rounded-xl border border-red-200 shadow-sm flex-shrink-0 active:scale-95 transition space-y-1">
                <span className="text-[10px] font-bold text-primary uppercase">{j.companyName}</span>
                <h3 className="text-xs font-bold text-gray-900 truncate">{j.title}</h3>
                <span className="text-[11px] text-red-600 block font-semibold">Ends: {new Date(j.lastDate).toLocaleDateString()}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Link to="/student/jobs" className="w-full min-h-[48px] flex items-center justify-center rounded-xl bg-primary py-3 px-4 font-bold text-white shadow active:scale-95 transition">
        Browse All Job Drives
      </Link>
    </main>
  );
};

export default StudentHome;
