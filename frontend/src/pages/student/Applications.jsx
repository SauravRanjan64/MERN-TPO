// Student applications tracker with status steppers and live socket highlights
import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Building, ArrowRight, CheckCircle2, Clock, XCircle } from 'lucide-react';
import api from '../../components/api';
import { AuthContext } from '../../context/AuthContext';
import { SkeletonCard } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';

// Render 3-stage visual progress stepper showing application milestones
const Stepper = ({ status }) => {
  const isRejected = status === 'REJECTED';
  const steps = [
    { key: 'APPLIED', label: 'Applied', done: true },
    { key: 'SHORTLISTED', label: 'Shortlisted', done: ['SHORTLISTED', 'SELECTED'].includes(status) },
    { key: 'SELECTED', label: isRejected ? 'Rejected' : 'Selected', done: ['SELECTED', 'REJECTED'].includes(status) },
  ];

  return (
    <div className="flex items-center justify-between w-full pt-2 text-xs">
      {steps.map((step, idx) => (
        <React.Fragment key={step.key}>
          <div className="flex flex-col items-center flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
              step.done
                ? isRejected && idx === 2 ? 'bg-red-500 text-white' : 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}>
              {step.done ? (isRejected && idx === 2 ? <XCircle size={14} /> : <CheckCircle2 size={14} />) : idx + 1}
            </div>
            <span className={`mt-1 text-[11px] ${step.done ? 'font-bold text-gray-800' : 'text-gray-400'}`}>{step.label}</span>
          </div>
          {idx < 2 && <div className={`h-0.5 flex-1 mx-1 ${steps[idx + 1].done ? (isRejected && idx === 1 ? 'bg-red-400' : 'bg-green-500') : 'bg-gray-200'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
};

// Render real-time applications directory with colored status borders
const StudentApplications = () => {
  const { socket } = useContext(AuthContext);
  const { showToast } = useToast();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [highlightId, setHighlightId] = useState(null);

  // Fetch student applications from server
  const fetchApps = async () => {
    try {
      const res = await api.get('/api/student/applications/my');
      setApps(res.data || []);
    } catch {
      showToast('Unable to load applications.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApps(); }, []);

  // Sync real-time status updates via WebSockets and pulse updated card
  useEffect(() => {
    if (!socket) return;
    const handleStatus = (data) => {
      fetchApps();
      showToast('Application status updated!');
      if (data?.applicationId) {
        setHighlightId(data.applicationId);
        setTimeout(() => setHighlightId(null), 2000);
      }
    };
    socket.on('statusChanged', handleStatus);
    return () => socket.off('statusChanged', handleStatus);
  }, [socket, showToast]);

  const borderForStatus = (s) => (s === 'SELECTED' ? 'border-l-green-600' : s === 'SHORTLISTED' ? 'border-l-amber-500' : s === 'REJECTED' ? 'border-l-red-500' : 'border-l-blue-600');

  return (
    <main className="mx-auto max-w-2xl p-4 pb-20 space-y-4">
      <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">My Applications</h1>
      {loading ? (
        <SkeletonCard count={3} />
      ) : apps.length === 0 ? (
        <div className="bg-white p-6 rounded-2xl border text-center space-y-3">
          <Clock className="mx-auto text-gray-400" size={36} />
          <p className="text-sm text-gray-600">You haven't submitted any job applications yet.</p>
          <Link to="/student/jobs" className="inline-flex items-center min-h-[44px] px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl active:scale-95 transition">
            Explore Open Jobs <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
      ) : (
        apps.map((app) => (
          <article
            key={app._id}
            className={`rounded-xl border border-gray-200 border-l-4 ${borderForStatus(app.status)} bg-white p-4 shadow-sm space-y-3 transition duration-500 ${
              highlightId === app._id ? 'ring-2 ring-primary bg-blue-50/50' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-primary uppercase flex items-center"><Building size={13} className="mr-1" />{app.job?.company?.name || 'Company'}</span>
                <h2 className="text-base font-bold text-gray-900">{app.job?.title}</h2>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded bg-blue-50 text-blue-700">{app.matchScore}% Match</span>
            </div>
            <Stepper status={app.status} />
          </article>
        ))
      )}
    </main>
  );
};

export default StudentApplications;
