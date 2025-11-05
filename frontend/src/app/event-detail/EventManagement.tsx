import React from 'react';
import Image from 'next/image';
import { APPLICATION_STATUS } from '../../lib/constants';
import type { ActivityApplication } from '../../lib/types';

// Interfaces
interface TransformedEvent {
  title?: string;
  post: string;
  datestart: string;
  dateend: string;
  timestart: string;
  timeend: string;
  location: string;
  category: string[];
  capacity: number;
  currentParticipants: number;
  organizer: string;
  description: string;
  image: string;
  additionalImages: string[];
}

interface ApplicantsListProps {
  applications: ActivityApplication[];
  loading: boolean;
  isProcessing: boolean;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

interface ApprovedListProps {
  applications: ActivityApplication[];
  loading: boolean;
}

interface EventDetailsProps {
  event: TransformedEvent;
}

// ApplicantsList Component
export function ApplicantsList({
  applications,
  loading,
  isProcessing,
  onApprove,
  onReject
}: ApplicantsListProps) {
  if (loading) {
    return <div className="text-center py-8">Loading applications...</div>;
  }

  const pendingApplications = applications.filter(app => app.status === APPLICATION_STATUS.PENDING);

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-2xl mb-6">Pending Applications</h2>
      {pendingApplications.length === 0 ? (
        <p className="text-gray-500 text-center">No pending applications</p>
      ) : (
        pendingApplications.map((application) => (
          <div key={application.id} className="flex justify-between items-center border-b border-gray-200 pb-4">
            <div className="flex-1">
              <p className="font-medium">
                {application.student_name || `Student ${application.studentid}`}
              </p>
              <p className="text-sm text-gray-600">Student ID: {application.studentid}</p>
            </div>
            <div className="flex gap-4 items-center">
              <button 
                onClick={() => onApprove(application.id)}
                disabled={isProcessing}
                className={`px-4 py-2 rounded transition-colors ${
                  isProcessing 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-green-100 hover:bg-green-200 cursor-pointer'
                }`}
              >
                {isProcessing ? 'Processing...' : 'Approve'}
              </button>
              <button 
                onClick={() => onReject(application.id)}
                disabled={isProcessing}
                className={`px-4 py-2 rounded transition-colors ${
                  isProcessing 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-red-100 hover:bg-red-200 cursor-pointer'
                }`}
              >
                {isProcessing ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ApprovedList Component
export function ApprovedList({ applications, loading }: ApprovedListProps) {
  if (loading) {
    return <div className="text-center py-8">Loading applications...</div>;
  }

  const approvedApplications = applications.filter(app => app.status === APPLICATION_STATUS.APPROVED);

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-2xl mb-6">Approved Participants</h2>
      {approvedApplications.length === 0 ? (
        <p className="text-gray-500 text-center">No approved participants yet</p>
      ) : (
        approvedApplications.map((application) => (
          <div key={application.id} className="flex justify-between items-center border-b border-gray-200 pb-4">
            <div className="flex-1">
              <p className="font-medium">
                {application.student_name || `Student ${application.studentid}`}
              </p>
              <p className="text-sm text-gray-600">Student ID: {application.studentid}</p>
              <p className="text-xs text-gray-500">
                Approved on: {new Date(application.decision_at || '').toLocaleDateString('en-GB')}
              </p>
            </div>
            <div className="flex gap-4 items-center">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Approved
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// EventDetails Component
export function EventDetails({ event }: EventDetailsProps) {
  return (
    <>
      <Image
        src={event.image}
        alt={event.title || 'Event'}
        width={500}
        height={310}
        className="w-3/4 mx-auto object-cover"
        unoptimized
      />

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Top Info Card */}
        <div className="bg-green-50 rounded-lg p-6 shadow">
          <div className="mb-4">
            <p><strong>Post at:</strong> {event.post}</p>
          </div>
          <div className="grid lg:grid-cols-2 md:grid-cols-2 gap-4">
            {event.datestart === event.dateend ? (
              <p><strong>Date:</strong> {event.datestart} at {event.timestart} - {event.timeend}</p>
            ) : (
              <p><strong>Date:</strong> {event.datestart} {event.timestart} - {event.dateend} {event.timeend}</p>
            )}
            <p><strong>Location:</strong> {event.location}</p>
            <p><strong>Type:</strong> {event.category.join(", ")}</p>
            <p><strong>Capacity:</strong> {event.currentParticipants} / {event.capacity} people</p>
            <p><strong>Organizer:</strong> {event.organizer}</p>
          </div>
        </div>

        {/* Image carousel / gallery */}
        {event.additionalImages.length > 0 && (
          <div className="relative w-full">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex space-x-4 p-2 min-w-full md:justify-center">
                {event.additionalImages
                  .filter((i): i is string => typeof i === 'string')
                  .map((img, index) => (
                    <div key={index} className="flex-shrink-0">
                      <Image
                        src={img}
                        alt={`Event image ${index + 1}`}
                        width={180}
                        height={120}
                        className="rounded-lg object-cover shadow-md hover:scale-105 transition-transform cursor-pointer"
                        unoptimized
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        <h2 className="text-lg font-semibold mb-2">Description</h2>
        <div className="bg-white rounded-lg shadow p-4 min-h-[200px] h-auto w-full">                
          <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
        </div>
      </div>
    </>
  );
}

// Default export
export default {
  ApplicantsList,
  ApprovedList,
  EventDetails,
};