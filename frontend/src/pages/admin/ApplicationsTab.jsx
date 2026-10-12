// Admin Applications tab: paginated applications with search, status, and job filtering
import { useState, useEffect } from 'react';
import api from '../../api';
import { useToast } from '../../ToastContext';
import Pagination from '../../components/Pagination';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import useDebounce from '../../hooks/useDebounce';

export default function ApplicationsTab() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [jobFilter, setJobFilter] = useState('');
  const [allJobs, setAllJobs] = useState([]);
  const debouncedSearch = useDebounce(search, 400);

  // Fetch all jobs for dropdown filter
  useEffect(() => {
    api.get('/api/jobs')
      .then((res) => setAllJobs(res.data))
      .catch((err) => console.error('Failed to load jobs list for filter:', err.message));
  }, []);

  // Fetch paginated applications
  const {
    data: applications,
    total,
    page,
    totalPages,
    loading,
    setPage,
    reload
  } = usePaginatedFetch('/api/admin/applications', {
    search: debouncedSearch,
    status: statusFilter,
    jobId: jobFilter,
    limit: 10
  });

  // Handle application status change
  const handleStatusChange = async (appId, newStatus) => {
    try {
      await api.put(`/api/applications/${appId}/status`, { status: newStatus });
      toast.success('Status updated. Student has been emailed.');
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2>Applications ({total})</h2>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search box */}
          <input
            type="text"
            placeholder="Search student or job..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', minWidth: '180px' }}
          />

          {/* Status filter dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="APPLIED">APPLIED</option>
            <option value="SHORTLISTED">SHORTLISTED</option>
            <option value="SELECTED">SELECTED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          {/* Job filter dropdown */}
          <select
            value={jobFilter}
            onChange={(e) => {
              setJobFilter(e.target.value);
              setPage(1);
            }}
            style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', maxWidth: '200px' }}
          >
            <option value="">All Jobs</option>
            {allJobs.map((j) => (
              <option key={j._id} value={j._id}>
                {j.title} ({j.companyName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="center">Loading applications...</p>
      ) : applications.length === 0 ? (
        <p className="no-data-msg">No applications found matching the criteria.</p>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Branch</th>
                <th>CGPA</th>
                <th>Job</th>
                <th>Company</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app._id}>
                  <td><strong>{app.user?.name || 'N/A'}</strong></td>
                  <td>{app.user?.email || 'N/A'}</td>
                  <td>{app.user?.branch || '-'}</td>
                  <td>{app.user?.cgpa !== undefined ? app.user.cgpa : '-'}</td>
                  <td>{app.job?.title || 'N/A'}</td>
                  <td>{app.job?.companyName || 'N/A'}</td>
                  <td>
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app._id, e.target.value)}
                    >
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
