"use client";
import Link from "next/link";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import { activitiesApi } from "../../../lib/activities";
import type { ActivityApplication } from "../../../lib/types";
import { auth, transformActivityData } from "../../../lib/utils";
import { USER_ROLES, ACTIVITY_STATUS } from "../../../lib/constants";

import Header from "../../components/Header";
import Navbar from "@/app/components/Navbar";
import HeroImage from "@/app/components/HeroImage";
import EventStatusBadge from "../components/StatusBadge";
import ActionButton from "../components/ActionButton";
import OrganizerSection from "../components/OrganizerSection";
import { ApplicantsList, ApprovedList, EventDetails } from "../EventManagement";
import RejectionModal from "../components/OrganizerRejectionModal";
import { useEventData } from "../hooks/useEventData";
import { ApplicationManagement } from "../hooks/ApplicationManagement";
import { useCheckInStatus } from '../hooks/useCheckInStatus';


interface PageProps { params: Promise<{ id: string }> }

export default function EventPage({ params }: PageProps) {
  const [eventId, setEventId] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'details' | 'applicants' | 'approved'>('details');
  const router = useRouter();
  const actionButtonRef = React.useRef<HTMLDivElement>(null);
  
  // Organizer state
  const [applications, setApplications] = useState<ActivityApplication[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPendingDeletion, setHasPendingDeletion] = useState(false);

  // Rejection modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Custom hooks
  const { event, loading, error } = useEventData(eventId);
  const { 
    applicationStatus, 
    applying, 
    checkUserApplication, 
    handleApply, 
    handleCancelApplication 
  } = ApplicationManagement(eventId, userRole === USER_ROLES.STUDENT);
  
  const studentCheckInStatus = useCheckInStatus(
    eventId,
    event,
    applicationStatus,
    userRole === USER_ROLES.STUDENT
  );

  // Extract event ID from params
  useEffect(() => {
    let active = true;
    Promise.resolve(params).then(p => { 
      if (active) setEventId(parseInt(p.id, 10)); 
    });
    return () => { active = false; };
  }, [params]);

  // Check authentication
  useEffect(() => {
    setIsAuthenticated(auth.isAuthenticated());
    setUserRole(auth.getUserRole());
  }, []);

  // Fetch applications for organizers
  const fetchApplications = useCallback(async () => {
    if (eventId == null || Number.isNaN(eventId) || userRole !== USER_ROLES.ORGANIZER) return;
    try {
      setLoadingApplications(true);
      const response = await activitiesApi.getActivityApplications(eventId);
      if (response.success && response.data) setApplications(response.data);
    } catch (err) {
      console.error('Network error fetching applications:', err);
    } finally {
      setLoadingApplications(false);
    }
  } , [eventId, userRole]);

  // Check for pending deletion request
  const checkDeletionRequest = useCallback(async () => {
    if (eventId == null || Number.isNaN(eventId) || userRole !== USER_ROLES.ORGANIZER) return;
    
    try {
      console.log('Checking deletion requests for activity:', eventId);
      const response = await activitiesApi.getDeletionRequests();
      console.log('Deletion requests response:', response);
      
      if (response.success && response.data) {
        console.log('All deletion requests:', response.data);
        
        // Find deletion request for this activity
        const pendingRequest = response.data.find((req) => {
          const reqActivityId = Number(req.activity);
          const matches = reqActivityId === eventId && (!req.status || req.status === 'pending');
          console.log(`Checking request ID ${req.id}: activity=${reqActivityId}, eventId=${eventId}, 
                        status=${req.status}, matches=${matches}`);
          return matches;
        });
        console.log('Pending deletion request found:', pendingRequest);
        setHasPendingDeletion(!!pendingRequest);
      } else {
        console.log('Failed to fetch deletion requests:', response.error);
        setHasPendingDeletion(false);
      }
    } catch (error) {
      console.error('Error checking deletion request:', error);
      setHasPendingDeletion(false);
    }
  }, [eventId, userRole]);

  useEffect(() => {
    if (userRole === USER_ROLES.ORGANIZER) fetchApplications();
  }, [userRole, fetchApplications]);

  useEffect(() => {
    if (activeSection === 'applicants') fetchApplications();
  }, [activeSection, fetchApplications]);

  useEffect(() => {
    if (isAuthenticated && userRole === USER_ROLES.STUDENT && eventId) {
      checkUserApplication();
    }
  }, [eventId, isAuthenticated, userRole, checkUserApplication]);

  // Check deletion status for organizers
  useEffect(() => {
    if (userRole === USER_ROLES.ORGANIZER && eventId) {
      checkDeletionRequest();
      
      // Refresh deletion status every 30 seconds
      const interval = setInterval(checkDeletionRequest, 30000);
      return () => clearInterval(interval);
    }
  }, [userRole, eventId, checkDeletionRequest]);

  // Organizer handlers
  const handleApprove = async (applicationId: number) => {
    if (!confirm('Are you sure you want to approve this application?')) return;
    try {
      setIsProcessing(true);
      const response = await activitiesApi.reviewApplication(applicationId, { action: 'approve' });
      if (response.success) {
        alert('Application approved successfully!');
        await fetchApplications();
      } else {
        alert(`Failed: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error approving:', error);
      alert('An error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = (applicationId: number) => {
    setSelectedApplicationId(applicationId);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedApplicationId || !rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    try {
      setIsProcessing(true);
      const response = await activitiesApi.reviewApplication(selectedApplicationId, {
        action: 'reject',
        reason: rejectionReason.trim()
      });
      if (response.success) {
        alert('Application rejected successfully.');
        setIsRejectModalOpen(false);
        setRejectionReason('');
        setSelectedApplicationId(null);
        // Refresh the applications list
        await fetchApplications();
      } else {
        alert(`Failed to reject application: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('An error occurred while rejecting the application.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle check-in success - refresh application status
  const handleCheckInSuccess = useCallback(async () => {
    if (userRole === USER_ROLES.STUDENT) {
      await checkUserApplication();
    } else if (userRole === USER_ROLES.ORGANIZER) {
      await fetchApplications();
    }
  }, [userRole, checkUserApplication, fetchApplications]);

  // Scroll to check-in button
  const scrollToCheckInButton = useCallback(() => {
    if (actionButtonRef.current) {
      actionButtonRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, []);

  // Loading & Error states
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">
            {error ? 'Error Loading Event' : 'Event Not Found'}
          </h2>
          <p className="text-gray-600 mb-4">{error || "The event you're looking for doesn't exist."}</p>
          <button onClick={() => router.back()} className="bg-white text-gray-600 border border-gray-600 px-6 py-3 rounded-lg hover:bg-gray-200 cursor-pointer transition-all">
            Back
          </button>
        </div>
      </div>
    );
  }

  const transformedEvent = transformActivityData(event);
  const isOrganizer = userRole === USER_ROLES.ORGANIZER;
  const isStudent = userRole === USER_ROLES.STUDENT;
  const showOrganizerContent = isOrganizer && activeSection !== 'details';

  // Determine display status for badge
  const displayStatus = isOrganizer 
    ? hasPendingDeletion 
      ? 'deletion_pending' 
      : event.status // Show deletion pending or normal activity status
    : isStudent && studentCheckInStatus 
      ? studentCheckInStatus 
      : applicationStatus;

  return (
    <div className="relative pt-6 px-4">
      <HeroImage />
      <Navbar />
      <div className="relative">
        <Header showBigLogo={true} />
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 mt-20 lg:mt-32">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold">{transformedEvent.title}</h1>
          <EventStatusBadge 
            status={displayStatus} 
            onPleaseCheckInClick={isStudent ? scrollToCheckInButton : undefined}
            isActivityStatus={isOrganizer}
          />
        </div>

        {isOrganizer && (
          <OrganizerSection
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            applications={applications}
          />
        )}

        {/* show capacity warning*/}
        {!isOrganizer && !applicationStatus && event.capacity_reached && event.status === ACTIVITY_STATUS.OPEN && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">
            This event has reached maximum capacity
          </div>
        )}

        {/* Main Content */}
        {showOrganizerContent ? (
          <div>
            {activeSection === 'applicants' && (
              <ApplicantsList
                applications={applications}
                loading={loadingApplications}
                isProcessing={isProcessing}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            )}
            {activeSection === 'approved' && (
              <ApprovedList applications={applications} loading={loadingApplications} eventEndDate={transformedEvent.dateend} />
            )}
          </div>
        ) : (
          <EventDetails event={transformedEvent} />
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 mt-7 transition-all duration-300 rounded-lg"
          ref={actionButtonRef}
        >
          <button onClick={() => router.back()} className="bg-white text-gray-600 border border-gray-600 px-6 py-3 rounded-lg hover:bg-green-600/50 cursor-pointer transition-all">
            Back
          </button>

          {isAuthenticated ? (
            <ActionButton
              applicationStatus={isStudent ? applicationStatus : undefined}
              applying={applying}
              event={event}
              onApply={isStudent ? handleApply : undefined}
              onCancel={isStudent ? handleCancelApplication : undefined}
              role={userRole}
              eventID={eventId}
              onCheckInSuccess={handleCheckInSuccess}
            />
          ) : (
            <Link href="/login" className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 cursor-pointer transition-all text-center">
              Login to Apply
            </Link>
          )}
        </div>
      </div>

      <RejectionModal
        isOpen={isRejectModalOpen}
        reason={rejectionReason}
        isProcessing={isProcessing}
        onReasonChange={setRejectionReason}
        onConfirm={handleConfirmReject}
        onCancel={() => {
          setIsRejectModalOpen(false);
          setRejectionReason('');
          setSelectedApplicationId(null);
        }}
      />
    </div>
  );
}