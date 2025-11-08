import React, { useState } from 'react';
import { APPLICATION_STATUS, ACTIVITY_STATUS, USER_ROLES } from '../../../lib/constants';
import type { Activity } from '../../../lib/types';
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

const mockCode = "AB1234";

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
  
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // Parse dates - remove UTC interpretation since backend already stores Thai time
  const parseActivityDate = (dateString: string | undefined) => {
    if (!dateString) return null;
    
    // parse as local Thai time (not UTC)
    const dateWithoutZ = dateString.replace('Z', '');
    const date = new Date(dateWithoutZ);
    
    console.log('Parsing date:', dateString, '→', date.toLocaleString('th-TH'));
    
    return date;
  };

  const activityStartDate = event.start_at ? parseActivityDate(event.start_at) : null;
  const activityEndDate = event.end_at ? parseActivityDate(event.end_at) : null;

  // ORGANIZER: Check if today's UTC date is within the event UTC date range
  const isOrganizerCanCheckIn = () => {
    if (!activityStartDate || !activityEndDate) return false;
    
    const nowUTC = new Date();
    
    // Get UTC dates (ignore time)
    const todayUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate()));
    const eventStartUTC = new Date(Date.UTC(activityStartDate.getUTCFullYear(), activityStartDate.getUTCMonth(), activityStartDate.getUTCDate()));
    const eventEndUTC = new Date(Date.UTC(activityEndDate.getUTCFullYear(), activityEndDate.getUTCMonth(), activityEndDate.getUTCDate()));
    
    const isInRange = todayUTC >= eventStartUTC && todayUTC <= eventEndUTC;
    
    console.log('ORGANIZER UTC Date Check:');
    console.log('Today UTC:', todayUTC.toISOString());
    console.log('Event UTC:', eventStartUTC.toISOString(), 'to', eventEndUTC.toISOString());
    console.log('Can Check-in:', isInRange);
    
    return isInRange;
  };

    // STUDENT: Check if current time is within the event time range
  const isStudentCanCheckIn = () => {
    if (!activityStartDate || !activityEndDate) return false;

    // Get current time in Thailand (no conversion needed)
    const nowLocal = new Date();
    
    // Backend times are already correct Thai times, use them as-is
    const isInRange = nowLocal >= activityStartDate && nowLocal <= activityEndDate;

    console.log('STUDENT Check:');
    console.log('Now:', nowLocal.toLocaleString('th-TH'));
    console.log('Event Start:', activityStartDate.toLocaleString('th-TH'));
    console.log('Event End:', activityEndDate.toLocaleString('th-TH'));
    console.log('Can Check-in:', isInRange);

    return isInRange;
  };

  // Format UTC time for display
  const formatUTCTimeForDisplay = (date: Date | null) => {
    if (!date) return '--:--';
    return `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;
  };

  const isActivityOver = activityEndDate ? (new Date() > activityEndDate) : false;

  const handleCheckInSubmit = async (code: string) => {
    setIsCheckingIn(true);
    console.log('Submitting check-in code:', code);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Check-in successful for code:', code);
      alert(`Check-in successful! Code: ${code}`);
      setShowCheckInModal(false);
    } catch (error) {
      console.error('Check-in failed:', error);
      alert('Check-in failed. Please try again.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckInClick = () => {
    setShowCheckInModal(true);
  };

  // DEBUG LOGS
  console.log('=== ACTIONBUTTON DEBUG ===');
  console.log('Role:', role);
  console.log('Application Status:', applicationStatus);
  console.log('Event UTC Times:', formatUTCTimeForDisplay(activityStartDate), 'to', formatUTCTimeForDisplay(activityEndDate));
  console.log('Current UTC Time:', new Date().toISOString());
  console.log('=== END DEBUG ===');

  // ORGANIZER LOGIC
  if (role === USER_ROLES.ORGANIZER) {
    if (isOrganizerCanCheckIn()) {
      console.log('ORGANIZER: Within event date range = check in');
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
            onClose={() => setShowCheckInModal(false)}
            onSubmit={handleCheckInSubmit}
            isLoading={isCheckingIn}
            role={role}
            organizerCode={mockCode}
          />
        </>
      );
    } if (isActivityOver) {
      console.log('ORGANIZER: Event is over = event ended');
      return (
        <button
          disabled
          className="bg-gray-400 text-white px-8 py-3 rounded-lg cursor-not-allowed font-medium"
        >
          Event Ended
        </button>
      );
    } else {
      console.log('ORGANIZER: NOT within event date range = edit');
      return (
        <Link href={{ pathname: '/new-event', query: { edit: eventID?.toString(), activityData: encodeURIComponent(JSON.stringify(event)) }}}
          className={greenActionButton}>
          Edit Event
        </Link>
      );
    }
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
      console.log('STUDENT: Approved + During UTC date/time range = can check in');
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
            onClose={() => setShowCheckInModal(false)}
            onSubmit={handleCheckInSubmit}
            isLoading={isCheckingIn}
            role={role}
          />
        </>
      );
    } if (isActivityOver) {
      console.log('ORGANIZER: Event is over = event ended');
      return (
        <button
          disabled
          className="bg-gray-400 text-white px-8 py-3 rounded-lg cursor-not-allowed font-medium"
        >
          Event Ended
        </button>
      );
    } else {
      console.log('STUDENT: Approved but not during  date/time = approved message');

      return (
        <div className="text-center">
          <div className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium">
            You&apos;re Approved!
          </div>
          {/* <p className="text-sm text-gray-600 mt-2">
            {activityStartDate && activityEndDate
              ? `Check-in available from ${formatUTCTimeForDisplay(activityStartDate)} to ${formatUTCTimeForDisplay(activityEndDate)} UTC`
              : 'Check "My Events" for details'
            }
          </p> */}
        </div>
      );
    }
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