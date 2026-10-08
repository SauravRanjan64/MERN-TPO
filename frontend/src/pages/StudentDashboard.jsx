// Student view: resume management + available jobs + my applications
import { useState, useEffect, useRef } from 'react';
import api from '../api';

export default function StudentDashboard() {
  const [jobs, setJobs] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyMsg, setApplyMsg] = useState('');    // success or error message after apply
  const [resumeMsg, setResumeMsg] = useState('');  // success or error message for resume actions
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch jobs, applications, and current resume on mount
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [jobsRes, appsRes, resumeRes] = await Promise.all([
        api.get('/api/jobs'),
        api.get('/api/applications/my'),
        api.get('/api/resume/my')
      ]);
      setJobs(jobsRes.data);
      setMyApps(appsRes.data);
      setResume(resumeRes.data);
    } catch (err) {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

  // Handle resume file upload
  async function handleResumeUpload(e) {
    e.preventDefault();
    setResumeMsg('');

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setResumeMsg('Please select a PDF file to upload.');
      return;
    }

    // Client-side checks
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setResumeMsg('Only PDF files are allowed.');
      return;
    }
    if (file.size > 1024 * 1024) {
      setResumeMsg('Resume must be under 1 MB.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    setUploading(true);
    try {
      const res = await api.post('/api/resume', formData);
      setResume(res.data);
      setResumeMsg('Resume uploaded successfully!');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setResumeMsg(err.response?.data?.message || 'Failed to upload resume.');
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
      setResumeMsg(err.response?.data?.message || 'Failed to open resume.');
    }
  }

  // Apply to a job
  async function handleApply(jobId) {
    setApplyMsg('');
    try {
      await api.post(`/api/jobs/${jobId}/apply`);
      setApplyMsg('Applied successfully!');
      fetchData(); // refresh lists
    } catch (err) {
      setApplyMsg(err.response?.data?.message || 'Failed to apply.');
    }
  }

  // Check if student already applied to this job
  function alreadyApplied(jobId) {
    return myApps.some(app => app.job && app.job._id === jobId);
  }

  if (loading) return <p className="center">Loading dashboard...</p>;
  if (error) return <p className="error-msg center">{error}</p>;

  return (
    <div>
      {/* My Resume Section */}
      <h2>My Resume</h2>
      {resumeMsg && (
        <p className={resumeMsg.toLowerCase().includes('success') ? 'success-msg' : 'error-msg'}>
          {resumeMsg}
        </p>
      )}

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
          <button type="submit" className="btn btn-primary btn-sm" disabled={uploading}>
            {uploading ? 'Uploading...' : (resume ? 'Re-upload Resume' : 'Upload Resume')}
          </button>
        </form>
        <p className="hint" style={{ marginTop: '0.5rem', textAlign: 'left' }}>
          Note: Max file size is 1 MB. Re-uploading resets review status to PENDING.
        </p>
      </div>

      <h2>Available Jobs</h2>
      {applyMsg && (
        <p className={applyMsg.toLowerCase().includes('success') ? 'success-msg' : 'error-msg'}>
          {applyMsg}
        </p>
      )}

      {jobs.length === 0 ? <p>No jobs posted yet.</p> : (
        <div className="card-grid">
          {jobs.map(job => (
            <div key={job._id} className="card">
              <h3>{job.title}</h3>
              <p><strong>Company:</strong> {job.companyName}</p>
              <p><strong>Package:</strong> {job.packageLPA} LPA</p>
              <p><strong>Min CGPA:</strong> {job.minCgpa}</p>
              <p><strong>Last Date:</strong> {new Date(job.lastDate).toLocaleDateString()}</p>
              {job.description && <p>{job.description}</p>}
              {alreadyApplied(job._id) ? (
                <button className="btn btn-sm" disabled>Already Applied</button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => handleApply(job._id)}>Apply</button>
              )}
            </div>
          ))}
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

