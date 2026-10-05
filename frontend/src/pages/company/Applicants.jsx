// Company applicants pipeline with tab filtering, match progress bars, and confirm sheet
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Loader2 } from 'lucide-react';
import api from '../../components/api';
import StatusBadge from '../../components/StatusBadge';
import ConfirmSheet from '../../components/ConfirmSheet';
import { SkeletonCard } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';

const STATUS_TABS = ['ALL', 'APPLIED', 'SHORTLISTED', 'SELECTED', 'REJECTED'];

// Render company applicants review board with tabbed stage filters and stage updates
const CompanyApplicants = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState(searchParams.get('jobId') || '');
  const [activeTab, setActiveTab] = useState('ALL');
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [confirmData, setConfirmData] = useState(null);

  // Load recruiter posted jobs list
  const loadJobs = async () => {
    try {
      const res = await api.get('/api/company/jobs');
      setJobs(res.data || []);
      if (!jobId && res.data?.[0]?._id) {
        setJobId(res.data[0]._id);
        setSearchParams({ jobId: res.data[0]._id });
      }
    } catch { showToast('Unable to load company jobs.', 'error'); }
  };

  // Fetch candidates for selected job drive
  const loadApplicants = async (id = jobId) => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api.get(`/api/company/jobs/${id}/applicants`);
      setApplicants(res.data || []);
    } catch { showToast('Unable to load applicants.', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadJobs(); }, []);
  useEffect(() => { if (jobId) loadApplicants(jobId); }, [jobId]);

  // Execute candidate application status transition
  const executeStatusChange = async () => {
    if (!confirmData) return;
    const { appId, nextStatus } = confirmData;
    setSavingId(appId);
    try {
      await api.put(`/api/applications/${appId}/status`, { status: nextStatus });
      showToast(`Status updated to ${nextStatus}.`);
      setConfirmData(null);
      loadApplicants(jobId);
    } catch (err) {
      showToast(err.response?.data?.message || 'Status update failed.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const counts = STATUS_TABS.reduce((acc, tab) => {
    acc[tab] = tab === 'ALL' ? applicants.length : applicants.filter((a) => a.status === tab).length;
    return acc;
  }, {});

  const displayed = activeTab === 'ALL' ? applicants : applicants.filter((a) => a.status === activeTab);

  return (
    <main className="mx-auto max-w-3xl p-4 pb-20 space-y-4">
      <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">Applicants Pipeline</h1>

      <select
        value={jobId}
        onChange={(e) => { setJobId(e.target.value); setSearchParams({ jobId: e.target.value }); }}
        className="w-full min-h-[44px] rounded-xl border border-gray-300 p-2.5 text-sm bg-white font-medium"
      >
        {jobs.map((j) => <option key={j._id} value={j._id}>{j.title} ({j.packageLPA} LPA)</option>)}
      </select>

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
          <Users className="mx-auto text-gray-400" size={32} />
          <p className="text-sm text-gray-600">No applicants in {activeTab} stage.</p>
        </div>
      ) : (
        displayed.map((item) => (
          <article key={item.applicationId} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">{item.student?.name} ({item.student?.branch})</h2>
                <span className="text-xs text-gray-500">CGPA: {item.student?.cgpa || 'N/A'} · Backlogs: {item.student?.backlogs || 0}</span>
              </div>
              <StatusBadge status={item.status} />
            </div>

            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <span className="font-semibold">{item.matchScore || 0}% match</span>
              <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${item.matchScore >= 70 ? 'bg-green-500' : item.matchScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${item.matchScore || 0}%` }} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              {item.status === 'APPLIED' && (
                <>
                  <button type="button" disabled={savingId === item.applicationId} onClick={() => setConfirmData({ appId: item.applicationId, nextStatus: 'SHORTLISTED', name: item.student?.name })} className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold active:scale-95 transition">
                    {savingId === item.applicationId ? <Loader2 size={14} className="animate-spin" /> : 'Shortlist'}
                  </button>
                  <button type="button" disabled={savingId === item.applicationId} onClick={() => setConfirmData({ appId: item.applicationId, nextStatus: 'REJECTED', name: item.student?.name })} className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold active:scale-95 transition">
                    {savingId === item.applicationId ? <Loader2 size={14} className="animate-spin" /> : 'Reject'}
                  </button>
                </>
              )}
              {item.status === 'SHORTLISTED' && (
                <>
                  <button type="button" disabled={savingId === item.applicationId} onClick={() => setConfirmData({ appId: item.applicationId, nextStatus: 'SELECTED', name: item.student?.name })} className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-green-600 text-white text-xs font-bold active:scale-95 transition">
                    {savingId === item.applicationId ? <Loader2 size={14} className="animate-spin" /> : 'Select'}
                  </button>
                  <button type="button" disabled={savingId === item.applicationId} onClick={() => setConfirmData({ appId: item.applicationId, nextStatus: 'REJECTED', name: item.student?.name })} className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold active:scale-95 transition">
                    {savingId === item.applicationId ? <Loader2 size={14} className="animate-spin" /> : 'Reject'}
                  </button>
                </>
              )}
            </div>
          </article>
        ))
      )}

      <ConfirmSheet
        isOpen={Boolean(confirmData)}
        title="Update Application Status"
        message={`Move ${confirmData?.name || 'candidate'} to ${confirmData?.nextStatus}?`}
        confirmText={`Set as ${confirmData?.nextStatus}`}
        confirmVariant={confirmData?.nextStatus === 'REJECTED' ? 'danger' : 'primary'}
        loading={Boolean(savingId)}
        onConfirm={executeStatusChange}
        onCancel={() => setConfirmData(null)}
      />
    </main>
  );
};

export default CompanyApplicants;
