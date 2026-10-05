// Renders a colored status badge with icon and label for placement applications
import React from 'react';
import { Clock, Award, CheckCircle, XCircle, HelpCircle } from 'lucide-react';

// Get visual styling and corresponding icon for an application status
const getStatusConfig = (status) => {
  switch (status) {
    case 'APPLIED':
      return {
        bg: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: <Clock size={15} className="mr-1.5 flex-shrink-0" />,
        text: 'Applied',
      };
    case 'SHORTLISTED':
      return {
        bg: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: <Award size={15} className="mr-1.5 flex-shrink-0" />,
        text: 'Shortlisted',
      };
    case 'SELECTED':
      return {
        bg: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle size={15} className="mr-1.5 flex-shrink-0" />,
        text: 'Selected',
      };
    case 'REJECTED':
      return {
        bg: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle size={15} className="mr-1.5 flex-shrink-0" />,
        text: 'Rejected',
      };
    default:
      return {
        bg: 'bg-gray-100 text-gray-700 border-gray-200',
        icon: <HelpCircle size={15} className="mr-1.5 flex-shrink-0" />,
        text: status || 'Unknown',
      };
  }
};

// Render status badge chip with icon and status text
const StatusBadge = ({ status }) => {
  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}>
      {config.icon}
      <span>{config.text}</span>
    </span>
  );
};

export default StatusBadge;
