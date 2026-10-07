// Admin view: post jobs, see all jobs, manage applications
import { useState, useEffect } from 'react';
import api from '../api';

export default function AdminDashboard() {
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Form for creating a new job
  const [jobForm, setJobForm] = useState({
    title: '', companyName: '', description: '', packageLPA: '', minCgpa: '', lastDate: ''
  });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [jobsRes, appsRes] = await Promise.all([
        api.get('/api/jobs'),
        api.get('/api/applications')
      ]);
      setJobs(jobsRes.data);
      setApps(appsRes.data);
    } catch (err) {
      setMsg('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

  // Create a new job
  async function handleCreateJob(e) {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/api/jobs', {
        ...jobForm,
        packageLPA: Number(jobForm.packageLPA) || 0,
        minCgpa: Number(jobForm.minCgpa) || 0
      });
      setMsg('Job created!');
      setJobForm({ title: '', companyName: '', description: '', packageLPA: '', minCgpa: '', lastDate: '' });
      fetchData();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to create job.');
    }
  }

  // Delete a job
  async function handleDelete(id) {
    if (!window.confirm('Delete this job?')) return;
    try {
      await api.delete(`/api/jobs/${id}`);
      fetchData();
    } catch (err) {
      setMsg('Failed to delete job.');
    }
  }

  // Update application status
  async function handleStatusChange(appId, newStatus) {
    try {
      await api.put(`/api/applications/${appId}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      setMsg('Failed to update status.');
    }
  }

  if (loading) return <p className="center">Loading dashboard...</p>;

  return (
    <div>
      <h2>Post a New Job</h2>
      {msg && <p className={msg.includes('created') ? 'success-msg' : 'error-msg'}>{msg}</p>}

      <form className="job-form" onSubmit={handleCreateJob}>
        <input placeholder="Job Title" value={jobForm.title}
          onChange={e => setJobForm({...jobForm, title: e.target.value})} required />
        <input placeholder="Company Name" value={jobForm.companyName}
          onChange={e => setJobForm({...jobForm, companyName: e.target.value})} required />
        <input placeholder="Description" value={jobForm.description}
          onChange={e => setJobForm({...jobForm, description: e.target.value})} />
        <input placeholder="Package (LPA)" type="number" step="0.1" value={jobForm.packageLPA}
          onChange={e => setJobForm({...jobForm, packageLPA: e.target.value})} />
        <input placeholder="Min CGPA" type="number" step="0.1" min="0" max="10" value={jobForm.minCgpa}
          onChange={e => setJobForm({...jobForm, minCgpa: e.target.value})} />
        <input type="date" value={jobForm.lastDate}
          onChange={e => setJobForm({...jobForm, lastDate: e.target.value})} required />
        <button type="submit" className="btn btn-primary">Create Job</button>
      </form>

      <h2>All Jobs</h2>
      {jobs.length === 0 ? <p>No jobs yet.</p> : (
        <table className="data-table">
          <thead>
            <tr><th>Title</th><th>Company</th><th>Package</th><th>Min CGPA</th><th>Last Date</th><th>Action</th></tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <tr key={job._id}>
                <td>{job.title}</td>
                <td>{job.companyName}</td>
                <td>{job.packageLPA} LPA</td>
                <td>{job.minCgpa}</td>
                <td>{new Date(job.lastDate).toLocaleDateString()}</td>
                <td><button className="btn btn-sm btn-danger" onClick={() => handleDelete(job._id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 style={{ marginTop: '2rem' }}>All Applications</h2>
      {apps.length === 0 ? <p>No applications yet.</p> : (
        <table className="data-table">
          <thead>
            <tr><th>Student</th><th>Email</th><th>Branch</th><th>CGPA</th><th>Job</th><th>Company</th><th>Status</th></tr>
          </thead>
          <tbody>
            {apps.map(app => (
              <tr key={app._id}>
                <td>{app.user?.name}</td>
                <td>{app.user?.email}</td>
                <td>{app.user?.branch}</td>
                <td>{app.user?.cgpa}</td>
                <td>{app.job?.title}</td>
                <td>{app.job?.companyName}</td>
                <td>
                  <select value={app.status} onChange={e => handleStatusChange(app._id, e.target.value)}>
                    <option value="APPLIED">APPLIED</option>
                    <option value="SHORTLISTED">SHORTLISTED</option>
                    <option value="SELECTED">SELECTED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
