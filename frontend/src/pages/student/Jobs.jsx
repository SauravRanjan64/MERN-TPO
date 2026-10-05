// Student job directory with horizontal scrolling branch filter chips and search
import React, { useEffect, useState } from 'react';
import { Search, Briefcase } from 'lucide-react';
import api from '../../components/api';
import JobCard from '../../components/JobCard';
import { SkeletonCard } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';

const branches = ['ALL', 'CSE', 'ECE', 'IT', 'ME', 'EE', 'CE'];

// Render searchable jobs catalogue with interactive branch filter tags
const StudentJobs = () => {
  const { showToast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Load all campus recruitment drives from backend
  const fetchJobs = async () => {
    try {
      const res = await api.get('/api/student/jobs');
      setJobs(res.data || []);
    } catch {
      showToast('Unable to load jobs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  // Filter jobs dynamically by keyword and targeted academic branch
  const filtered = jobs.filter((j) => {
    const matchSearch = (j.title || '').toLowerCase().includes(search.toLowerCase()) || (j.companyName || '').toLowerCase().includes(search.toLowerCase());
    const matchBranch = branch === 'ALL' || !j.allowedBranches?.length || j.allowedBranches.some((b) => b.toUpperCase() === branch);
    return matchSearch && matchBranch;
  });

  return (
    <main className="mx-auto max-w-3xl p-4 pb-20 space-y-4">
      <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">Campus Drives</h1>
      
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by role or company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full min-h-[44px] rounded-xl border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-primary focus:outline-none bg-white shadow-sm"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {branches.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => setBranch(b)}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap active:scale-95 transition ${
              branch === b ? 'bg-primary text-white shadow' : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            {b === 'ALL' ? 'All Branches' : b}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonCard count={3} />
      ) : filtered.length === 0 ? (
        <div className="bg-white p-6 rounded-2xl border text-center space-y-2">
          <Briefcase className="mx-auto text-gray-400" size={32} />
          <p className="text-sm text-gray-600 font-medium">No job drives match your filter criteria.</p>
          {(search || branch !== 'ALL') && (
            <button
              type="button"
              onClick={() => { setSearch(''); setBranch('ALL'); }}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-gray-100 text-xs font-bold text-gray-800 active:scale-95 transition"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => <JobCard key={job._id} job={job} />)}
        </div>
      )}
    </main>
  );
};

export default StudentJobs;
