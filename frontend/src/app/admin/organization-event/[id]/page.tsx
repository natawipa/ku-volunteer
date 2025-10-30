"use client";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { CalendarIcon, MapPinIcon, UsersIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { activitiesApi } from "@/lib/activities";
import type { Activity } from "@/lib/types";
import { ENV } from "@/lib/constants";
import Header from "@/app/components/Header";

export default function OrganizerEventsPage({ params }: { params: Promise<{ id: string }> }) {
  const [events, setEvents] = useState<Activity[]>([]);
  const [organizerInfo, setOrganizerInfo] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { id } = React.use(params);
  const organizerId = parseInt(id, 10);

  // Helper to ensure absolute URLs for images
    function normalizeUrl(url: string) {
      if (!url) return url;
      // If already absolute
      try {
        const parsed = new URL(url);
        return parsed.href;
      } catch {
        // Not absolute - make sure path starts with '/media/' and prefix with API base
        const base = ENV.API_BASE_URL.replace(/\/$/, '');
        let path = url.startsWith('/') ? url : `/${url}`;
        // If backend returns paths without media prefix, add it
        if (!path.startsWith('/media')) {
          path = path.startsWith('/') ? `/media${path}` : `/media/${path}`;
        }
        return `${base}${path}`;
      }
    }

  // Fetch organizer's events
  useEffect(() => {
    const fetchOrganizerEvents = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching events for organizer ID:', organizerId);
        
        // Get all activities and filter by either organizer_profile_id or user ID
        const response = await activitiesApi.getActivities();
        
        if (response.success && response.data) {
          // First try to find by organizer_profile_id
          const organizerEvents = response.data.filter(
            (activity: Activity) => activity.organizer_profile_id === organizerId
          );
          
          // If no events found and we might have a user ID, try to find by matching organizer info
          // This is a fallback for when we don't have the exact organizer_profile_id
          if (organizerEvents.length === 0) {
            // Try to match by similar organizer details - this is less reliable but better than nothing
            console.log('🔄 No events found by profile ID, trying alternative matching...');
          }
          
          console.log('✅ Found events:', organizerEvents);
          setEvents(organizerEvents);
          
          // Set organizer info from first event if available
          if (organizerEvents.length > 0) {
            const firstEvent = organizerEvents[0];
            setOrganizerInfo({
              name: firstEvent.organizer_name || 'Unknown Organizer',
              email: firstEvent.organizer_email || 'No email'
            });
          } else {
            // If no events found, we still want to show the page with zero events
            setOrganizerInfo({
              name: 'Organization',
              email: 'No email available'
            });
          }
        } else {
          setError(response.error || 'Failed to fetch events');
          console.error('❌ API error:', response.error);
        }
      } catch (err) {
        console.error('❌ Network error:', err);
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (organizerId) {
      fetchOrganizerEvents();
    }
  }, [organizerId]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading organizer events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link 
            href="/admin/organization-list" 
            className="btn bg-[#215701] text-white px-4 py-2 rounded hover:bg-[#00361C]"
          >
            Back to List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative p-6">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#DAE9DC] to-white h-[350px]" />
        <div className="absolute inset-0 top-0 h-[510px] bg-[url('/mountain.svg')] bg-cover bg-center pt-11 mt-5" />
      <div className="relative p-6">
        <Header showBigLogo={true} />
      

        {/* ---------------------- */}
        <Link 
            href="/admin/organization-list" 
            className="inline-flex items-center text-[#215701] hover:text-[#00361C] mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to List
          </Link>

        {/* Back button and title */}
        <div className="max-w-6xl mx-auto mb-6 mt-10">
          
          {organizerInfo && (
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Events by {organizerInfo.name}
              </h1>
              <p className="text-gray-600">{organizerInfo.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                {events.length} event{events.length !== 1 ? 's' : ''} found
              </p>
            </div>
          )}
        </div>

        {/* Events grid */}
        <div className="max-w-6xl mx-auto">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No events found</h3>
              <p className="text-gray-500">This organizer hasn&apos;t created any events yet.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <div 
                  key={event.id} 
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="relative h-48">
                    {(() => {
                      // Prefer cover_image first, then cover_image_url, then poster_images, then fallback
                      const raw = event.cover_image || event.cover_image_url || "/default-event.jpg";
                      if (raw && typeof raw === 'string') {
                        // If this is the local placeholder image in the frontend public folder,
                        // don't normalize (normalizeUrl prefixes non-media paths with the API base).
                        if (raw === "/default-event.jpg" || raw.endsWith("/default-event.jpg")) {
                          return (
                            <Image
                              src={raw}
                              alt={event.title || 'Event image'}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          );
                        }

                        return (
                          <Image
                            src={normalizeUrl(raw)}
                            alt={event.title || 'Event image'}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        );
                      }

                      const posters = (event as unknown as { poster_images?: { image?: string }[] })?.poster_images;
                      if (Array.isArray(posters) && posters.length > 0) {
                        const first = posters.find((p: { image?: string }) => p && typeof p.image === 'string' && p.image.length > 0);
                        if (first && first.image) {
                          return (
                            <Image
                              src={normalizeUrl(first.image)}
                              alt={event.title || 'Event image'}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          );
                        }
                      }

                      return (
                        <Image
                          src={'/default-event.jpg'}
                          alt={event.title || 'Event image'}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      );
                    })()}
                    <div className="absolute top-4 right-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.status === 'open' ? 'bg-green-100 text-green-800' :
                        event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        event.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-3 line-clamp-2" title={event.title}>
                      {event.title}
                    </h3>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                        {/* For one-day activities */}
                        {event.start_at === event.end_at ? (
                          <span>{formatDate(event.start_at)}</span>
                        ) : (
                          <span>{formatDate(event.start_at)} - {formatDate(event.end_at)}</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate" title={event.location}>
                          {event.location || 'Location TBD'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <UsersIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>
                          {event.current_participants}/{event.max_participants || '∞'} participants
                        </span>
                      </div>
                    </div>

                    {event.categories && event.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {event.categories.slice(0, 3).map((category, index) => (
                          <span 
                            key={index}
                            className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                          >
                            {category}
                          </span>
                        ))}
                        {event.categories.length > 3 && (
                          <span className="text-xs text-gray-500 px-2 py-1">
                            +{event.categories.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Created: {formatDate(event.created_at)}
                      </span>
                      <Link
                        href={`/event-detail/${event.id}`}
                        className="btn bg-[#215701] text-white px-3 py-1 rounded text-sm hover:bg-[#00361C] transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
} 
