// Student view: available jobs + my applications
import { useState, useEffect } from 'react';
import api from '../api';

export default function StudentDashboard() {
  const [jobs, setJobs] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyMsg, setApplyMsg] = useState('');  // success or error message after apply

  // Fetch jobs and my applications on mount
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [jobsRes, appsRes] = await Promise.all([
        api.get('/api/jobs'),
        api.get('/api/applications/my')
      ]);
      setJobs(jobsRes.data);
      setMyApps(appsRes.data);
    } catch (err) {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
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
      <h2>Available Jobs</h2>
      {applyMsg && <p className={applyMsg.includes('success') ? 'success-msg' : 'error-msg'}>{applyMsg}</p>}

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
