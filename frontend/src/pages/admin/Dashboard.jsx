// Admin Dashboard with quick actions row and horizontal metric bars
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Download, Loader2 } from 'lucide-react';
import api from '../../components/api';
import { Skeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';

// Render admin analytics overview with quick action links and horizontal metric bars
const AdminDashboard = () => {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Load placement status metrics, branch counts, and top drives
  const loadAnalytics = async () => {
    try {
      const res = await api.get('/api/admin/analytics');
      setData(res.data);
    } catch { showToast('Failed to load analytics.', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAnalytics(); }, []);

  // Download all placement applications as CSV
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await api.get('/api/admin/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `applications_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('Applications CSV exported successfully.');
    } catch { showToast('CSV export failed.', 'error'); }
    finally { setExporting(false); }
  };

  if (loading) return <div className="p-4 max-w-3xl mx-auto space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-44 w-full" /><Skeleton className="h-44 w-full" /></div>;
  if (!data) return <div className="p-6 text-center text-gray-500">No analytics data available.</div>;

  const totalStatus = Object.values(data.statusCounts || {}).reduce((a, b) => a + b, 0) || 1;
  const totalBranch = (data.branchSelected || []).reduce((a, b) => a + b.selected, 0) || 1;

  return (
    <main className="mx-auto max-w-3xl p-4 pb-20 space-y-5">
      <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">Admin Analytics</h1>

      <div className="grid grid-cols-3 gap-2">
        <Link to="/admin/jobdrives" className="min-h-[44px] flex flex-col items-center justify-center p-2.5 rounded-xl bg-white border border-gray-200 shadow-sm text-xs font-bold text-gray-800 active:scale-95 transition">
          <Plus size={16} className="text-primary mb-1" />
          <span>Add Job Drive</span>
        </Link>
        <Link to="/admin/students" className="min-h-[44px] flex flex-col items-center justify-center p-2.5 rounded-xl bg-white border border-gray-200 shadow-sm text-xs font-bold text-gray-800 active:scale-95 transition">
          <Users size={16} className="text-green-600 mb-1" />
          <span>Add Student</span>
        </Link>
        <button type="button" onClick={handleExportCSV} disabled={exporting} className="min-h-[44px] flex flex-col items-center justify-center p-2.5 rounded-xl bg-white border border-gray-200 shadow-sm text-xs font-bold text-gray-800 active:scale-95 transition disabled:opacity-60">
          {exporting ? <Loader2 size={16} className="animate-spin text-primary mb-1" /> : <Download size={16} className="text-amber-600 mb-1" />}
          <span>Export CSV</span>
        </button>
      </div>

      <section className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-gray-900">Application Pipeline Status</h2>
        {Object.entries(data.statusCounts || {}).map(([status, count]) => (
          <div key={status} className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600 font-medium">
              <span>{status}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-100 h-3 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${(count / totalStatus) * 100}%` }} />
              </div>
              <span className="text-xs font-bold text-gray-900 w-8 text-right">{count}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-gray-900">Selected Offers by Branch</h2>
        {(data.branchSelected || []).map((b) => (
          <div key={b.branch} className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600 font-medium">
              <span>{b.branch}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-100 h-3 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${(b.selected / totalBranch) * 100}%` }} />
              </div>
              <span className="text-xs font-bold text-gray-900 w-8 text-right">{b.selected}</span>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
};

export default AdminDashboard;
