// Admin campus applications board with stage tabs, progress bars, and ConfirmSheet
import React, { useEffect, useState } from 'react';
import { Download, FileCheck, Loader2 } from 'lucide-react';
import api from '../../components/api';
import StatusBadge from '../../components/StatusBadge';
import ConfirmSheet from '../../components/ConfirmSheet';
import { SkeletonCard } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';

const STATUS_TABS = ['ALL', 'APPLIED', 'SHORTLISTED', 'SELECTED', 'REJECTED'];

// Oversee campus applications with tabbed filtering, match bars, CSV export, and stage transitions
const AdminApplications = () => {
  const { showToast } = useToast();
  const [apps, setApps] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [confirmData, setConfirmData] = useState(null);

  // Fetch all registered student applications
  const fetchApps = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/applications');
      setApps(res.data || []);
    } catch { showToast('Failed to load applications.', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchApps(); }, []);

  // Update candidate placement status
  const executeStatusChange = async () => {
    if (!confirmData) return;
    const { appId, nextStatus } = confirmData;
    setSavingId(appId);
    try {
      await api.put(`/api/applications/${appId}/status`, { status: nextStatus });
      showToast(`Status updated to ${nextStatus}.`);
      setConfirmData(null);
      fetchApps();
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  // Download all applications as a CSV spreadsheet
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
      showToast('CSV downloaded successfully.');
    } catch { showToast('Export failed.', 'error'); }
    finally { setExporting(false); }
  };

  const counts = STATUS_TABS.reduce((acc, tab) => {
    acc[tab] = tab === 'ALL' ? apps.length : apps.filter((a) => a.status === tab).length;
    return acc;
  }, {});

  const displayed = activeTab === 'ALL' ? apps : apps.filter((a) => a.status === activeTab);

  return (
    <main className="mx-auto max-w-3xl p-4 pb-20 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">Campus Applications</h1>
        <button
          type="button"
          onClick={handleExportCSV}
          disabled={exporting}
          className="min-h-[44px] px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center space-x-1 active:scale-95 transition disabled:opacity-60"
        >
          {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          <span>Export CSV</span>
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap active:scale-95 transition ${
              activeTab === tab ? 'bg-primary text-white shadow' : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            {tab} ({counts[tab] || 0})
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonCard count={3} />
      ) : displayed.length === 0 ? (
        <div className="bg-white p-6 rounded-2xl border text-center space-y-2">
          <FileCheck className="mx-auto text-gray-400" size={32} />
          <p className="text-sm text-gray-600">No applications in {activeTab} stage.</p>
        </div>
      ) : (
        displayed.map((app) => (
          <article key={app._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">{app.student?.name} · {app.job?.title}</h2>
                <span className="text-xs text-gray-500">{app.job?.company}</span>
              </div>
              <StatusBadge status={app.status} />
            </div>

            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <span className="font-semibold">{app.matchScore || 0}% match</span>
              <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${app.matchScore >= 70 ? 'bg-green-500' : app.matchScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${app.matchScore || 0}%` }} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              {app.status === 'APPLIED' && (
                <>
                  <button type="button" disabled={savingId === app._id} onClick={() => setConfirmData({ appId: app._id, nextStatus: 'SHORTLISTED', name: app.student?.name })} className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold active:scale-95 transition">
                    {savingId === app._id ? <Loader2 size={14} className="animate-spin" /> : 'Shortlist'}
                  </button>
                  <button type="button" disabled={savingId === app._id} onClick={() => setConfirmData({ appId: app._id, nextStatus: 'REJECTED', name: app.student?.name })} className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold active:scale-95 transition">
                    {savingId === app._id ? <Loader2 size={14} className="animate-spin" /> : 'Reject'}
                  </button>
                </>
              )}
              {app.status === 'SHORTLISTED' && (
                <>
                  <button type="button" disabled={savingId === app._id} onClick={() => setConfirmData({ appId: app._id, nextStatus: 'SELECTED', name: app.student?.name })} className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-green-600 text-white text-xs font-bold active:scale-95 transition">
                    {savingId === app._id ? <Loader2 size={14} className="animate-spin" /> : 'Select'}
                  </button>
                  <button type="button" disabled={savingId === app._id} onClick={() => setConfirmData({ appId: app._id, nextStatus: 'REJECTED', name: app.student?.name })} className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold active:scale-95 transition">
                    {savingId === app._id ? <Loader2 size={14} className="animate-spin" /> : 'Reject'}
                  </button>
                </>
              )}
            </div>
          </article>
        ))
      )}

      <ConfirmSheet
        isOpen={Boolean(confirmData)}
        title="Promote Candidate Status"
        message={`Move ${confirmData?.name || 'student'} to ${confirmData?.nextStatus}?`}
        confirmText={`Set as ${confirmData?.nextStatus}`}
        confirmVariant={confirmData?.nextStatus === 'REJECTED' ? 'danger' : 'primary'}
        loading={Boolean(savingId)}
        onConfirm={executeStatusChange}
        onCancel={() => setConfirmData(null)}
      />
    </main>
  );
};

export default AdminApplications;
