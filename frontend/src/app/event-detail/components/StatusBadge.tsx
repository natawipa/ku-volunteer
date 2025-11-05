import React from 'react';
import { APPLICATION_STATUS } from '../../../lib/constants';

interface EventStatusBadgeProps {
  status: string | null;
}

export default function EventStatusBadge({ status }: EventStatusBadgeProps) {
  if (!status) return null;

  const EventStatusConfig = {
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
    }
  };

  const statusKey = status as keyof typeof EventStatusConfig;
  const config = EventStatusConfig[statusKey] || EventStatusConfig[APPLICATION_STATUS.PENDING];

  return (
    <div className={`inline-flex items-center px-3 py-1 mt-3 rounded-full text-sm font-medium border ${config.color}`}>
      {config.text}
    </div>
  );
}