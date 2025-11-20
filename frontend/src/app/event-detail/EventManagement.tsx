import React from 'react';
import Image from 'next/image';
import { APPLICATION_STATUS, CHECK_IN_STYLES } from '../../lib/constants';
import type { ActivityApplication, CheckInRecord } from '../../lib/types';
import { determineCheckInStatus } from './hooks/useCheckInStatus';
import { isActivityEnded, isActivityNotStarted, formatEventDate } from './helpers/utils';
import { Download } from 'lucide-react';

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
  eventStartDate?: string;
  eventTitle?: string;
}

interface EventDetailsProps {
  event: TransformedEvent;
}

interface CheckInResponse {
  count: number;
  results: CheckInRecord[];
}

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
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 font-semibold text-gray-700 text-sm">
              <div className="col-span-2">Student ID</div>
              <div className="col-span-5 ml-9">Name</div>
              <div className="col-span-5 text-center">Actions</div>
            </div>
          </div>

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
                    <div className="col-span-2">
                      <p className="font-medium text-gray-900">
                        {application.student_id_external || (application.student ?? application.studentid) || '-'}
                      </p>
                    </div>

                    <div className="col-span-5 ml-9">
                      <p className="font-medium text-gray-800">
                        {application.student_name || `Student ${application.student_id_external || (application.student ?? application.studentid)}`}
                      </p>
                    </div>

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

export function ApprovedList({ applications, loading, eventEndDate, eventStartDate, eventTitle }: ApprovedListProps) {
  const [checkInRecords, setCheckInRecords] = React.useState<CheckInRecord[]>([]);
  const [loadingCheckIn, setLoadingCheckIn] = React.useState(false);
  const activityId = applications[0]?.activity_id || applications[0]?.activity;

  const getStudentCheckInRecord = React.useCallback((studentId: number | null | undefined): CheckInRecord | undefined => {
    if (!studentId || !Array.isArray(checkInRecords)) {
      return undefined;
    }
    
    const record = checkInRecords.find((record: CheckInRecord) => record.student === studentId);
    return record;
  }, [checkInRecords]);

  const getApplicationStatus = React.useCallback((application: ActivityApplication): string => {
    if (application.status !== APPLICATION_STATUS.APPROVED) {
      return application.status;
    }

    const studentId = application.student ?? application.studentid;
    const checkInRecord = getStudentCheckInRecord(studentId);
    
    return determineCheckInStatus(checkInRecord, eventEndDate, eventStartDate);
  }, [getStudentCheckInRecord, eventEndDate, eventStartDate]);

  React.useEffect(() => {
    const fetchCheckInRecords = async () => {
      if (!activityId || applications.length === 0) return;
      
      setLoadingCheckIn(true);
      try {
        const { activitiesApi } = await import('../../lib/activities');
        const result = await activitiesApi.getActivityCheckInRecords(activityId);
        
        if (result.success && result.data) {
          let records: CheckInRecord[] = [];
          
          if (Array.isArray(result.data)) {
            records = result.data;
          } else if (result.data && typeof result.data === 'object' && 'results' in result.data) {
            records = (result.data as CheckInResponse).results || [];
          }
          
          setCheckInRecords(records);
        } else {
          setCheckInRecords([]);
        }
      } catch {
        setCheckInRecords([]);
      } finally {
        setLoadingCheckIn(false);
      }
    };

    const activityEnded = isActivityEnded(eventEndDate);
    const activityNotStarted = isActivityNotStarted(eventStartDate);

    if (activityEnded) {
      fetchCheckInRecords();
      return;
    }

    if (!activityNotStarted) {
      fetchCheckInRecords();
      
      const interval = setInterval(() => {fetchCheckInRecords();}, 10000);
      return () => clearInterval(interval);
    }

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

  const exportToCSV = () => {
    const csvData: string[][] = [
      ['Student ID', 'First Name', 'Last Name', 'Status', 'Checked In At']
    ];

    sortedApplications.forEach(application => {
      const currentStatus = getApplicationStatus(application);
      const badge = getStatusBadge(currentStatus);
      
      const studentId = String(
        application.student_id_external || 
        application.student || 
        application.studentid || 
        '-'
      );
      
      const fullName = application.student_name || '';
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '-';
      const lastName = nameParts.slice(1).join(' ') || '-';
      
      const studentCheckInId = application.student ?? application.studentid;
      const checkInRecord = studentCheckInId ? getStudentCheckInRecord(studentCheckInId) : undefined;
      
      const checkedInAt = checkInRecord?.checked_in_at 
        ? new Date(checkInRecord.checked_in_at).toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        : '-';

      csvData.push([
        studentId,
        firstName,
        lastName,
        badge.label,
        checkedInAt
      ]);
    });

    const csvContent = csvData
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    const TitleForCsv = (eventTitle || 'activity')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '_') 
      .toLowerCase()
      .substring(0, 50);
    
    const filename = `${TitleForCsv}_attendance_${dateStr}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activityEnded = isActivityEnded(eventEndDate);

  return (
    <div className="space-y-6">
      <h2 className="font-bold text-3xl mb-8">
        Approved Participants
      </h2>

      {approvedApplications.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No approved participants yet</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 font-semibold text-gray-700 text-sm">
              <div className="col-span-3">Student ID</div>
              <div className="col-span-4">Name</div>
              <div className="col-span-3">Approve On</div>
              <div className="col-span-2 text-center">Status</div>
            </div>
          </div>

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
                    <div className="col-span-3">
                      <p className="font-medium text-gray-900">
                        {application.student_id_external || (application.student ?? application.studentid) || '-'}
                      </p>
                    </div>

                    <div className="col-span-4">
                      <p className="font-medium text-gray-800">
                        {application.student_name || `Student ${application.student_id_external || (application.student ?? application.studentid)}`}
                      </p>
                    </div>

                    <div className="col-span-3">
                      <p className="text-gray-600 text-sm">
                        {approvedDate}
                      </p>
                    </div>

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

          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
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

              {activityEnded && (
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-[#D6E9D5] text-[#215700] rounded-lg hover:bg-[#9EBF9C] hover:text-[#1C4B00] transition-colors text-sm font-medium hover:shadow-md"
                  title="Download attendance report as CSV">
                  <Download size={16} />
                  <span className="hidden sm:inline">Download CSV</span>
                  <span className="sm:hidden">CSV</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

        <h2 className="text-lg font-semibold mb-2">Description</h2>
        <div className="bg-white rounded-lg shadow p-4 min-h-[200px] h-auto w-full">                
          <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
        </div>
      </div>
    </>
  );
}

const EventManagementExports = {
  ApplicantsList,
  ApprovedList,
  EventDetails,
};

export default EventManagementExports;