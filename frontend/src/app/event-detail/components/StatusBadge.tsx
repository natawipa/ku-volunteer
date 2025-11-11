import React from 'react';
import { APPLICATION_STATUS } from '../../../lib/constants';

type ApplicationStatus = typeof APPLICATION_STATUS[keyof typeof APPLICATION_STATUS];
type CheckInStatus = 'checked_in' | 'please_checkin' | 'absent';
type ActivityStatus = 'pending' | 'open' | 'upcoming' | 'during' | 'complete' | 'full' | 'closed' | 'cancelled' | 'rejected';
type AllStatuses = ApplicationStatus | CheckInStatus | ActivityStatus;

interface StatusBadgeProps {
  status: AllStatuses | string | null;
  onPleaseCheckInClick?: () => void;
  isActivityStatus?: boolean; // New prop to distinguish activity vs application status
}

const STUDENT_STATUS_CONFIG = {
  [APPLICATION_STATUS.PENDING]: {
    text: 'Pending Review',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  },
  [APPLICATION_STATUS.APPROVED]: {
    text: 'Approved',
    color: 'bg-green-100 text-green-800 border-green-300'
  },
  [APPLICATION_STATUS.REJECTED]: {
    text: 'Application Rejected',
    color: 'bg-red-100 text-red-800 border-red-300'
  },
  [APPLICATION_STATUS.CANCELLED]: {
    text: 'Application Cancelled',
    color: 'bg-gray-100 text-gray-800 border-gray-300'
  },
  [APPLICATION_STATUS.CHECKED_IN]: {
    text: 'Checked In',
    color: 'bg-[#FFEAF4] text-[#E169A1] border-[#FFBADA]'
  },
  [APPLICATION_STATUS.PLEASE_CHECKIN]: {
    text: 'Please Check In',
    color: 'bg-[#FFE8B1] text-[#856404] border-[#FFE8B1]'
  },
  [APPLICATION_STATUS.ABSENT]: {
    text: 'Absent',
    color: 'bg-[#FFE8B1] text-[#C08A06] border-[#FFE0B2]'
  }
} as const;

const ACTIVITY_STATUS_CONFIG = {
  'pending': {
    text: 'Pending Approval',
    color: 'bg-gray-100 text-gray-800 border-gray-300'
  },
  'open': {
    text: 'Open',
    color: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  'upcoming': {
    text: 'Upcoming',
    color: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  'during': {
    text: 'Ongoing',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300'
  },
  'complete': {
    text: 'Completed',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  'full': {
    text: 'Full',
    color: 'bg-sky-100 text-sky-800 border-sky-300'
  },
  'closed': {
    text: 'Closed',
    color: 'bg-gray-100 text-gray-700 border-gray-400'
  },
  'cancelled': {
    text: 'Event Cancelled',
    color: 'bg-red-100 text-red-800 border-red-300'
  },
  'rejected': {
    text: 'Event Rejected',
    color: 'bg-red-100 text-red-800 border-red-300'
  },
  'deletion_pending': {
    text: 'Deletion Request Pending',
    color: 'bg-orange-100 text-orange-800 border-orange-300 animate-pulse'
  }
} as const;

export default function StatusBadge({ status, onPleaseCheckInClick, isActivityStatus = false }: StatusBadgeProps) {
  if (!status) return null;

  // Choose config based on context
  const configMap = isActivityStatus ? ACTIVITY_STATUS_CONFIG : STUDENT_STATUS_CONFIG;
  const config = configMap[status as keyof typeof configMap] || STUDENT_STATUS_CONFIG[APPLICATION_STATUS.PENDING];
  
  const isPleaseCheckIn = status === APPLICATION_STATUS.PLEASE_CHECKIN;

  const handleClick = () => {
    if (isPleaseCheckIn && onPleaseCheckInClick) {
      onPleaseCheckInClick();
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`inline-flex items-center px-3 py-1 mt-3 rounded-full text-sm font-medium border ${config.color} ${
        isPleaseCheckIn ? 'cursor-pointer hover:scale-105 transition-transform duration-200 animate-pulse' : ''
      }`}
      role={isPleaseCheckIn ? 'button' : undefined}
      tabIndex={isPleaseCheckIn ? 0 : undefined}
      onKeyDown={(e) => {
        if (isPleaseCheckIn && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {config.text}
      {isPleaseCheckIn && (
        <svg 
          className="ml-2 w-4 h-4 animate-bounce" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </div>
  );
}