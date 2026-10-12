// Admin Overview tab: displays high-level counts and student resume reviews
import { useState, useEffect } from 'react';
import api from '../../api';
import { useToast } from '../../ToastContext';

export default function OverviewTab({ onSwitchTab }) {
  const { toast } = useToast();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch resumes list
  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/resumes');
      setResumes(res.data);
    } catch (err) {
      toast.error('Failed to load resumes.');
    } finally {
      setLoading(false);
    }
  };

  // View a student's resume PDF in a new tab
  const handleViewResume = async (resumeId) => {
    try {
      const res = await api.get(`/api/resumes/${resumeId}/file`, { responseType: 'blob' });
      const fileURL = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(fileURL, '_blank');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to open resume.');
    }
  };

  // Approve student resume
  const handleApproveResume = async (resumeId) => {
    const remarks = window.prompt('Enter remarks (optional):', '') || '';
    try {
      await api.put(`/api/resumes/${resumeId}/review`, { status: 'APPROVED', remarks });
      toast.success('Resume approved. Student has been emailed.');
      fetchResumes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve resume.');
    }
  };

  // Reject student resume
  const handleRejectResume = async (resumeId) => {
    const remarks = window.prompt('Enter reason for rejection (required):');
    if (remarks === null) return;
    if (!remarks.trim()) {
      alert('A reason/remarks is required to reject a resume.');
      return;
    }
    try {
      await api.put(`/api/resumes/${resumeId}/review`, { status: 'REJECTED', remarks: remarks.trim() });
      toast.success('Resume rejected. Student has been emailed.');
      fetchResumes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject resume.');
    }
  };

  return (
    <div>
      <div className="overview-banner card" style={{ marginBottom: '1.5rem', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <h3>Welcome to Admin Management</h3>
        <p style={{ marginTop: '0.25rem', color: '#1e40af', fontSize: '0.95rem' }}>
          Use the tabs above to manage Jobs, review student Applications, or search the Student directory.
        </p>
      </div>

      <h2>Student Resumes Under Review ({resumes.length})</h2>
      {loading ? (
        <p className="center">Loading resumes...</p>
      ) : resumes.length === 0 ? (
        <p className="no-data-msg">No student resumes uploaded yet.</p>
      ) : (
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
            {resumes.map((r) => (
              <tr key={r._id}>
                <td><strong>{r.user?.name || 'N/A'}</strong></td>
                <td>{r.user?.email || 'N/A'}</td>
                <td>{r.user?.branch || '-'}</td>
                <td>{r.user?.cgpa !== undefined ? r.user.cgpa : '-'}</td>
                <td>{r.filename} ({(r.size / 1024).toFixed(1)} KB)</td>
                <td><span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span></td>
                <td>{r.remarks || '-'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => handleViewResume(r._id)}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-success"
                      onClick={() => handleApproveResume(r._id)}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
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
    </div>
  );
}
