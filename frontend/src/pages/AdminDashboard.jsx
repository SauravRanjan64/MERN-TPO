// Admin view: post jobs, see all jobs, manage applications, review resumes
import { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../ToastContext';
import Button from '../components/Button';

export default function AdminDashboard() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingJob, setCreatingJob] = useState(false);

  // Form for creating a new job
  const [jobForm, setJobForm] = useState({
    title: '', companyName: '', description: '', packageLPA: '', minCgpa: '', lastDate: ''
  });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [jobsRes, appsRes, resumesRes] = await Promise.all([
        api.get('/api/jobs'),
        api.get('/api/applications'),
        api.get('/api/resumes')
      ]);
      setJobs(jobsRes.data);
      setApps(appsRes.data);
      setResumes(resumesRes.data);
    } catch (err) {
      toast.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

  // Create a new job
  async function handleCreateJob(e) {
    e.preventDefault();
    setCreatingJob(true);
    try {
      await api.post('/api/jobs', {
        ...jobForm,
        packageLPA: Number(jobForm.packageLPA) || 0,
        minCgpa: Number(jobForm.minCgpa) || 0
      });
      toast.success('Job created successfully!');
      setJobForm({ title: '', companyName: '', description: '', packageLPA: '', minCgpa: '', lastDate: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create job.');
    } finally {
      setCreatingJob(false);
    }
  }

  // Delete a job
  async function handleDelete(id) {
    if (!window.confirm('Delete this job?')) return;
    try {
      await api.delete(`/api/jobs/${id}`);
      toast.success('Job deleted.');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete job.');
    }
  }

  // Update application status
  async function handleStatusChange(appId, newStatus) {
    try {
      await api.put(`/api/applications/${appId}/status`, { status: newStatus });
      toast.success('Status updated.');
      fetchData();
    } catch (err) {
      toast.error('Failed to update status.');
    }
  }

  // View a student's resume PDF in new tab
  async function handleViewResume(resumeId) {
    try {
      const res = await api.get(`/api/resumes/${resumeId}/file`, { responseType: 'blob' });
      const fileURL = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(fileURL, '_blank');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to open resume.');
    }
  }

  // Approve student resume
  async function handleApproveResume(resumeId) {
    const remarks = window.prompt('Enter remarks (optional):', '') || '';
    try {
      await api.put(`/api/resumes/${resumeId}/review`, { status: 'APPROVED', remarks });
      toast.success('Resume approved successfully.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve resume.');
    }
  }

  // Reject student resume
  async function handleRejectResume(resumeId) {
    const remarks = window.prompt('Enter reason for rejection (required):');
    if (remarks === null) return; // user cancelled
    if (!remarks.trim()) {
      alert('A reason/remarks is required to reject a resume.');
      return;
    }
    try {
      await api.put(`/api/resumes/${resumeId}/review`, { status: 'REJECTED', remarks: remarks.trim() });
      toast.success('Resume rejected.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject resume.');
    }
  }

  if (loading) return <p className="center">Loading...</p>;

  return (
    <div>
      <h2>Post a New Job</h2>

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
        <Button
          type="submit"
          className="btn btn-primary"
          loading={creatingJob}
          loadingText="Creating..."
        >
          Create Job
        </Button>
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

      <h2 style={{ marginTop: '2rem' }}>Student Resumes</h2>
      {resumes.length === 0 ? <p>No resumes uploaded yet.</p> : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Email</th>
              <th>Branch</th>
              <th>CGPA</th>
              <th>File</th>
              <th>Status</th>
              <th>Remarks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {resumes.map(r => (
              <tr key={r._id}>
                <td>{r.user?.name || 'N/A'}</td>
                <td>{r.user?.email || 'N/A'}</td>
                <td>{r.user?.branch || '-'}</td>
                <td>{r.user?.cgpa ?? '-'}</td>
                <td>{r.filename} ({(r.size / 1024).toFixed(1)} KB)</td>
                <td><span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span></td>
                <td>{r.remarks || '-'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => handleViewResume(r._id)}
                    >
                      View
                    </button>
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => handleApproveResume(r._id)}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleRejectResume(r._id)}
                    >
                      Reject
                    </button>
                  </div>
                </td>
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

