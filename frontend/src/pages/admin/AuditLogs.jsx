// Admin audit log viewer displaying security and workflow action history
import React, { useEffect, useState } from 'react';
import { ShieldCheck, User, Clock, RefreshCw, KeyRound, Briefcase, FilePlus, ArrowRightLeft } from 'lucide-react';
import api from '../../components/api';
import Message from '../../components/Message';

// Get icon corresponding to the audited system action
const getActionIcon = (action) => {
  switch (action) {
    case 'LOGIN':
      return <KeyRound size={16} className="text-blue-600" />;
    case 'JOB_CREATED':
      return <Briefcase size={16} className="text-green-600" />;
    case 'APPLIED':
      return <FilePlus size={16} className="text-amber-600" />;
    case 'STATUS_CHANGED':
      return <ArrowRightLeft size={16} className="text-purple-600" />;
    default:
      return <ShieldCheck size={16} className="text-gray-600" />;
  }
};

// Admin interface to inspect the latest 50 tamper-evident audit log records
const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch the 50 most recent audit log entries from backend
  const fetchAuditLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/admin/audit');
      setLogs(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">System Audit Trail</h1>
          <p className="mt-1 text-sm text-gray-500">
            Immutable log of recent portal actions: authentication, applications, job drives, and stage transitions.
          </p>
        </div>
      </div>

      {loading ? (
        <Message type="loading" message="Loading audit history records…" />
      ) : error ? (
        <Message type="error" message={error} onRetry={fetchAuditLogs} />
      ) : logs.length === 0 ? (
        <Message
          type="empty"
          title="No Audit Logs Recorded"
          message="No user actions have been recorded in the audit log yet."
        />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log._id}
              className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                    {getActionIcon(log.action)}
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="text-xs text-gray-500 block sm:inline sm:ml-2">
                      by <strong className="text-gray-700">{log.user?.name || 'System / Guest'}</strong> ({log.user?.email || 'N/A'})
                    </span>
                  </div>
                </div>

                <span className="text-xs text-gray-400 flex items-center space-x-1">
                  <Clock size={13} />
                  <span>{new Date(log.createdAt).toLocaleString()}</span>
                </span>
              </div>

              {log.details && Object.keys(log.details).length > 0 && (
                <div className="rounded-lg bg-gray-50 p-2.5 text-xs font-mono text-gray-700 border border-gray-100 overflow-x-auto">
                  {JSON.stringify(log.details, null, 2)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ONE Big Primary Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={fetchAuditLogs}
          className="w-full flex items-center justify-center space-x-2 rounded-xl bg-primary py-4 px-6 text-center font-bold text-white shadow-md hover:bg-blue-700 transition"
        >
          <RefreshCw size={18} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>
    </main>
  );
};

export default AdminAuditLogs;
