import type { Activity, CheckInRecord } from '../../../lib/types';
import { APPLICATION_STATUS } from '../../../lib/constants';

import { useCallback, useEffect, useState } from 'react';
import { activitiesApi } from '../../../lib/activities';
import { isActivityOngoing, isActivityEnded } from '../helpers/utils';

type CheckInStatusType = 
  | typeof APPLICATION_STATUS.PENDING
  | typeof APPLICATION_STATUS.APPROVED 
  | typeof APPLICATION_STATUS.CHECKED_IN
  | typeof APPLICATION_STATUS.PLEASE_CHECKIN
  | typeof APPLICATION_STATUS.ABSENT;

export function useCheckInStatus(
  eventId: number | null,
  event: Activity | null,
  applicationStatus: string | null,
  isStudent: boolean
): CheckInStatusType | null {
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatusType | null>(null);

  const determineStatus = useCallback(async (): Promise<CheckInStatusType> => {
    if (!isStudent || !eventId || !event || applicationStatus !== APPLICATION_STATUS.APPROVED) {
      return (applicationStatus as CheckInStatusType) || APPLICATION_STATUS.PENDING;
    }

    try {
      const result = await activitiesApi.getCheckInStatus(eventId);
      
      // If checked in already
      if (result.success && result.data?.attendance_status === 'present') {
        return APPLICATION_STATUS.CHECKED_IN;
      }

      if (isActivityOngoing(event.start_at, event.end_at)) {
        return APPLICATION_STATUS.PLEASE_CHECKIN;
      }

      if (isActivityEnded(event.end_at)) {
        return APPLICATION_STATUS.ABSENT;
      }

      return APPLICATION_STATUS.APPROVED;
    } catch (error) {
      console.error('Error checking check-in status:', error);
      return (applicationStatus as CheckInStatusType) || APPLICATION_STATUS.PENDING;
    }
  }, [isStudent, eventId, event, applicationStatus]);

  useEffect(() => {
    if (isStudent && eventId && event && applicationStatus === APPLICATION_STATUS.APPROVED) {
      const updateStatus = async () => {
        const status = await determineStatus();
        setCheckInStatus(status);
      };

      updateStatus();
      const interval = setInterval(updateStatus, 10000);
      return () => clearInterval(interval);
    } else {
      setCheckInStatus(null);
    }
  }, [isStudent, eventId, event, applicationStatus, determineStatus]);

  return checkInStatus;
}

/**
 * Parse date string that can be either ISO format or DD/MM/YYYY format
 */
function parseActivityDate(dateString: string): Date {
  // Check if it's ISO format (contains 'T' or '-' in YYYY-MM-DD pattern)
  if (dateString.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    return new Date(dateString);
  }
  
  // Parse DD/MM/YYYY format
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    // Month is 0-indexed in JavaScript Date
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Fallback to default parsing
  return new Date(dateString);
}

export function determineCheckInStatus(
  checkInRecord: CheckInRecord | undefined,
  eventEndDate: string | undefined,
  eventStartDate?: string | undefined
): string {
  // if student has checked in
  if (checkInRecord?.attendance_status === 'present') {
    return APPLICATION_STATUS.CHECKED_IN;
  }

  // if student is marked absent by organizer
  if (checkInRecord?.attendance_status === 'absent' && checkInRecord?.marked_absent_at) {
    return APPLICATION_STATUS.ABSENT;
  }
  
  const now = new Date();
  
  // Check if activity has started
  if (eventStartDate) {
    const startDate = parseActivityDate(eventStartDate);
    // If activity hasn't started yet, show approved status
    if (now < startDate) {
      return APPLICATION_STATUS.APPROVED;
    }
  }
  
  // if activity has ended
  if (eventEndDate) {
    const endDate = parseActivityDate(eventEndDate);
    
    if (now > endDate) {
      // Activity has ended and student didn't check in = absent
      if (!checkInRecord || checkInRecord.attendance_status as string!== 'present') {
        return APPLICATION_STATUS.ABSENT;
      }
    }
  }

  // If activity has started (but not ended) and student hasn't checked in = absent
  if (eventStartDate) {
    const startDate = parseActivityDate(eventStartDate);
    if (now >= startDate && (!checkInRecord || (checkInRecord.attendance_status as string) !== 'present')) {
      return APPLICATION_STATUS.ABSENT;
    }
  }

  // Default: approved (shouldn't reach here if dates are provided)
  return APPLICATION_STATUS.APPROVED;
}