import React from 'react';
import Image from 'next/image';
import { APPLICATION_STATUS } from '../../lib/constants';
import type { ActivityApplication, CheckInRecord } from '../../lib/types';

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
}

interface EventDetailsProps {
  event: TransformedEvent;
}

interface CheckInResponse {
  count: number;
  results: CheckInRecord[];
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
                {application.student_name || `Student ${application.student_id_external || (application.student ?? application.studentid)}`}
              </p>
              <p className="text-sm text-gray-600">Student ID: {application.student_id_external || 'Not available'}</p>
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

export function ApprovedList({ applications, loading, eventEndDate }: ApprovedListProps) {
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
    
    console.log('Look up student with ID:', { studentId, totalRecords: checkInRecords.length, eventEndDate });
    
    const checkInRecord = getStudentCheckInRecord(studentId);
    console.log('Check-in record result:', checkInRecord);
    
    // check if student has checked in
    if (checkInRecord?.attendance_status === 'present') {
      console.log('Returning: checked_in');
      return 'checked_in';
    }
    
    // check if student is marked absent by organizer
    if (checkInRecord?.attendance_status === 'absent' && checkInRecord?.marked_absent_at) {
      console.log('Returning: absent (marked by organizer)');
      return 'absent';
    }
    
    // check if activity has end
    if (eventEndDate) {
      const now = new Date();
      const endDate = new Date(eventEndDate);
      
      console.log('Checking end date:', { now: now.toISOString(), endDate: endDate.toISOString(), isEnded: now > endDate });
      
      if (now > endDate) {
        // Activity has ended and student didn't check in = absent
        if (!checkInRecord || (checkInRecord.attendance_status as string) !== 'present') {
          console.log('Returning: absent (activity ended, no check-in)');
          return 'absent';
        }
      }
    }

    // Default: approved (activity ongoing, no check-in yet)
    console.log('Returning: approved');
    return APPLICATION_STATUS.APPROVED;
  }, [checkInRecords, getStudentCheckInRecord, eventEndDate]);

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

    const isActivityEnded = eventEndDate && new Date() > new Date(eventEndDate);

    if (isActivityEnded) {
      console.log('Activity has ended - fetching check-in records once');
      fetchCheckInRecords();
      return; // Stop auto-refresh when activity ended
    }

    // Fetch immediately if activity is ongoing
    fetchCheckInRecords();
    
    // auto-refresh every 10 seconds
    const interval = setInterval(() => {
      console.log('Auto-refreshing check-in records...');
      fetchCheckInRecords();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [activityId, applications.length, eventEndDate]);
  
  // Get status badge color and label
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked_in':
        return { bgColor: 'bg-[#FFEAF4]', textColor: 'text-[#E169A1]', label: 'Checked In' };
      case 'absent':
        return { bgColor: 'bg-[#FFE8B1]', textColor: 'text-[#C08A06]', label: 'Absent' };
      case APPLICATION_STATUS.APPROVED:
      default:
        return { bgColor: 'bg-[#D6E9D5]', textColor: 'text-[#215700]', label: 'Approved' };
    }
  };
  
  if (loading || loadingCheckIn) {
    return <div className="text-center py-8">Loading participants...</div>;
  }

  const approvedApplications = applications.filter(app => app.status === APPLICATION_STATUS.APPROVED);

    const sortedApplications = [...approvedApplications].sort((a, b) => {
    const statusA = getApplicationStatus(a);
    const statusB = getApplicationStatus(b);
    
    // Priority order: checked_in > absent > approved
    const priorityOrder = { 'checked_in': 0, 'absent': 1, [APPLICATION_STATUS.APPROVED]: 2 };
    const priorityA = priorityOrder[statusA as keyof typeof priorityOrder] ?? 3;
    const priorityB = priorityOrder[statusB as keyof typeof priorityOrder] ?? 3;
    
    return priorityA - priorityB;
  });

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-2xl mb-6">
        Approved Participants ({approvedApplications.length})
        {checkInRecords.length > 0 && (
          <span className="text-sm font-normal text-gray-600 ml-2">
            ({checkInRecords.filter(r => r.attendance_status === 'present').length} checked in)
          </span>
        )}
      </h2>
      {approvedApplications.length === 0 ? (
        <p className="text-gray-500 text-center">No approved participants yet</p>
      ) : (
        sortedApplications.map((application) => {
          const currentStatus = getApplicationStatus(application);
          const badge = getStatusBadge(currentStatus);
          
          return (
            <div key={application.id} className="flex justify-between items-center border-b border-gray-200 pb-4 hover:bg-gray-50 p-2 rounded transition-colors">
              <div className="flex-1">
                <p className="font-medium">
                  {application.student_name || `Student ${application.student_id_external || (application.student ?? application.studentid)}`}
                </p>
                <p className="text-sm text-gray-600">Student ID: {application.student_id_external || 'Not available'}</p>
                <p className="text-xs text-gray-500">
                  Approved on: {new Date(application.decision_at || '').toLocaleDateString('en-GB')}
                </p>
              </div>
              <div className="flex gap-4 items-center">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${badge.bgColor} ${badge.textColor} whitespace-nowrap`}>
                  {badge.label}
                </span>
              </div>
            </div>
          );
        })
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
const EventManagementExports = {
  ApplicantsList,
  ApprovedList,
  EventDetails,
};

export default EventManagementExports;