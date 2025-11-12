import React from 'react';
import { APPLICATION_STATUS } from '../../../lib/constants';
import type { ActivityApplication } from '../../../lib/types';

interface OrganizerSectionProps {
  activeSection: 'details' | 'applicants' | 'approved';
  onSectionChange: (section: 'details' | 'applicants' | 'approved') => void;
  applications: ActivityApplication[];
}

export default function OrganizerSection({
  activeSection,
  onSectionChange,
  applications
}: OrganizerSectionProps) {
  const pendingCount = applications.filter(app => app.status === APPLICATION_STATUS.PENDING).length;

  return (
    <div className="flex justify-center mb-6">
      <div className="flex space-x-8">
        <button
          onClick={() => onSectionChange('details')}
          className={`py-3 px-4 font-medium transition-all duration-200 ${
            activeSection === 'details'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}>
          Event Details
        </button>
        <button
          onClick={() => onSectionChange('applicants')}
          className={`py-3 px-4 font-medium transition-all duration-200 flex items-center gap-2 ${
            activeSection === 'applicants'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}>
          Participants Apply
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-[#DC143C] rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => onSectionChange('approved')}
          className={`py-3 px-4 font-medium transition-all duration-200 ${
            activeSection === 'approved'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}>
          Approved Participants
        </button>
      </div>
    </div>
  );
}