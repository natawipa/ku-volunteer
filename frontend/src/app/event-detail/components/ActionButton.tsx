import React from 'react';
import { APPLICATION_STATUS, ACTIVITY_STATUS } from '../../../lib/constants';
import type { Activity } from '../../../lib/types';

interface EventActionButtonProps {
  applicationStatus: string | null;
  applying: boolean;
  event: Activity;
  onApply: () => void;
  onCancel: () => void;
}

export default function EventActionButton({
  applicationStatus,
  applying,
  event,
  onApply,
  onCancel
}: EventActionButtonProps) {
  if (applicationStatus === APPLICATION_STATUS.PENDING) {
    return (
      <button
        onClick={onCancel}
        disabled={applying}
        className="bg-yellow-600 text-white px-8 py-3 rounded-lg hover:bg-yellow-700 cursor-pointer transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {applying ? 'Cancelling...' : 'Cancel Application'}
      </button>
    );
  }

  if (applicationStatus === APPLICATION_STATUS.APPROVED) {
    return (
      <div className="text-center">
        <div className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium">
          You&apos;re Approved!
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Check &quot;My Events&quot; for details
        </p>
      </div>
    );
  }

  if (applicationStatus === APPLICATION_STATUS.REJECTED) {
    return (
      <button
        disabled
        className="bg-gray-400 text-white px-8 py-3 rounded-lg cursor-not-allowed font-medium"
      >
        Application Rejected
      </button>
    );
  }

  if (applicationStatus === APPLICATION_STATUS.CANCELLED) {
    return (
      <button
        disabled
        className="bg-gray-400 text-white px-8 py-3 rounded-lg cursor-not-allowed font-medium"
      >
        Cancelled
      </button>
    );
  }

  const canApply = !event?.capacity_reached && (event?.status === ACTIVITY_STATUS.OPEN || event?.status === ACTIVITY_STATUS.UPCOMING);
  
  return (
    <button
      onClick={onApply}
      disabled={applying || !canApply}
      className={`px-8 py-3 rounded-lg cursor-pointer transition-all duration-200 font-medium ${
        !canApply
          ? 'bg-gray-400 text-white cursor-not-allowed'
          : 'bg-green-600 text-white hover:bg-green-700'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {applying ? 'Applying...' : 'Apply Now'}
    </button>
  );
}