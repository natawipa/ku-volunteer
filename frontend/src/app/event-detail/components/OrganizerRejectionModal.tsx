import React from 'react';

interface RejectionModalProps {
  isOpen: boolean;
  reason: string;
  isProcessing: boolean;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function RejectionModal({
  isOpen,
  reason,
  isProcessing,
  onReasonChange,
  onConfirm,
  onCancel
}: RejectionModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm animate-fadeIn"
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 transform transition-all duration-300 ease-out scale-100 animate-slideUp border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reject Application</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Please provide a clear reason for rejecting this application. The student will receive this feedback.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Rejection Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl p-4 min-h-[140px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition-all bg-gray-50 focus:bg-white"
            placeholder="e.g., Your qualifications don't match the requirements for this activity..."
            disabled={isProcessing}
            autoFocus
          />
          <p className="mt-2 text-xs text-gray-500">
            {reason.trim().length} characters
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="px-6 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing || !reason.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Rejecting...
              </span>
            ) : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}