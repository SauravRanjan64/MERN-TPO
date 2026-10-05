// Student job details view with sticky apply bar, eligibility checklist, and match ring
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building, ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../../components/api';
import EligibilityCard from '../../components/EligibilityCard';
import MatchRing from '../../components/MatchRing';
import ConfirmSheet from '../../components/ConfirmSheet';
import { Skeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';

// Render full job drive specs, checklist criteria, match ring, and sticky apply bar
const JobDetail = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const [job, setJob] = useState(null);
  const [eligibility, setEligibility] = useState({ eligible: false, checks: [], matchScore: 0, matchedSkills: [], missingSkills: [] });
  const [loading, setLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  // Fetch job requirements and calculated candidate eligibility from backend
  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobRes, eligRes] = await Promise.all([api.get(`/api/student/jobs/${id}`), api.get(`/api/student/eligibility/${id}`)]);
      setJob(jobRes.data);
      setEligibility(eligRes.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load job details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  // Execute job application post request after confirmation
  const handleConfirmApply = async () => {
    setApplying(true);
    try {
      await api.post(`/api/student/apply/${id}`, {});
      setHasApplied(true);
      setIsConfirmOpen(false);
      showToast('Application submitted successfully!');
    } catch (err) {
      const reasons = err.response?.data?.reasons;
      showToast(reasons ? reasons.join(' • ') : err.response?.data?.message || 'Application failed.', 'error');
    } finally {
      setApplying(false);
    }
  };

  const failedCount = (eligibility.checks || []).filter((c) => !c.passed).length;

  if (loading) return <div className="p-4 max-w-3xl mx-auto space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-40 w-full" /><Skeleton className="h-48 w-full" /></div>;
  if (!job) return <div className="p-6 text-center text-gray-500">Job drive not found.</div>;

  if (hasApplied) {
    return (
      <main className="mx-auto max-w-md p-6 mt-8 text-center bg-white rounded-2xl border shadow-sm space-y-4">
        <CheckCircle2 size={54} className="text-green-600 mx-auto" />
        <h1 className="text-2xl font-extrabold text-gray-900">Application Submitted!</h1>
        <p className="text-sm text-gray-600">Your profile and resume match score ({eligibility.matchScore}%) have been submitted to {job.companyName}.</p>
        <Link to="/student/applications" className="w-full min-h-[48px] flex items-center justify-center space-x-2 rounded-xl bg-primary text-white font-bold shadow active:scale-95 transition">
          <span>View My Applications</span>
          <ArrowRight size={18} />
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-4 pb-28 space-y-4">
      <Link to="/student/jobs" className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-primary min-h-[44px]">
        <ArrowLeft size={16} className="mr-1" />
        <span>Back to all Job Drives</span>
      </Link>
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
        <span className="inline-flex items-center text-xs font-semibold text-primary uppercase"><Building size={14} className="mr-1" />{job.companyName}</span>
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">{job.title}</h1>
        {job.description && <p className="text-sm text-gray-600 pt-2 border-t border-gray-100">{job.description}</p>}
      </div>

      <EligibilityCard eligible={eligibility.eligible} checks={eligibility.checks || []} />
      <MatchRing matchScore={eligibility.matchScore || 0} matchedSkills={eligibility.matchedSkills || []} missingSkills={eligibility.missingSkills || []} />

      <div className="fixed bottom-14 sm:bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-gray-200 p-3 z-30 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="text-xs text-gray-600">
            <span className="font-bold text-sm text-gray-900 block">{job.packageLPA != null ? `${job.packageLPA} LPA` : 'Best in Industry'}</span>
            <span>Ends: {job.lastDate ? new Date(job.lastDate).toLocaleDateString() : 'Open'}</span>
          </div>
          <button
            type="button"
            disabled={!eligibility.eligible || applying}
            onClick={() => setIsConfirmOpen(true)}
            className="flex-1 max-w-xs min-h-[48px] py-2.5 px-4 rounded-xl bg-primary text-white font-bold shadow text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition"
          >
            {eligibility.eligible ? 'Apply for Job' : `Fix ${failedCount} check${failedCount !== 1 ? 's' : ''} to apply`}
          </button>
        </div>
      </div>

      <ConfirmSheet
        isOpen={isConfirmOpen}
        title="Apply for Job Drive"
        message={`Confirm submitting your application for "${job.title}" at ${job.companyName}?`}
        confirmText="Confirm & Apply"
        loading={applying}
        onConfirm={handleConfirmApply}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </main>
  );
};

export default JobDetail;
