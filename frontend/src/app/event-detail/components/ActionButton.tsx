import React, { useState } from 'react';
import { APPLICATION_STATUS, ACTIVITY_STATUS, USER_ROLES, BUTTON_STYLES } from '../../../lib/constants';
import type { Activity } from '../../../lib/types';
import { activitiesApi } from '../../../lib/activities';
import Link from 'next/link';
import CheckIn from './Check-in';
import { isActivityEnded, isActivityOngoing, isWithinActivityDateRange, parseActivityDate } from '../helpers/utils';
import { useModal } from '../../components/Modal';

interface EventActionButtonProps {
  applicationStatus?: string | null;
  applying?: boolean;
  event: Activity;
  onApply?: () => void;
  onCancel?: () => void;
  role: string | null;
  eventID?: number | null;
  onCheckInSuccess?: () => void;
}

export default function EventActionButton({
  applicationStatus,
  applying,
  event,
  onApply,
  onCancel,
  role,
  eventID,
  onCheckInSuccess,
}: EventActionButtonProps) {
  const activityId = eventID || event?.id;
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const { showModal } = useModal();
  
  const activityStartDate = parseActivityDate(event.start_at);
  const activityEndDate = parseActivityDate(event.end_at);

  const handleCheckInSubmit = async (code: string) => {
    setIsCheckingIn(true);
    console.log('Submitting check-in code:', code);
    
    try {
      const result = await activitiesApi.submitCheckIn(activityId || 0, code);
      
      console.log('Check-in API result:', result);
      
      if (result.success) {
        showModal('Check-in successful! Your attendance has been recorded.');
        if (onCheckInSuccess) onCheckInSuccess();
        setShowCheckInModal(false);
      } else {
        const errorMsg = result.error || 'Unknown error';
        console.error('Check-in failed:', errorMsg);
        
        if (errorMsg.toLowerCase().includes('already')) {
          showModal('You have already checked in to this activity.');
          setShowCheckInModal(false);
        } else if (errorMsg.toLowerCase().includes('code')) {
          showModal(`Invalid Code, Please ask the organizer for the correct code.`);
        } else {
          showModal(`Check-in failed:\n${errorMsg}`);
        }
      }
    } catch (error) {
      console.error('Check-in exception:', error);
      showModal('Check-in failed. Please try again.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  // ORGANIZER LOGIC
  if (role === USER_ROLES.ORGANIZER) {
    if (isWithinActivityDateRange(activityStartDate, activityEndDate)) {
      return (
        <>
          <button onClick={() => setShowCheckInModal(true)} disabled={applying} className={BUTTON_STYLES.PRIMARY}>
            {applying ? 'Checking In...' : 'Check In'}
          </button>
          <CheckIn
            isOpen={showCheckInModal}
            onClose={() => setShowCheckInModal(false)}
            onSubmit={handleCheckInSubmit}
            isLoading={isCheckingIn}
            role={role}
            activityId={activityId} 
          />
        </>
      );
    }
    
    if (isActivityEnded(activityEndDate)) {
      return <button disabled className={BUTTON_STYLES.DISABLED}>Event Ended</button>;
    }
    
    return (
      <Link 
        href={{ pathname: '/new-event', query: { edit: eventID?.toString(), activityData: encodeURIComponent(JSON.stringify(event)) }}}
        className={BUTTON_STYLES.PRIMARY}
      >
        Edit Event
      </Link>
    );
  }

  // STUDENT LOGIC
  if (applicationStatus === APPLICATION_STATUS.PENDING) {
    return (
      <button onClick={onCancel} disabled={applying} className="bg-yellow-600 text-white px-8 py-3 rounded-lg hover:bg-yellow-700 cursor-pointer transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
        {applying ? 'Cancelling...' : 'Cancel Application'}
      </button>
    );
  }

  if (applicationStatus === APPLICATION_STATUS.APPROVED) {
    if (isActivityOngoing(activityStartDate, activityEndDate)) {
      return (
        <>
          <button onClick={() => setShowCheckInModal(true)} disabled={applying} className={BUTTON_STYLES.PRIMARY}>
            {applying ? 'Checking In...' : 'Check In'}
          </button>
          <CheckIn
            isOpen={showCheckInModal}
            onClose={() => setShowCheckInModal(false)}
            onSubmit={handleCheckInSubmit}
            isLoading={isCheckingIn}
            role={role}
            activityId={activityId}
          />
        </>
      );
    }

    if (isActivityEnded(activityEndDate)) {
      return <button disabled className={BUTTON_STYLES.DISABLED}>Event Ended</button>;
    }

    return (
      <div className="text-center">
        <div className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium">You&apos;re Approved!</div>
        {activityStartDate && (
          <p className="text-sm text-gray-600 mt-2">
            Check-in available from {activityStartDate.toLocaleString('th-TH')}
          </p>
        )}
      </div>
    );
  }  
  
  if (applicationStatus === APPLICATION_STATUS.REJECTED) {
    return <button disabled className={BUTTON_STYLES.DISABLED}>Application Rejected</button>;
  }

  if (applicationStatus === APPLICATION_STATUS.CANCELLED) {
    return <button disabled className={BUTTON_STYLES.DISABLED}>Cancelled</button>;
  }

  const canApply = !event?.capacity_reached && (event?.status === ACTIVITY_STATUS.OPEN || event?.status === ACTIVITY_STATUS.UPCOMING);
  
  return (
    <button
      onClick={onApply}
      disabled={applying || !canApply}
      className={`px-8 py-3 rounded-lg cursor-pointer transition-all duration-200 font-medium ${
        !canApply ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {applying ? 'Applying...' : 'Apply Now'}
    </button>
  );
}