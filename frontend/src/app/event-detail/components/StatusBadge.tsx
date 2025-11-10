import React from 'react';
import { APPLICATION_STATUS } from '../../../lib/constants';

type ApplicationStatus = typeof APPLICATION_STATUS[keyof typeof APPLICATION_STATUS];
type CheckInStatus = 'checked_in' | 'please_checkin' | 'absent';
type AllStatuses = ApplicationStatus | CheckInStatus;

interface StatusBadgeProps {
  status: AllStatuses | string | null;
  onPleaseCheckInClick?: () => void;
}

const STATUS_CONFIG = {
  [APPLICATION_STATUS.PENDING]: {
    text: 'Pending Review',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  },
  [APPLICATION_STATUS.APPROVED]: {
    text: 'Approved',
    color: 'bg-green-100 text-green-800 border-green-300'
  },
  [APPLICATION_STATUS.REJECTED]: {
    text: 'Rejected',
    color: 'bg-red-100 text-red-800 border-red-300'
  },
  [APPLICATION_STATUS.CANCELLED]: {
    text: 'Cancelled',
    color: 'bg-gray-100 text-gray-800 border-gray-300'
  },
  [APPLICATION_STATUS.CHECKED_IN]: {
    text: 'Checked In',
    color: 'bg-[#FFEAF4] text-[#E169A1] border-[#FFBADA]'
  },
  [APPLICATION_STATUS.PLEASE_CHECKIN]: {
    text: 'Please Check In',
    color: 'bg-[#FFE8B1] text-[#856404]'
  },
  [APPLICATION_STATUS.ABSENT]: {
    text: 'Absent',
    color: 'bg-[#FFE8B1] text-[#C08A06] border-[#FFE0B2]'
  }
} as const;

export default function StatusBadge({ status, onPleaseCheckInClick }: StatusBadgeProps) {
  if (!status) return null;

  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG[APPLICATION_STATUS.PENDING];
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