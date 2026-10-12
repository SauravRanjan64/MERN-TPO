// Admin Jobs tab: view paginated jobs, search jobs, create jobs, and delete jobs
import { useState } from 'react';
import api from '../../api';
import { useToast } from '../../ToastContext';
import Button from '../../components/Button';
import Pagination from '../../components/Pagination';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import useDebounce from '../../hooks/useDebounce';

export default function JobsTab() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const [creatingJob, setCreatingJob] = useState(false);
  const [exportingJobId, setExportingJobId] = useState(null);
  const [jobForm, setJobForm] = useState({
    title: '', companyName: '', description: '', packageLPA: '', minCgpa: '', lastDate: ''
  });

  // Fetch paginated jobs
  const {
    data: jobs,
    total,
    page,
    totalPages,
    loading,
    setPage,
    reload
  } = usePaginatedFetch('/api/admin/jobs', {
    search: debouncedSearch,
    limit: 10
  });

  // Export applications for a single job as CSV
  const handleExportJobCSV = async (jobId, jobTitle) => {
    setExportingJobId(jobId);
    try {
      const res = await api.get('/api/admin/export/applications', {
        params: { jobId },
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanTitle = (jobTitle || 'job').toLowerCase().replace(/[^a-z0-9]/g, '_');
      link.setAttribute('download', `${cleanTitle}_applications.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Job applications exported successfully!');
    } catch (err) {
      console.error('Export job CSV failed:', err);
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          toast.error(json.message || 'No applications found for this job.');
          return;
        } catch (parseErr) {
          // fallback
        }
      }
      toast.error(err.response?.data?.message || 'No applications found for this job.');
    } finally {
      setExportingJobId(null);
    }
  };

  // Create a new job
  const handleCreateJob = async (e) => {
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
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create job.');
    } finally {
      setCreatingJob(false);
    }
  };

  // Delete a job
  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Delete this job? This will also remove its applications.')) return;
    try {
      await api.delete(`/api/jobs/${jobId}`);
      toast.success('Job deleted.');
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete job.');
    }
  };

  return (
    <div>
      <h2>Post a New Job</h2>
      <form className="job-form" onSubmit={handleCreateJob}>
        <input
          placeholder="Job Title"
          value={jobForm.title}
          onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
          required
        />
        <input
          placeholder="Company Name"
          value={jobForm.companyName}
          onChange={(e) => setJobForm({ ...jobForm, companyName: e.target.value })}
          required
        />
        <input
          placeholder="Description"
          value={jobForm.description}
          onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
        />
        <input
          placeholder="Package (LPA)"
          type="number"
          step="0.1"
          value={jobForm.packageLPA}
          onChange={(e) => setJobForm({ ...jobForm, packageLPA: e.target.value })}
        />
        <input
          placeholder="Min CGPA"
          type="number"
          step="0.1"
          min="0"
          max="10"
          value={jobForm.minCgpa}
          onChange={(e) => setJobForm({ ...jobForm, minCgpa: e.target.value })}
        />
        <input
          type="date"
          value={jobForm.lastDate}
          onChange={(e) => setJobForm({ ...jobForm, lastDate: e.target.value })}
          required
        />
        <Button
          type="submit"
          className="btn btn-primary"
          loading={creatingJob}
          loadingText="Creating..."
        >
          Create Job
        </Button>
      </form>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2>All Jobs ({total})</h2>
        <input
          type="text"
          placeholder="Search jobs by title or company..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', minWidth: '260px' }}
        />
      </div>

      {loading ? (
        <p className="center">Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <p className="no-data-msg">No jobs found.</p>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Company</th>
                <th>Package</th>
                <th>Min CGPA</th>
                <th>Last Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job._id}>
                  <td><strong>{job.title}</strong></td>
                  <td>{job.companyName}</td>
                  <td>{job.packageLPA} LPA</td>
                  <td>{job.minCgpa}</td>
                  <td>{new Date(job.lastDate).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <Button
                        className="btn btn-sm btn-outline"
                        loading={exportingJobId === job._id}
                        loadingText="Exporting..."
                        onClick={() => handleExportJobCSV(job._id, job.title)}
                        title="Export CSV of students who applied to this job"
                      >
                        Export CSV
                      </Button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteJob(job._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={10}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}
    </div>
  );
}
