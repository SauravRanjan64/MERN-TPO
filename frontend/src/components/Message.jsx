// Component displaying loading states, error states with retry, or empty placeholders
import React from 'react';
import { Loader2, AlertCircle, Inbox, RefreshCw } from 'lucide-react';

// Render feedback message based on state type (loading, error, empty)
const Message = ({ type = 'empty', message, onRetry, title }) => {
  if (type === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
        <Loader2 className="animate-spin text-primary mb-3" size={32} />
        <p className="text-sm font-medium">{message || 'Loading information…'}</p>
      </div>
    );
  }

  if (type === 'error') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700 shadow-sm max-w-md mx-auto">
        <AlertCircle className="mx-auto mb-2 text-red-500" size={36} />
        <h3 className="text-base font-bold text-red-800">{title || 'Something went wrong'}</h3>
        <p className="mt-1 text-sm">{message || 'Unable to complete your request at this time.'}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition"
          >
            <RefreshCw size={14} className="mr-1.5" />
            <span>Try Again</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500 max-w-md mx-auto">
      <Inbox className="mx-auto mb-3 text-gray-400" size={36} />
      <h3 className="text-base font-semibold text-gray-800">{title || 'No data found'}</h3>
      <p className="mt-1 text-sm">{message || 'There are no items to display right now.'}</p>
    </div>
  );
};

export default Message;
