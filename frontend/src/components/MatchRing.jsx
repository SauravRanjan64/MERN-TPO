// Circular SVG progress ring displaying resume match percentage and skill tags
import React from 'react';
import { Check, X, Percent } from 'lucide-react';

// Render circular SVG progress bar showing candidate match percentage
const ProgressCircle = ({ score = 0 }) => {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(Math.max(score, 0), 100) / 100) * circumference;
  const strokeColor = score >= 70 ? '#16A34A' : score >= 40 ? '#D97706' : '#DC2626';

  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} stroke="#E5E7EB" strokeWidth="6" fill="transparent" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          stroke={strokeColor}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-base font-extrabold text-gray-900">{score}%</span>
      </div>
    </div>
  );
};

// Render match breakdown with SVG progress ring and colored skill tags
const MatchRing = ({ matchScore = 0, matchedSkills = [], missingSkills = [] }) => {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center space-x-4">
        <ProgressCircle score={matchScore} />
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center space-x-1.5">
            <Percent size={18} className="text-primary" />
            <span>Resume Skill Match</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Skills matched as whole words against your uploaded PDF resume.
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-3 border-t border-gray-100">
        <div>
          <span className="text-xs font-bold text-green-800 uppercase flex items-center mb-1.5">
            <Check size={14} className="mr-1 text-green-600" />
            Matched Skills ({matchedSkills.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {matchedSkills.length > 0 ? (
              matchedSkills.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full bg-green-100 text-green-800 border border-green-200 px-2.5 py-0.5 text-xs font-medium"
                >
                  ✓ {s}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400 italic">No required skills matched</span>
            )}
          </div>
        </div>

        <div>
          <span className="text-xs font-bold text-red-800 uppercase flex items-center mb-1.5">
            <X size={14} className="mr-1 text-red-600" />
            Missing Skills ({missingSkills.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {missingSkills.length > 0 ? (
              missingSkills.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full bg-red-100 text-red-800 border border-red-200 px-2.5 py-0.5 text-xs font-medium"
                >
                  ✕ {s}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400 italic">All required skills matched!</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MatchRing;
