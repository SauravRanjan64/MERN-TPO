// Reusable grey pulsing placeholder cards for loading states
import React from 'react';

// Render a single animated skeleton placeholder bar or block
export const Skeleton = ({ className = 'h-4 w-full' }) => {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
};

// Render card-shaped pulsing placeholders for list views
export const SkeletonCard = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-4 w-1/3 bg-gray-200 rounded" />
            <div className="h-6 w-16 bg-gray-200 rounded-full" />
          </div>
          <div className="h-5 w-2/3 bg-gray-300 rounded" />
          <div className="h-3 w-full bg-gray-200 rounded" />
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
            <div className="h-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonCard;
