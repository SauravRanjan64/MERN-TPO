// Card component displaying job summary with branch tags and closing soon banner
import React from 'react';
import { Link } from 'react-router-dom';
import { Building, DollarSign, Calendar, ChevronRight, Clock } from 'lucide-react';

// Render concise card showing recruitment specifications and deadline tag
const JobCard = ({ job }) => {
  const isClosingSoon = job.lastDate && (new Date(job.lastDate) - new Date() <= 3 * 86400000) && (new Date(job.lastDate) >= new Date());

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-semibold text-primary uppercase flex items-center">
            <Building size={13} className="mr-1" />{job.companyName || 'Company'}
          </span>
          <h2 className="text-base font-bold text-gray-900 leading-snug">{job.title}</h2>
        </div>
        {isClosingSoon && (
          <span className="inline-flex items-center text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex-shrink-0 animate-pulse">
            <Clock size={11} className="mr-1" />Closing soon
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg">
        <div className="flex items-center space-x-1">
          <DollarSign size={13} className="text-gray-400" />
          <span>{job.packageLPA != null ? `${job.packageLPA} LPA` : 'Best in Industry'}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Calendar size={13} className="text-gray-400" />
          <span>{job.lastDate ? new Date(job.lastDate).toLocaleDateString() : 'Open'}</span>
        </div>
      </div>

      {job.allowedBranches && job.allowedBranches.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {job.allowedBranches.map((b, i) => (
            <span key={i} className="text-[10px] bg-blue-50 text-blue-700 font-medium px-1.5 py-0.5 rounded">
              {b}
            </span>
          ))}
        </div>
      )}

      <Link
        to={`/student/jobs/${job._id}`}
        className="w-full min-h-[44px] flex items-center justify-center space-x-1 rounded-xl bg-primary text-white text-xs font-bold shadow active:scale-95 transition"
      >
        <span>View Job & Apply</span>
        <ChevronRight size={14} />
      </Link>
    </article>
  );
};

export default JobCard;
