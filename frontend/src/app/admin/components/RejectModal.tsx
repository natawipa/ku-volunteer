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
  rejectReason,
  setRejectReason,
}: RejectModalProps) {
  return (
    <div className="mt-3">
      <textarea
        className="w-full p-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-red-200 focus:border-red-200 outline-none text-sm bg-white"
        placeholder="Enter rejection reason..."
        rows={3}
        value={rejectReason}
        onChange={e => setRejectReason(e.target.value)}
        autoFocus
      />
    </div>
  );
}