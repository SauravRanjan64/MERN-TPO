// Student view: resume management + available jobs + my applications
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import Button from '../components/Button';
import useDebounce from '../hooks/useDebounce';
import { getDeadlineInfo, getEligibility } from '../utils/jobStatus';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const fileInputRef = useRef(null);

  // Search and filter states
  const [companySearch, setCompanySearch] = useState('');
  const [minPackageInput, setMinPackageInput] = useState('');
  const [eligibleOnly, setEligibleOnly] = useState(false);

  // Debounce the text inputs (~400ms delay)
  const debouncedCompany = useDebounce(companySearch, 400);
  const debouncedMinPackage = useDebounce(minPackageInput, 400);

  // Fetch applications and resume once on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch initial profile & application records
  async function fetchInitialData() {
    setLoading(true);
    try {
      const [appsRes, resumeRes] = await Promise.all([
        api.get('/api/applications/my'),
        api.get('/api/resume/my')
      ]);
      setMyApps(appsRes.data);
      setResume(resumeRes.data);
    } catch (err) {
      toast.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

  // Fetch jobs with filters applied
  const fetchJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const params = {};
      if (debouncedCompany.trim()) {
        params.company = debouncedCompany.trim();
      }
      if (debouncedMinPackage !== '') {
        const pkg = Number(debouncedMinPackage);
        if (!isNaN(pkg) && pkg >= 0) {
          params.minPackage = pkg;
        }
      }
      if (eligibleOnly) {
        params.eligible = 'true';
      }

      const res = await api.get('/api/jobs', { params });
      setJobs(res.data);
    } catch (err) {
      toast.error('Failed to fetch jobs.');
    } finally {
      setJobsLoading(false);
    }
  }, [debouncedCompany, debouncedMinPackage, eligibleOnly, toast]);

  // Refetch jobs whenever any debounced filter changes
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Clear all filters back to defaults
  const handleClearFilters = () => {
    setCompanySearch('');
    setMinPackageInput('');
    setEligibleOnly(false);
  };

  // Handle resume file upload
  async function handleResumeUpload(e) {
    e.preventDefault();

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('Please select a PDF file to upload.');
      return;
    }

    // Client-side checks
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are allowed.');
      return;
    }
    if (file.size > 1024 * 1024) {
      toast.error('Resume must be under 1 MB.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    setUploading(true);
    try {
      const res = await api.post('/api/resume', formData);
      setResume(res.data);
      toast.success('Resume uploaded successfully!');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload resume.');
    } finally {
      setUploading(false);
    }
  }

  // Open and view own resume PDF in new tab
  async function handleViewResume(resumeId) {
    try {
      const res = await api.get(`/api/resumes/${resumeId}/file`, { responseType: 'blob' });
      const fileURL = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(fileURL, '_blank');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to open resume.');
    }
  }

  // Apply to a job
  async function handleApply(jobId) {
    setApplyingJobId(jobId);
    try {
      await api.post(`/api/jobs/${jobId}/apply`);
      toast.success('Applied successfully!');
      // refresh both applications and job list
      const [appsRes] = await Promise.all([
        api.get('/api/applications/my'),
        fetchJobs()
      ]);
      setMyApps(appsRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply.');
    } finally {
      setApplyingJobId(null);
    }
  }

  // Check if student already applied to this job
  function alreadyApplied(jobId) {
    return myApps.some(app => app.job && app.job._id === jobId);
  }

  if (loading) return <p className="center">Loading...</p>;

  return (
    <div>
      {/* My Resume Section */}
      <h2>My Resume</h2>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        {resume ? (
          <div>
            <p><strong>File:</strong> {resume.filename}</p>
            <p><strong>Size:</strong> {(resume.size / 1024).toFixed(1)} KB</p>
            <p>
              <strong>Status:</strong>{' '}
              <span className={`badge badge-${resume.status.toLowerCase()}`}>{resume.status}</span>
            </p>
            {resume.remarks && (
              <p><strong>Admin Remarks:</strong> {resume.remarks}</p>
            )}
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => handleViewResume(resume._id)}
              >
                View Resume
              </button>
            </div>
          </div>
        ) : (
          <p>No resume uploaded yet. Please upload a PDF resume (max 1 MB) to apply for jobs.</p>
        )}

        <form onSubmit={handleResumeUpload} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            required
          />
          <Button
            type="submit"
            className="btn btn-primary btn-sm"
            loading={uploading}
            loadingText="Uploading..."
          >
            {resume ? 'Re-upload Resume' : 'Upload Resume'}
          </Button>
        </form>
        <p className="hint" style={{ marginTop: '0.5rem', textAlign: 'left' }}>
          Note: Max file size is 1 MB. Re-uploading resets review status to PENDING.
        </p>
      </div>

      <h2>Available Jobs</h2>

      {/* Filter and Search Bar */}
      <div className="card filter-bar">
        <div className="filter-item">
          <label>Search Company</label>
          <input
            type="text"
            placeholder="e.g. Google, TCS"
            value={companySearch}
            onChange={(e) => setCompanySearch(e.target.value)}
          />
        </div>

        <div className="filter-item">
          <label>Min Package (LPA)</label>
          <input
            type="number"
            min="0"
            step="0.5"
            placeholder="e.g. 6"
            value={minPackageInput}
            onChange={(e) => setMinPackageInput(e.target.value)}
          />
        </div>

        <div className="filter-checkbox-item">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={eligibleOnly}
              onChange={(e) => setEligibleOnly(e.target.checked)}
            />
            Eligible for my CGPA
          </label>
        </div>

        <div className="filter-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleClearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {jobsLoading ? (
        <p className="center">Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <p className="no-data-msg">No jobs match your search or filters.</p>
      ) : (
        <div className="card-grid">
          {jobs.map(job => {
            const deadline = getDeadlineInfo(job.lastDate);
            const eligibility = getEligibility(user, job);
            const isApplied = alreadyApplied(job._id);
            const cannotApply = isApplied || deadline.isExpired || !eligibility.eligible;

            return (
              <div key={job._id} className="card job-card">
                <div className="job-card-header">
                  <h3>{job.title}</h3>
                  <div className="pill-group">
                    <span className={`pill pill-${deadline.color}`}>
                      {deadline.label}
                    </span>
                    <span className={`pill pill-${eligibility.color}`}>
                      {eligibility.label}
                    </span>
                  </div>
                </div>

                <p><strong>Company:</strong> {job.companyName}</p>
                <p><strong>Package:</strong> {job.packageLPA} LPA</p>
                <p><strong>Min CGPA:</strong> {job.minCgpa}</p>
                <p><strong>Last Date:</strong> {new Date(job.lastDate).toLocaleDateString()}</p>
                {job.description && <p>{job.description}</p>}

                <div className="job-card-actions">
                  {isApplied ? (
                    <button className="btn btn-sm" disabled>Already Applied</button>
                  ) : deadline.isExpired ? (
                    <button className="btn btn-sm btn-disabled" disabled title="Deadline has passed">
                      Deadline Passed
                    </button>
                  ) : !eligibility.eligible ? (
                    <button className="btn btn-sm btn-disabled" disabled title="CGPA requirement not met">
                      Not Eligible
                    </button>
                  ) : (
                    <Button
                      className="btn btn-primary btn-sm"
                      loading={applyingJobId === job._id}
                      loadingText="Applying..."
                      onClick={() => handleApply(job._id)}
                    >
                      Apply
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h2 style={{ marginTop: '2rem' }}>My Applications</h2>
      {myApps.length === 0 ? <p>You haven't applied to any jobs yet.</p> : (
        <table className="data-table">
          <thead>
            <tr><th>Job</th><th>Company</th><th>Status</th><th>Applied On</th></tr>
          </thead>
          <tbody>
            {myApps.map(app => (
              <tr key={app._id}>
                <td>{app.job?.title || 'N/A'}</td>
                <td>{app.job?.companyName || 'N/A'}</td>
                <td><span className={`badge badge-${app.status.toLowerCase()}`}>{app.status}</span></td>
                <td>{new Date(app.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

