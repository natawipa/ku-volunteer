"use client";
import { PlusIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { activitiesApi } from "../../../lib/activities";
import type { Activity } from "../../../lib/types";
import { auth } from "../../../lib/utils";
import { USER_ROLES } from "../../../lib/constants";

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const [event, setEvent] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const { id } = React.use(params);
  const eventId = parseInt(id, 10);

  // Check authentication
  useEffect(() => {
    const authenticated = auth.isAuthenticated();
    const role = auth.getUserRole();
    setIsAuthenticated(authenticated);
    setUserRole(role);
  }, []);

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching event details for ID:', eventId);
        
        const response = await activitiesApi.getActivity(eventId);
        
        if (response.success && response.data) {
          console.log('✅ Event data received:', response.data);
          setEvent(response.data);
        } else {
          setError(response.error || 'Failed to fetch event details');
          console.error('❌ API error:', response.error);
        }
      } catch (err) {
        console.error('❌ Network error:', err);
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  // Transform activity data to match your component structure
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
      organizer: activity.organizer_name || 'Unknown Organizer',
      description: activity.description || 'No description available',
      image: "/titleExample.jpg", // Default image since backend might not have images yet
      additionalImages: ["/titleExample.jpg", "/titleExample.jpg", "/titleExample.jpg"] // Placeholder images
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
              <Link href="/new" className="btn bg-[#215701] text-white px-2 py-2 rounded 
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
          <h1 className="text-3xl font-bold mb-4 text-center">{transformedEvent.title}</h1>
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
                <p><strong>Capacity:</strong> {transformedEvent.capacity} people</p>
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

            <div className="flex justify-between pt-4 border-t mt-11">
            <Link 
              href="/" 
              className="flex items-center text-gray-600 hover:text-gray-900 cursor-pointer px-6 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-all duration-200"
            >
              Back to Home
            </Link>

            {isAuthenticated ? (
              userRole === USER_ROLES.STUDENT ? (
                // Student - Apply button
                <button className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 cursor-pointer transition-all duration-200 font-medium">
                  Apply Now
                </button>
              ) : userRole === USER_ROLES.ORGANIZER ? (
                <Link 
                  href={{
                    pathname: '/new',
                    query: { 
                      edit: eventId,
                      activityData: encodeURIComponent(JSON.stringify(event))
                    }
                  }}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 cursor-pointer transition-all duration-200 font-medium text-center"
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
        </div>
      </div>
    </div>
    </div>
  );
}