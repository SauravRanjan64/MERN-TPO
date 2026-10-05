// Animated checklist showing backend eligibility criteria and profile action links
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ChevronRight, ShieldCheck, AlertCircle } from 'lucide-react';

// Render progressive checklist revealing backend validation results step-by-step
const EligibilityCard = ({ eligible, checks = [] }) => {
  const [visibleCount, setVisibleCount] = useState(0);

  // Animate checklist items by revealing rows one by one with 150ms interval
  useEffect(() => {
    setVisibleCount(0);
    if (!checks.length) return;
    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev < checks.length) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [checks]);

  const failedChecks = checks.filter((c) => !c.passed);
  const failedCount = failedChecks.length;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
      <div
        className={`flex items-center justify-between p-3.5 rounded-xl border font-bold text-sm ${
          eligible
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}
      >
        <div className="flex items-center space-x-2">
          {eligible ? (
            <ShieldCheck size={20} className="text-green-600 flex-shrink-0" />
          ) : (
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
          )}
          <span>{eligible ? 'You are eligible to apply' : `Fix ${failedCount} check${failedCount !== 1 ? 's' : ''} to apply`}</span>
        </div>
      </div>

      <ul className="space-y-2.5">
        {checks.slice(0, visibleCount).map((c, idx) => {
          const isActionable =
            !c.passed &&
            (c.name === 'Profile' ||
              c.name === 'Consent' ||
              c.name?.toLowerCase().includes('profile') ||
              c.name?.toLowerCase().includes('consent'));

          return (
            <li
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-xs sm:text-sm"
            >
              <div className="flex items-center space-x-2.5">
                {c.passed ? (
                  <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle size={18} className="text-red-600 flex-shrink-0" />
                )}
                <span className={c.passed ? 'text-gray-800 font-medium' : 'text-red-700 font-medium'}>
                  {c.message}
                </span>
              </div>

              {isActionable && (
                <Link
                  to="/student/profile"
                  className="inline-flex items-center text-xs font-bold text-primary hover:underline ml-2 min-h-[44px] px-2 active:scale-95 transition"
                >
                  <span>Edit Profile</span>
                  <ChevronRight size={14} />
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default EligibilityCard;
