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
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteJob(job._id)}
                    >
                      Delete
                    </button>
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
