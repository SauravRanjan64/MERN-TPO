// Company dashboard allowing recruitment drive creation and viewing active drives
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Briefcase, Users, ChevronDown, ChevronUp, DollarSign, Calendar } from 'lucide-react';
import api from '../../components/api';
import Message from '../../components/Message';

const emptyJobForm = {
  title: '',
  description: '',
  packageLPA: '',
  minCgpa: '',
  maxBacklogs: '',
  batch: '',
  allowedBranches: '',
  requiredSkills: '',
  lastDate: '',
};

// Main company interface to publish new job drives and inspect applicant pipelines
const CompanyDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(emptyJobForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // Fetch all jobs published by the authenticated company
  const fetchMyJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/company/jobs');
      setJobs(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load company jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyJobs();
  }, []);

  // Update form state fields dynamically
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submit new job drive to backend with Zod validation handling
  const handlePostJob = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setNotice('');

    const payload = {
      title: form.title,
      description: form.description || undefined,
      packageLPA: form.packageLPA ? Number(form.packageLPA) : undefined,
      minCgpa: form.minCgpa ? Number(form.minCgpa) : undefined,
      maxBacklogs: form.maxBacklogs ? Number(form.maxBacklogs) : undefined,
      batch: form.batch ? Number(form.batch) : undefined,
      allowedBranches: form.allowedBranches
        ? form.allowedBranches.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined,
      requiredSkills: form.requiredSkills
        ? form.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined,
      lastDate: form.lastDate || undefined,
    };

    try {
      await api.post('/api/company/jobs', payload);
      setNotice('Job drive posted successfully!');
      setForm(emptyJobForm);
      setIsFormOpen(false);
      fetchMyJobs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post job drive.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Company Portal</h1>
          <p className="mt-1 text-sm text-gray-500">
            Post campus recruitment drives and manage shortlisted candidates.
          </p>
        </div>
      </div>

      {notice && (
        <div className="rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-800 border border-green-200">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {/* Collapsible Post New Job Form */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="w-full flex items-center justify-between p-5 text-left font-bold text-gray-900 bg-gray-50 hover:bg-gray-100 transition"
        >
          <span className="flex items-center space-x-2 text-base">
            <Plus size={18} className="text-primary" />
            <span>Post New Job Drive</span>
          </span>
          {isFormOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {isFormOpen && (
          <form onSubmit={handlePostJob} className="p-5 space-y-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Associate Software Engineer"
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Package (LPA)
                </label>
                <input
                  type="number"
                  step="any"
                  name="packageLPA"
                  value={form.packageLPA}
                  onChange={handleChange}
                  placeholder="e.g. 8.5"
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="3"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Role responsibilities and expectations…"
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Min CGPA
                </label>
                <input
                  type="number"
                  step="any"
                  name="minCgpa"
                  value={form.minCgpa}
                  onChange={handleChange}
                  placeholder="e.g. 7.0"
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Max Active Backlogs
                </label>
                <input
                  type="number"
                  name="maxBacklogs"
                  value={form.maxBacklogs}
                  onChange={handleChange}
                  placeholder="e.g. 0"
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Target Graduation Batch
                </label>
                <input
                  type="number"
                  name="batch"
                  value={form.batch}
                  onChange={handleChange}
                  placeholder="e.g. 2024"
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Application Deadline
                </label>
                <input
                  type="date"
                  name="lastDate"
                  value={form.lastDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Allowed Branches (comma-separated)
                </label>
                <input
                  type="text"
                  name="allowedBranches"
                  value={form.allowedBranches}
                  onChange={handleChange}
                  placeholder="e.g. CSE, IT, ECE"
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Required Skills (comma-separated, used for resume matching)
                </label>
                <input
                  type="text"
                  name="requiredSkills"
                  value={form.requiredSkills}
                  onChange={handleChange}
                  placeholder="e.g. React, Node.js, Python, SQL"
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-primary py-3.5 px-4 font-bold text-white shadow hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {submitting ? 'Publishing Drive…' : 'Publish Job Drive'}
            </button>
          </form>
        )}
      </section>

      {/* Jobs List */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <Briefcase size={20} className="text-primary" />
          <span>My Posted Job Drives ({jobs.length})</span>
        </h2>

        {loading ? (
          <Message type="loading" message="Loading your recruitment drives…" />
        ) : jobs.length === 0 ? (
          <Message
            type="empty"
            title="No Drives Posted Yet"
            message="Click 'Post New Job Drive' above to start receiving campus applications."
          />
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                    {job.packageLPA != null && (
                      <span className="text-xs font-semibold text-primary">{job.packageLPA} LPA</span>
                    )}
                  </div>
                  <Link
                    to={`/company/applicants?jobId=${job._id}`}
                    className="inline-flex items-center space-x-1 px-4 py-2 rounded-lg bg-blue-50 text-primary hover:bg-blue-100 text-xs font-bold transition"
                  >
                    <Users size={16} />
                    <span>View Applicants</span>
                  </Link>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-gray-500 pt-2 border-t border-gray-100">
                  {job.minCgpa != null && <span>Min CGPA: {job.minCgpa}</span>}
                  {job.batch && <span>Batch: {job.batch}</span>}
                  {job.lastDate && (
                    <span>Deadline: {new Date(job.lastDate).toLocaleDateString()}</span>
                  )}
                  {job.requiredSkills && job.requiredSkills.length > 0 && (
                    <span>Skills: {job.requiredSkills.join(', ')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Big Primary Action Button when form is closed */}
      {!isFormOpen && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="w-full flex items-center justify-center space-x-2 rounded-xl bg-primary py-4 px-6 text-center font-bold text-white shadow-md hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            <span>Create New Job Drive</span>
          </button>
        </div>
      )}
    </main>
  );
};

export default CompanyDashboard;
