"use client";
import { PlusIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState, useCallback } from "react";
import { activitiesApi } from "../../../lib/activities";
import type { Activity, ActivityApplication, CreateApplicationRequest } from "../../../lib/types";
import { auth } from "../../../lib/utils";
import { USER_ROLES, ACTIVITY_STATUS, APPLICATION_STATUS } from "../../../lib/constants";

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const [event, setEvent] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userApplication, setUserApplication] = useState<ActivityApplication | null>(null);
  const [applying, setApplying] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'details' | 'applicants' | 'approved'>('details');
  const [applications, setApplications] = useState<ActivityApplication[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  
  const { id } = React.use(params);
  const eventId = parseInt(id, 10);

  // Check if user has already applied to this activity - FIXED: useCallback
  const checkUserApplication = useCallback(async () => {
    try {
      console.log('📋 Checking user applications...');
      const applicationsResponse = await activitiesApi.getUserApplications();
      
      if (applicationsResponse.success && applicationsResponse.data) {
        console.log('📋 User applications:', applicationsResponse.data);
        
        // Find application for this specific activity
        const userApp = applicationsResponse.data.find(
          (app: ActivityApplication) => app.activity === eventId
        );
        
        if (userApp) {
          console.log('✅ Found existing application:', userApp);
          setUserApplication(userApp);
          setApplicationStatus(userApp.status);
        } else {
          console.log('ℹ️ No application found for this activity');
          setApplicationStatus(null);
        }
      }
    } catch (error) {
      console.error('❌ Error checking user application:', error);
    }
  }, [eventId]);

  // Check authentication
  useEffect(() => {
    const authenticated = auth.isAuthenticated();
    const role = auth.getUserRole();
    setIsAuthenticated(authenticated);
    setUserRole(role);

    if (authenticated && role === USER_ROLES.STUDENT) {
      checkUserApplication();
    }

    if (authenticated && role === USER_ROLES.ORGANIZER) {
      fetchEventForOrganizer();
    }
  }, [eventId, checkUserApplication]); // add checkUserApplication to dependencies

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        console.log('Fetching event details for ID:', eventId);
        
        const response = await activitiesApi.getActivity(eventId);
        
        if (response.success && response.data) {
          console.log('Event data received:', response.data);
          setEvent(response.data);
        } else {
          setError(response.error || 'Failed to fetch event details');
          console.error('API error:', response.error);
        }
      } catch (err) {
        console.error('Network error:', err);
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const fetchEventForOrganizer = useCallback(async () => {
    if (userRole !== USER_ROLES.ORGANIZER) return;

    try {
      setLoadingApplications(true);
      console.log('Fetching applications for event ID:', eventId);
      
      const response = await activitiesApi.getActivityApplications(eventId);
      
      if (response.success && response.data) {
        console.log('Applications data received:', response.data);
        setApplications(response.data);
      } else {
        console.error('API error fetching applications:', response.error);
      }
    } catch (err) {
      console.error('Network error fetching applications:', err);
    } finally {
      setLoadingApplications(false);
    }
  } , [eventId, userRole]);

  // approve student handle for organizer
  const handleApproveApplication = async (applicationId: number) => {
    try {
      console.log('Approving application ID:', applicationId);
    } catch (error) {
      console.error('Error approving application:', error);
    }
  }

  // reject student handle for organizer
  const handleRejectApplication = async (applicationId: number) => {
    try {
      console.log('Rejecting application ID:', applicationId);
    } catch (error) {
      console.error('Error rejecting application:', error);
    }
  }

  const handleApply = async () => {
    if (!isAuthenticated || userRole !== USER_ROLES.STUDENT) {
      alert('Please login as a student to apply for activities.');
      return;
    }

    try {
      setApplying(true);
      console.log('Applying to activity:', eventId);
      
      const applicationData: CreateApplicationRequest = {
        activity: eventId
      };

      const response = await activitiesApi.createApplication(applicationData);
      
      if (response.success && response.data) {
        console.log('Application submitted successfully:', response.data);
        setApplicationStatus(APPLICATION_STATUS.PENDING);
        setUserApplication(response.data);
        
        alert('Application submitted successfully! You can track your application status in &quot;My Events&quot;.');
        
        await checkUserApplication();
        
      } else {
        console.error('Application failed:', response.error);
        alert(`Application failed: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Application error:', error);
      alert('An error occurred while submitting your application. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  const handleCancelApplication = async () => {
    if (!userApplication) return;

    try {
      const response = await activitiesApi.cancelApplication(userApplication.id);
      
      if (response.success) {
        console.log('Application cancelled successfully');
        setApplicationStatus(null);
        setUserApplication(null);
        alert('Application cancelled successfully.');
      } else {
        console.error('Cancellation failed:', response.error);
        alert(`Cancellation failed: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Cancellation error:', error);
      alert('An error occurred while cancelling your application. Please try again.');
    }
  };
  
  const renderApplicationStatus = () => {
    if (!applicationStatus) return null;

    const statusConfig = {
      [APPLICATION_STATUS.PENDING]: {
        text: 'Pending Review',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
      },
      [APPLICATION_STATUS.APPROVED]: {
        text: 'Approved',
        color: 'bg-green-100 text-green-800 border-green-300'
      },
      [APPLICATION_STATUS.REJECTED]: {
        text: 'Rejected',
        color: 'bg-red-100 text-red-800 border-red-300'
      },
      [APPLICATION_STATUS.CANCELLED]: {
        text: 'Cancelled',
        color: 'bg-gray-100 text-gray-800 border-gray-300'
      }
    };

    const statusKey = applicationStatus as keyof typeof statusConfig;
    const config = statusConfig[statusKey] || statusConfig[APPLICATION_STATUS.PENDING];

    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        {config.text}
      </div>
    );
  };

  // Render apply/cancel button based on application status
  const renderActionButton = () => {
    if (!isAuthenticated || userRole !== USER_ROLES.STUDENT) {
      return null;
    }

    if (applicationStatus === APPLICATION_STATUS.PENDING) {
      return (
        <button
          onClick={handleCancelApplication}
          disabled={applying}
          className="bg-yellow-600 text-white px-8 py-3 rounded-lg hover:bg-yellow-700 cursor-pointer transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {applying ? 'Cancelling...' : 'Cancel Application'}
        </button>
      );
    }

    if (applicationStatus === APPLICATION_STATUS.APPROVED) {
      return (
        <div className="text-center">
          <div className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium">
            You&apos;re Approved!
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Check &quot;My Events&quot; for details
          </p>
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

    // No application or cancelled application - show apply button
    const canApply = !event?.capacity_reached && event?.status === ACTIVITY_STATUS.OPEN;
    return (
      <button
        onClick={handleApply}
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
  };

  // section for organizer
  const renderSectionNavigation = () => {
    if (userRole !== USER_ROLES.ORGANIZER) return null;
  
    return (
      <div className="flex justify-center mb-6 border-b">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveSection('details')}
            className={`py-3 px-4 font-medium transition-all duration-200 ${
              activeSection === 'details'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Event Details
          </button>
          <button
            onClick={() => setActiveSection('applicants')}
            className={`py-3 px-4 font-medium transition-all duration-200 ${
              activeSection === 'applicants'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Participants Apply
          </button>
          <button
            onClick={() => setActiveSection('approved')}
            className={`py-3 px-4 font-medium transition-all duration-200 ${
              activeSection === 'approved'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Approved Participants
          </button>
        </div>
      </div>
    );
  };

  const renderApplicantsList = () => {
    const pendingApplications = applications.filter(app => app.status === APPLICATION_STATUS.PENDING);
    
    if (loadingApplications) {
      return <div className="text-center py-8">Loading applications...</div>;
    }
  
    return (
      <div className="space-y-4">
        <h2 className="font-semibold text-2xl mb-6">Student Applications</h2>
        {pendingApplications.length === 0 ? (
          <p className="text-gray-500 text-center">No pending applications</p>
        ) : (
          pendingApplications.map((application) => (
            <div key={application.id} className="flex justify-between items-center border-b pb-4">
              <div className="flex-1">
                <p className="font-medium">{application.student_name || `Student ${application.studentid}`}</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => handleApproveApplication(application.id)}
                  className="bg-green-100 px-4 py-2 rounded hover:bg-green-200 transition-colors cursor-pointer"
                >
                  Approve
                </button>
                <button 
                  onClick={() => handleRejectApplication(application.id)}
                  className="bg-red-100 px-4 py-2 rounded hover:bg-red-200 transition-colors cursor-pointer"
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };
  
  // render the approved student later
  const renderApprovedList = () => {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Approved participants</p>
      </div>
    );
  };

  // Transform activity data
  const transformActivityData = (activity: Activity) => {
    return {
      id: activity.id,
      title: activity.title || 'Untitled Activity',
      post: new Date(activity.created_at || new Date()).toLocaleDateString('en-GB'),
      datestart: new Date(activity.start_at || new Date()).toLocaleDateString('en-GB'),
      dateend: new Date(activity.end_at || new Date()).toLocaleDateString('en-GB'),
      location: activity.location || 'Unknown Location',
      category: activity.categories || [],
      capacity: activity.max_participants || 0,
      currentParticipants: activity.current_participants || 0,
      organizer: activity.organizer_name || 'Unknown Organizer',
      description: activity.description || 'No description available',
      image: "/titleExample.jpg",
      additionalImages: ["/titleExample.jpg", "/titleExample.jpg", "/titleExample.jpg"]
    };
  };

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Event</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-4">The event you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const transformedEvent = transformActivityData(event);

  return (
    <div className="relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#DAE9DC] to-white h-[220px]"></div>

      {/* Mountain background */}
      <Image
        src="/mountain.svg"
        alt="mountain"
        width={920}
        height={410}
        className="w-full h-[200px] absolute inset-0 top-0 object-cover"
      />

      {/* Foreground content */}
      <div className="relative p-6"> 
        <header className="flex justify-between items-center sticky top-0 z-10 mb-6 bg-[#DAE9DC]/10">
          <Image
            src={isAuthenticated && userRole === USER_ROLES.ORGANIZER ? "/Logo_Staff.svg" : "/Logo_Kasetsart.svg"}
            alt="Small Logo"
            width={64}
            height={64}
            className="object-cover"
          />
          <nav className="flex items-center space-x-8">
            <Link href="/document" className="relative border-b-1 border-transparent hover:border-black transition-all duration-200">Document</Link>
            <Link href="/all-events" className="relative border-b-1 border-transparent hover:border-black transition-all duration-200">All Event</Link>
            {isAuthenticated && userRole === USER_ROLES.ORGANIZER && (
              <Link href="/new-event" className="btn bg-[#215701] text-white px-2 py-2 rounded 
                    hover:bg-[#00361C]
                    transition-all duration-200">
                <div className="flex items-center">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  <span className="mr-1">New</span>
                </div>
              </Link>
            )}
            <Link href="/profile">
              <UserCircleIcon className="w-10 h-10 text-[#215701] hover:text-[#00361C] transition-all duration-200" />
            </Link>
          </nav>
        </header>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 mt-20 lg:mt-32">
          {/* Application Status Badge */}
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold align-center">{transformedEvent.title}</h1>
            {renderApplicationStatus()}
          </div>
          
          <h2 className="text-xl font-light mb-4 text-center">Detail | Participant</h2>
          
          {/* Activity Status Warnings */}
          {event.status !== ACTIVITY_STATUS.OPEN && (
            <div className="bg-yellow-100 border border-yellow-300 text-yellow-700 px-4 py-3 rounded mb-4">
              {event.status === ACTIVITY_STATUS.PENDING && 'This event is pending approval'}
              {event.status === ACTIVITY_STATUS.FULL && 'This event is full'}
              {event.status === ACTIVITY_STATUS.CLOSED && 'This event is closed'}
              {event.status === ACTIVITY_STATUS.CANCELLED && 'This event has been cancelled'}
            </div>
          )}

          {event.capacity_reached && event.status === ACTIVITY_STATUS.OPEN && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
              This event has reached maximum capacity
            </div>
          )}

          <Image
            src={transformedEvent.image}
            alt={transformedEvent.title}
            width={500}
            height={310}
            className="w-3/4 mx-auto object-cover"
          />

          <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Top Info Card */}
            <div className="bg-green-50 rounded-lg p-6 shadow">
              <div className="mb-4">
                <p><strong>Post at:</strong> {transformedEvent.post}</p>
              </div>
              <div className="grid lg:grid-cols-2 md:grid-cols-2 gap-4">
                <p><strong>Date:</strong> {transformedEvent.datestart} - {transformedEvent.dateend}</p>
                <p><strong>Location:</strong> {transformedEvent.location}</p>
                <p><strong>Type:</strong> {transformedEvent.category.join(", ")}</p>
                <p><strong>Capacity:</strong> {transformedEvent.currentParticipants} / {transformedEvent.capacity} people</p>
                <p><strong>Organizer:</strong> {transformedEvent.organizer}</p>
              </div>
            </div>

            {/* Image carousel / gallery */}
            <div className="relative w-full">
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex space-x-4 p-2 min-w-full md:justify-center">
                  {transformedEvent.additionalImages?.map((img, index) => (
                    <div key={index} className="flex-shrink-0">
                      <Image
                        src={img}
                        alt={`Event image ${index + 1}`}
                        width={180}
                        height={120}
                        className="rounded-lg object-cover shadow-md hover:scale-105 transition-transform cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Event Details */}
            <h2 className="text-lg font-semibold mb-2">Event Description</h2>
            <div className="bg-white rounded-lg shadow p-4 min-h-[200px] h-auto w-full">                
              <p className="text-gray-700 whitespace-pre-wrap">{transformedEvent.description}</p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t mt-11">
              <Link 
                href="/" 
                className="flex items-center text-gray-600 hover:text-gray-900 cursor-pointer px-6 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-all duration-200"
              >
                Back to Home
              </Link>

              {isAuthenticated ? (
                userRole === USER_ROLES.STUDENT ? (
                  // Student - Use dynamic button renderer
                  renderActionButton()
                ) : userRole === USER_ROLES.ORGANIZER ? (
                  // Organizer - Edit button
                  <Link 
                    href={{
                      pathname: '/new-event',
                      query: { 
                        edit: eventId,
                        activityData: encodeURIComponent(JSON.stringify(event))
                      }
                    }}
                    className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-700 cursor-pointer transition-all duration-200 font-medium text-center"
                  >
                    Edit Event
                  </Link>
                ) : (
                  // Other roles
                  <button className="bg-gray-400 text-white px-8 py-3 rounded-lg cursor-not-allowed font-medium" disabled>
                    Not Available
                  </button>
                )
              ) : (
                // Not authenticated
                <Link
                  href="/login"
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 cursor-pointer transition-all duration-200 font-medium text-center"
                >
                  Login to Apply
                </Link>
              )}
            </div>

            {/* Application info for students */}
            {isAuthenticated && userRole === USER_ROLES.STUDENT && applicationStatus && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Application Status</h3>
                <p className="text-blue-700">
                  {applicationStatus === APPLICATION_STATUS.PENDING && 
                    "Your application is pending review by the organizer. You can cancel your application if needed."}
                  {applicationStatus === APPLICATION_STATUS.APPROVED && 
                    "Congratulations! Your application has been approved. Check &quot;My Events&quot; for more details."}
                  {applicationStatus === APPLICATION_STATUS.REJECTED && 
                    "Your application was not approved for this event. You can explore other events."}
                </p>
                <Link 
                  href="/all-events" 
                  className="inline-block mt-2 text-blue-600 hover:text-blue-800 font-medium"
                >
                  My Events →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}