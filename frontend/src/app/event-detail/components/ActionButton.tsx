import React, { useState } from 'react';
import { APPLICATION_STATUS, ACTIVITY_STATUS, USER_ROLES } from '../../../lib/constants';
import type { Activity } from '../../../lib/types';
import { activitiesApi } from '../../../lib/activities';
import Link from 'next/link';
import CheckIn from './Check-in';

interface EventActionButtonProps {
  applicationStatus?: string | null;
  applying?: boolean;
  event: Activity;
  onApply?: () => void;
  onCancel?: () => void;
  role: string | null;
  eventID?: number | null;
}

export default function EventActionButton({
  applicationStatus,
  applying,
  event,
  onApply,
  onCancel,
  role,
  eventID,
}: EventActionButtonProps) {
  const greenActionButton = "bg-[#96C693] text-white px-8 py-3 rounded-lg hover:bg-[#72A070] cursor-pointer transition-all text-center";
  
  const activityId = eventID || event?.id;
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const parseActivityDate = (dateString: string | undefined) => {
    if (!dateString) return null;
    // Backend stores UTC internally but with Bangkok timezone setting
    // Just parse it directly - no manipulation needed
    return new Date(dateString);
  };

  const isMultiDayActivity = () => {
    if (!activityStartDate || !activityEndDate) return false;
    
    const startDay = new Date(activityStartDate);
    startDay.setHours(0, 0, 0, 0);
    
    const endDay = new Date(activityEndDate);
    endDay.setHours(0, 0, 0, 0);
    
    return startDay.getTime() !== endDay.getTime();
  };

  const isStudentCanCheckIn = () => {
    if (!activityStartDate || !activityEndDate) return false;
    const now = new Date();
    return now >= activityStartDate && now <= activityEndDate;
  };

  const activityStartDate = event.start_at ? parseActivityDate(event.start_at) : null;
  const activityEndDate = event.end_at ? parseActivityDate(event.end_at) : null;

  // ORGANIZER: Check if today's UTC date is within the event UTC date range
  const isOrganizerCanCheckIn = () => {
    if (!activityStartDate || !activityEndDate) return false;
    
    const nowUTC = new Date();
    const todayUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate()));
    const eventStartUTC = new Date(Date.UTC(activityStartDate.getUTCFullYear(), activityStartDate.getUTCMonth(), activityStartDate.getUTCDate()));
    const eventEndUTC = new Date(Date.UTC(activityEndDate.getUTCFullYear(), activityEndDate.getUTCMonth(), activityEndDate.getUTCDate()));
    
    return todayUTC >= eventStartUTC && todayUTC <= eventEndUTC;
  };

  const isActivityOver = activityEndDate ? (new Date() > activityEndDate) : false;

  const handleCheckInSubmit = async (code: string) => {
    setIsCheckingIn(true);
    console.log('📡 Submitting check-in code:', code);
    
    try {
      const result = await activitiesApi.submitCheckIn(activityId || 0, code);
      
      console.log('Check-in API result:', result);
      
      if (result.success) {
        console.log('Check-in successful!', result.data);
        alert('Check-in successful! Your attendance has been recorded.');
        
        // Close modal if not multi-day activity
        if (!isMultiDayActivity()) {
          setShowCheckInModal(false);
        }
        // Check-in.tsx handle state update
      } else {
        const errorMsg = result.error || 'Unknown error';
        console.error('Check-in failed:', errorMsg);
        
        if (errorMsg.toLowerCase().includes('already')) {
          if (isMultiDayActivity()) {
            alert(`Already Checked In Today\n\nCome back tomorrow to check in again!`);
          } else {
            alert(`Already Checked In\n\nYou have already checked in to this activity.`);
            setShowCheckInModal(false);
          }
        } else if (errorMsg.toLowerCase().includes('code')) {
          alert(`Invalid Code\n\n${errorMsg}\n\nPlease ask the organizer for the correct code.`);
        } else if (errorMsg.toLowerCase().includes('not started')) {
          alert(`Activity Not Started\n\n${errorMsg}`);
        } else if (errorMsg.toLowerCase().includes('ended')) {
          alert(`Activity Ended\n\n${errorMsg}`);
        } else {
          alert(`Check-in failed:\n${errorMsg}`);
        }
      }
    } catch (error) {
      console.error('Check-in exception:', error);
      alert('Check-in failed. Please try again.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckInClick = () => {
    setShowCheckInModal(true);
  };

  const handleModalClose = () => {
    setShowCheckInModal(false);
  };

  // ORGANIZER LOGIC
  if (role === USER_ROLES.ORGANIZER) {
    if (isOrganizerCanCheckIn()) {
      return (
        <>
          <button
            onClick={handleCheckInClick}
            disabled={applying}
            className={greenActionButton}
          >
            {applying ? 'Checking In...' : 'Check In'}
          </button>
          
          <CheckIn
            isOpen={showCheckInModal}
            onClose={handleModalClose}
            onSubmit={handleCheckInSubmit}
            isLoading={isCheckingIn}
            role={role}
            activityId={activityId} 
            isMultiDay={isMultiDayActivity()}
          />
        </>
      );
    }
    
    if (isActivityOver) {
      return (
        <button
          disabled
          className="bg-gray-400 text-white px-8 py-3 rounded-lg cursor-not-allowed font-medium"
        >
          Event Ended
        </button>
      );
    }
    
    return (
      <Link href={{ pathname: '/new-event', query: { edit: eventID?.toString(), activityData: encodeURIComponent(JSON.stringify(event)) }}}
        className={greenActionButton}>
        Edit Event
      </Link>
    );
  }

  // STUDENT LOGIC
  if (applicationStatus === APPLICATION_STATUS.PENDING) {
    return (
      <button
        onClick={onCancel}
        disabled={applying}
        className="bg-yellow-600 text-white px-8 py-3 rounded-lg hover:bg-yellow-700 cursor-pointer transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {applying ? 'Cancelling...' : 'Cancel Application'}
      </button>
    );
  }

  if (applicationStatus === APPLICATION_STATUS.APPROVED) {
    if (isStudentCanCheckIn()) {
      return (
        <>
          <button
            onClick={handleCheckInClick}
            disabled={applying}
            className={greenActionButton}
          >
            {applying ? 'Checking In...' : 'Check In'}
          </button>

          <CheckIn
            isOpen={showCheckInModal}
            onClose={handleModalClose}
            onSubmit={handleCheckInSubmit}
            isLoading={isCheckingIn}
            role={role}
            activityId={activityId}
            isMultiDay={isMultiDayActivity()}
          />
        </>
      );
    }

    if (isActivityOver) {
      return (
        <button
          disabled
          className="bg-gray-400 text-white px-8 py-3 rounded-lg cursor-not-allowed font-medium"
        >
          Event Ended
        </button>
      );
    }

    return (
      <div className="text-center">
        <div className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium">
          ✅ You&apos;re Approved!
        </div>
        {activityStartDate && (
          <p className="text-sm text-gray-600 mt-2">
            Check-in available from {activityStartDate.toLocaleString('th-TH')}
          </p>
        )}
      </div>
    );
  }  
  
  if (applicationStatus === APPLICATION_STATUS.REJECTED) {
    return (
      <button
        disabled
        className="bg-gray-400 text-white px-8 py-3 rounded-lg cursor-not-allowed font-medium"
      >
        Application Rejected
      </button>
    );
  }

  if (applicationStatus === APPLICATION_STATUS.CANCELLED) {
    return (
      <button
        disabled
        className="bg-gray-400 text-white px-8 py-3 rounded-lg cursor-not-allowed font-medium"
      >
        Cancelled
      </button>
    );
  }

  const canApply = !event?.capacity_reached && (event?.status === ACTIVITY_STATUS.OPEN || event?.status === ACTIVITY_STATUS.UPCOMING);
  
  return (
    <button
      onClick={onApply}
      disabled={applying || !canApply}
      className={`px-8 py-3 rounded-lg cursor-pointer transition-all duration-200 font-medium ${
        !canApply
          ? 'bg-gray-400 text-white cursor-not-allowed'
          : 'bg-green-600 text-white hover:bg-green-700'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {applying ? 'Applying...' : 'Apply Now'}
    </button>
  );
}