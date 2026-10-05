// Mobile-friendly bottom sheet modal replacing window.confirm
import React from 'react';
import { AlertTriangle } from 'lucide-react';

// Render slide-up confirmation sheet with cancel and confirm buttons
const ConfirmSheet = ({
  isOpen,
  title = 'Please Confirm',
  message = 'Are you sure you want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmVariant = 'primary',
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl z-10 space-y-4">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto sm:hidden" />
        
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-full bg-amber-50 text-amber-600 flex-shrink-0">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{message}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="min-h-[44px] py-2.5 px-4 rounded-xl border border-gray-300 font-semibold text-gray-700 bg-white hover:bg-gray-50 active:scale-95 transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-white shadow active:scale-95 transition disabled:opacity-60 ${
              confirmVariant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-primary hover:bg-blue-700'
            }`}
          >
            {loading ? 'Processing…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmSheet;
