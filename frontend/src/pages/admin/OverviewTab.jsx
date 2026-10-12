// Admin Overview tab: displays 4 stat summary cards, Recharts applications bar chart, and resume review table
import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import api from '../../api';
import { useToast } from '../../ToastContext';

export default function OverviewTab({ onSwitchTab }) {
  const { toast } = useToast();
  const [stats, setStats] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch overview stats and pending resumes on mount
  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const [statsRes, resumesRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/resumes')
      ]);
      setStats(statsRes.data);
      setResumes(resumesRes.data);
    } catch (err) {
      console.error('Failed to load overview data:', err.message);
      toast.error('Failed to load dashboard overview data.');
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
      fetchOverviewData();
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
      fetchOverviewData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject resume.');
    }
  };

  return (
    <div>
      {/* 4 Key Metrics Number Cards */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid #1a56db' }}>
          <p className="stat-label">Total Students</p>
          <h3 className="stat-value">{stats ? stats.totalStudents : '-'}</h3>
          <span className="stat-subtext">Registered candidates</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <p className="stat-label">Active Jobs</p>
          <h3 className="stat-value">{stats ? stats.totalJobs : '-'}</h3>
          <span className="stat-subtext">Open recruitment drives</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #d97706' }}>
          <p className="stat-label">Total Applications</p>
          <h3 className="stat-value">{stats ? stats.totalApplications : '-'}</h3>
          <span className="stat-subtext">Applications submitted</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #16a34a' }}>
          <p className="stat-label">Placed Students</p>
          <h3 className="stat-value">{stats ? stats.placedStudents : '-'}</h3>
          <span className="stat-subtext">Offers accepted / selected</span>
        </div>
      </div>

      {/* Bar Chart Section: Applications per Company */}
      <div className="card chart-card" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.25rem' }}>Applications per Company</h3>
        <p className="hint" style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
          Breakdown of total student applications submitted across top hiring partners.
        </p>

        {loading ? (
          <p className="center">Loading chart data...</p>
        ) : !stats || !stats.applicationsPerCompany || stats.applicationsPerCompany.length === 0 ? (
          <p className="no-data-msg">No application data available yet for graphing.</p>
        ) : (
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.applicationsPerCompany}
                margin={{ top: 10, right: 20, left: 0, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="company"
                  tick={{ fontSize: 12, fill: '#4b5563' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: '#4b5563' }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(26, 86, 219, 0.05)' }}
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.08)'
                  }}
                  formatter={(value) => [`${value} applications`, 'Total']}
                />
                <Bar
                  dataKey="applications"
                  fill="#1a56db"
                  radius={[4, 4, 0, 0]}
                  barSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Student Resumes Section */}
      <h2 style={{ marginTop: '2.5rem' }}>Student Resumes Under Review ({resumes.length})</h2>
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
