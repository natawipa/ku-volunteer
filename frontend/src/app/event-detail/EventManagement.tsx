import React from 'react';
import Image from 'next/image';
import { APPLICATION_STATUS, CHECK_IN_STYLES } from '../../lib/constants';
import type { ActivityApplication, CheckInRecord } from '../../lib/types';
import { determineCheckInStatus } from './hooks/useCheckInStatus';
import { isActivityEnded, isActivityNotStarted, formatEventDate } from './helpers/utils';

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
  eventEndDate?: string;
  eventStartDate?: string;  // This is already added
}

interface EventDetailsProps {
  event: TransformedEvent;
}

interface CheckInResponse {
  count: number;
  results: CheckInRecord[];
}

// status badge logic
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'checked_in':
      return CHECK_IN_STYLES.CHECKED_IN;
    case 'absent':
      return CHECK_IN_STYLES.ABSENT;
    case APPLICATION_STATUS.APPROVED:
    default:
      return CHECK_IN_STYLES.APPROVED;
  }
};

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
    <div className="space-y-6">
      <h2 className="font-bold text-3xl mb-8">
        Pending Applications
      </h2>

      {pendingApplications.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No pending applications</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 font-semibold text-gray-700 text-sm">
              <div className="col-span-2">Student ID</div>
              <div className="col-span-5 ml-9">Name</div>
              <div className="col-span-5 text-center">Actions</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {pendingApplications.map((application, index) => {
              return (
                <div 
                  key={application.id} 
                  className={`px-6 py-5 hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <div className="grid grid-cols-12 gap-8 items-center">
                    {/* Student ID */}
                    <div className="col-span-2">
                      <p className="font-medium text-gray-900">
                        {application.student_id_external || (application.student ?? application.studentid) || '-'}
                      </p>
                    </div>

                    {/* Name */}
                    <div className="col-span-5 ml-9">
                      <p className="font-medium text-gray-800">
                        {application.student_name || `Student ${application.student_id_external || (application.student ?? application.studentid)}`}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="col-span-5 flex justify-center gap-3">
                      <button 
                        onClick={() => onApprove(application.id)}
                        disabled={isProcessing}
                        className={`flex-1 max-w-[100px] py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                          isProcessing 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'bg-[#79BE7C] text-white hover:bg-[#5A915C] hover:shadow-md transform hover:scale-105'
                        }`}
                      >
                        {isProcessing ? 'Processing...' : 'Approve'}
                      </button>
                      <button 
                        onClick={() => onReject(application.id)}
                        disabled={isProcessing}
                        className={`flex-1 max-w-[100px] py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                          isProcessing 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'bg-[#D2616E] text-white hover:bg-[#C02437] hover:shadow-md transform hover:scale-105'
                        }`}
                      >
                        {isProcessing ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer with count */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Total: <span className="font-semibold text-gray-900">{pendingApplications.length}</span> pending applications
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function ApprovedList({ applications, loading, eventEndDate, eventStartDate }: ApprovedListProps) {
  const [checkInRecords, setCheckInRecords] = React.useState<CheckInRecord[]>([]);
  const [loadingCheckIn, setLoadingCheckIn] = React.useState(false);
  const activityId = applications[0]?.activity_id || applications[0]?.activity;

  // Find check-in record for a student by student ID
  const getStudentCheckInRecord = React.useCallback((studentId: number | null | undefined): CheckInRecord | undefined => {
    if (!studentId || !Array.isArray(checkInRecords)) {
      return undefined;
    }
    
    const record = checkInRecords.find((record: CheckInRecord) => record.student === studentId);
    console.log('Found record for student', studentId, ':', record);
    return record;
  }, [checkInRecords]);

   // Determine status for each application
  const getApplicationStatus = React.useCallback((application: ActivityApplication): string => {
    if (application.status !== APPLICATION_STATUS.APPROVED) {
      return application.status;
    }

    const studentId = application.student ?? application.studentid;
    
    console.log('Look up student with ID:', { studentId, totalRecords: checkInRecords.length, eventEndDate, eventStartDate });
    
    const checkInRecord = getStudentCheckInRecord(studentId);
    console.log('Check-in record result:', checkInRecord);
    
    return determineCheckInStatus(checkInRecord, eventEndDate, eventStartDate);
  }, [checkInRecords, getStudentCheckInRecord, eventEndDate, eventStartDate]);

  // Fetch check-in records for activity
  React.useEffect(() => {
    const fetchCheckInRecords = async () => {
      if (!activityId || applications.length === 0) return;
      
      console.log('Fetch check-in records for activity:', activityId);
      setLoadingCheckIn(true);
      try {
        const { activitiesApi } = await import('../../lib/activities');
        const result = await activitiesApi.getActivityCheckInRecords(activityId);
        
        console.log('Full api result:', result);
        
        if (result.success && result.data) {
          let records: CheckInRecord[] = [];
          
          if (Array.isArray(result.data)) {
            records = result.data;
          } else if (result.data && typeof result.data === 'object' && 'results' in result.data) {
            // Paginated response with { count, results }
            records = (result.data as CheckInResponse).results || [];
          }
          
          console.log('Check-in records extracted:', records);
          setCheckInRecords(records);
        } else {
          console.error('Failed to fetch check-in records:', result.error);
          setCheckInRecords([]);
        }
      } catch (error) {
        console.error('Error fetching check-in records:', error);
        setCheckInRecords([]);
      } finally {
        setLoadingCheckIn(false);
      }
    };

    const activityEnded = isActivityEnded(eventEndDate);
    const activityNotStarted = isActivityNotStarted(eventStartDate);

    if (activityEnded) {
      console.log('Activity has ended - fetching check-in records once');
      fetchCheckInRecords();
      return; // Stop auto-refresh when activity ended
    }

    if (!activityNotStarted) {
      console.log('Activity has started');
      fetchCheckInRecords();
      
      // auto-refresh every 10 seconds
      const interval = setInterval(() => {fetchCheckInRecords();}, 10000);
      return () => clearInterval(interval);
    }

    console.log('Activity has not started yet');
  }, [activityId, applications.length, eventEndDate, eventStartDate]);
  
  if (loading || loadingCheckIn) {
    return <div className="text-center py-8">Loading participants...</div>;
  }

  const approvedApplications = applications.filter(app => app.status === APPLICATION_STATUS.APPROVED);

  const sortedApplications = [...approvedApplications].sort((a, b) => {
    const statusA = getApplicationStatus(a);
    const statusB = getApplicationStatus(b);
    
    const priorityOrder = { 'checked_in': 0, 'absent': 1, [APPLICATION_STATUS.APPROVED]: 2 };
    const priorityA = priorityOrder[statusA as keyof typeof priorityOrder] ?? 3;
    const priorityB = priorityOrder[statusB as keyof typeof priorityOrder] ?? 3;
    
    return priorityA - priorityB;
  });

  return (
    <div className="space-y-6">
      <h2 className="font-bold text-3xl mb-8">
        Approved Participants
      </h2>

      {approvedApplications.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No approved participants yet</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 font-semibold text-gray-700 text-sm">
              <div className="col-span-3">Student ID</div>
              <div className="col-span-4">Name</div>
              <div className="col-span-3">Approve On</div>
              <div className="col-span-2 text-center">Status</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {sortedApplications.map((application, index) => {
              const currentStatus = getApplicationStatus(application);
              const badge = getStatusBadge(currentStatus);
              const approvedDate = application.decision_at 
                ? new Date(application.decision_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric'
                  })
                : '-';
              
              return (
                <div 
                  key={application.id} 
                  className={`px-6 py-5 hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Student ID */}
                    <div className="col-span-3">
                      <p className="font-medium text-gray-900">
                        {application.student_id_external || (application.student ?? application.studentid) || '-'}
                      </p>
                    </div>

                    {/* Name */}
                    <div className="col-span-4">
                      <p className="font-medium text-gray-800">
                        {application.student_name || `Student ${application.student_id_external || (application.student ?? application.studentid)}`}
                      </p>
                    </div>

                    {/* Approve On */}
                    <div className="col-span-3">
                      <p className="text-gray-600 text-sm">
                        {approvedDate}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="col-span-2 flex justify-center">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${badge.bgColor} ${badge.textColor} whitespace-nowrap`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer with count */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Total: <span className="font-semibold text-gray-900">{approvedApplications.length}</span> participants
              {checkInRecords.length > 0 && (
                <span className="ml-4">
                  • <span className="font-semibold text-[#E169A1]">
                    {checkInRecords.filter(r => r.attendance_status === 'present').length}
                  </span> checked in
                </span>
              )}
            </p>
          </div>
        </div>
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
            <p><strong>Date:</strong> {formatEventDate(event.datestart, event.dateend, event.timestart, event.timeend)}</p>
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
const EventManagementExports = {
  ApplicantsList,
  ApprovedList,
  EventDetails,
};

export default EventManagementExports;