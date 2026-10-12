import { useState, useEffect } from 'react';
import api from '../../api';
import { useToast } from '../../ToastContext';
import Button from '../../components/Button';
import Pagination from '../../components/Pagination';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import useDebounce from '../../hooks/useDebounce';

export default function ApplicationsTab() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [jobFilter, setJobFilter] = useState('');
  const [allJobs, setAllJobs] = useState([]);
  const [exporting, setExporting] = useState(false);
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

  // Export filtered applications as CSV via axios blob download
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await api.get('/api/admin/export/applications', {
        params: {
          search: debouncedSearch,
          status: statusFilter,
          jobId: jobFilter
        },
        responseType: 'blob'
      });

      // Create a temporary link element to trigger the browser download
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `applications_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Applications exported to CSV successfully!');
    } catch (err) {
      console.error('Export CSV error:', err);
      // When responseType is 'blob', error responses are returned as blobs
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          toast.error(json.message || 'No applications found to export.');
          return;
        } catch (parseErr) {
          // fallback to generic message
        }
      }
      toast.error(err.response?.data?.message || 'Failed to export CSV. No applications match filters.');
    } finally {
      setExporting(false);
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

          {/* Export CSV button */}
          <Button
            className="btn btn-success btn-sm"
            onClick={handleExportCSV}
            loading={exporting}
            loadingText="Exporting..."
          >
            Export CSV
          </Button>
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
