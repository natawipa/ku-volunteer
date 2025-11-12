"use client";

interface RejectModalProps {
  setShowRejectModal: (value: boolean) => void;
  rejectReason: string;
  setRejectReason: (value: string) => void;
  setRejectChecked: (value: boolean) => void;
  setMessage: (value: string) => void;
  isCreationReject?: boolean;
}

export default function RejectModal({
  setShowRejectModal,
  rejectReason,
  setRejectReason,
  setRejectChecked,
  setMessage,
  isCreationReject = false,
}: RejectModalProps) {
    
  const getRejectType = () => {
    if (isCreationReject) {
      return "creation";
    } else {
      return "deletion";
    }
  };

  const handleConfirm = () => {
    if (rejectReason.trim()) {
      setRejectChecked(true);
      setShowRejectModal(false);
      setMessage('');
    } else {
      setMessage('Please enter a rejection reason.');
    }
  };

  const handleCancel = () => {
    setShowRejectModal(false);
    setRejectReason('');
    setRejectChecked(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Rejection Reason</h3>
        <p className="text-sm text-gray-600 mb-4">
          Please provide a reason for rejecting this activity {getRejectType()}.
        </p>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
          placeholder="Enter rejection reason..."
          rows={4}
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey && rejectReason.trim()) {
              handleConfirm();
            }
          }}
        />
        <div className="flex justify-end gap-3 mt-6">
          <button
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleConfirm}
            disabled={!rejectReason.trim()}
          >
            Confirm Reject
          </button>
        </div>
      </div>
    </div>
  );
}