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

export function determineCheckInStatus(
  checkInRecord: CheckInRecord | undefined,
  eventEndDate: string | undefined,
  eventStartDate: string | undefined
): string {  
  // if student has checked in
  if (checkInRecord?.attendance_status === 'present') {
    console.log('Student is CHECKED_IN (present)');
    return 'checked_in';
  }

  // if student is marked absent by organizer or system
  if (checkInRecord?.attendance_status === 'absent') {
    console.log('Student is ABSENT (marked)');
    return 'absent';
  }
  
  // Check if activity has started
  if (eventStartDate) {
    const now = new Date();
    const startDate = new Date(eventStartDate);
    
    console.log('Checking if activity has started:', { now, startDate, hasStarted: now >= startDate });
    
    if (now >= startDate) {
      // Activity has started and student hasn't checked in = absent
      return 'absent';
    }
  }
  
  // if activity has ended
  if (eventEndDate) {
    const now = new Date();
    const endDate = new Date(eventEndDate);
    
    if (now > endDate) {
      // Activity has ended and student didn't check in = absent
      return 'absent';
    }
  }

  // approved (activity not started yet)
  return APPLICATION_STATUS.APPROVED;
}