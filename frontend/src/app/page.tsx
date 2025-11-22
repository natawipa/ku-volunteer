"use client";

import { useRef, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { auth } from "../lib/utils";
import { USER_ROLES } from "../lib/constants";
import { activitiesApi } from "../lib/activities";
import type { Activity, ActivityApplication } from "../lib/types";
import { apiService } from "../lib/api";

import EventTypeSection from "./components/EventTypeSection";
import EventCardSquare from "./components/EventCard/EventCardSquare";
import { transformActivityToEvent, getMyEvents, getAllEvents, getOpeningEvents, type EventFilterConfig } from "./components/EventCard/utils";
import Header from "./components/Header";
import AdminLayout from "./admin/components/AdminLayout";
import AdminContent from "./admin/AdminContent";
import HeroImage from "./components/HeroImage";
import Navbar from "./components/Navbar";
import { CircleChevronRight } from "lucide-react";
import { useModal } from "./components/Modal";

const EVENT_TYPE_DEFINITIONS = [
  {
    title: "University Activities",
    color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#5992FF]/26",
    backgroundBrain: "/brain-read.svg",
    match: (cat: string) => cat.includes("University Activities"),
  },
  {
    title: "Enhance Competencies",
    color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#FFEA47]/26",
    backgroundBrain: "/brain-think.svg",
    match: (cat: string) =>
      [
        "Development of Morality",
        "Development of Thinking",
        "Development of Interpersonal",
        "Development of Health",
      ].some((keyword) => cat.includes(keyword)),
  },
  {
    title: "Social Engagement Activities",
    color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#FF999B]/26",
    backgroundBrain: "/brain-smart.svg",
    match: (cat: string) => cat.includes("Social Engagement Activities"),
  },
];

function SectionMyEvents({
  events,
}: {
  events: ReturnType<typeof transformActivityToEvent>[];
}) {
  if (!events.length) {
    return (
      <section className="mb-6">
        <h2 className="font-bold mb-4 text-2xl">My Events</h2>
        <div className="flex justify-center items-center h-48">
          <p className="text-gray-600">No events found.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-2xl text-black">My Events</h2>
        <Link href="/all-events" className="flex items-center gap-2 text-black font-medium text-base transition-colors cursor-pointer hover:text-gray-500 px-5">
          View All ({events.length}) <CircleChevronRight size={20} />
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {events.slice(0, 6).map((e) => (
          <EventCardSquare key={e.id} event={e} />
        ))}
      </div>
    </section>
  );
}

function SectionAllEvents({
  events,
}: {
  events: ReturnType<typeof transformActivityToEvent>[];
}) {
  if (!events.length) {
    return (
      <section className="mb-6">
        <h2 className="font-bold mb-4 text-2xl">All Events</h2>
        <div className="flex justify-center items-center h-48">
          <p className="text-gray-600">No events available at the moment.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <h2 className="font-bold mb-4 text-2xl">All Events</h2>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {events.slice(0, 6).map((e) => (
          <EventCardSquare key={e.id} event={e} />
        ))}
      </div>
    </section>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const { showModal } = useModal();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  const [userApplications, setUserApplications] = useState<ActivityApplication[]>([]);
  
  const [organizerProfileId, setOrganizerProfileId] = useState<number | null>(null);

  useEffect(() => {
    const successParam = searchParams.get('success');
    if (successParam) {
      showModal(decodeURIComponent(successParam), {
        dataTestId: "success-message"
      });
      
      const url = new URL(window.location.href);
      url.searchParams.delete('success');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, showModal]);

  useEffect(() => {
    setIsAuthenticated(auth.isAuthenticated());
    setUserRole(auth.getUserRole());
    
    const fetchUserProfile = async () => {
      if (auth.getUserRole() === USER_ROLES.ORGANIZER) {
        try {
          const result = await apiService.getCurrentUser();
          if (result.success && result.data && result.data.organizer_profile) {
            setOrganizerProfileId(result.data.organizer_profile.id || null);
          } else {
            console.warn('No organizer profile found in user data:', result.data);
          }
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
        }
      }
    };
    
    fetchUserProfile();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await activitiesApi.getActivities();

        if (response.success && Array.isArray(response.data)) {
          setActivities(response.data);
        } else {
          throw new Error(response.error || "Failed to fetch activities");
        }
        
        if (auth.isAuthenticated() && auth.getUserRole() === USER_ROLES.STUDENT) {
          const applicationsResponse = await activitiesApi.getUserApplications();
          if (applicationsResponse.success && applicationsResponse.data) {
            setUserApplications(applicationsResponse.data);
          }
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : typeof err === "string" ? err : "Network error occurred";
        setError(message);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const filterConfig: EventFilterConfig = {
    activities,
    userRole,
    isAuthenticated,
    userApplications,
    organizerProfileId
  };

  const myEvents = getMyEvents(filterConfig);
  const allEvents = getAllEvents(filterConfig);
  const eventTypeEvents = getOpeningEvents(activities);

  const eventTypes = EVENT_TYPE_DEFINITIONS.map((type) => ({
    ...type,
    events: eventTypeEvents.filter(
      (e) => Array.isArray(e.category) && e.category.some(type.match)
    ),
  }));
  if (isAuthenticated && userRole === USER_ROLES.ADMIN) {
    return (
      <AdminLayout>
        <AdminContent />
      </AdminLayout>
    );
  }

  return (
    <div className="relative pt-6 px-4">
      <HeroImage />
      <div className="relative">
      <Navbar isAuthenticated={isAuthenticated} userRole={userRole} />
      <Header showBigLogo={true} showSearch={true} activities={activities} 
              setIsSearchActive={setIsSearchActive} searchInputRef={searchInputRef}/>

        {!isSearchActive && (
          <>
            {loading && (
              <section className="mb-6 ">
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
                  <span className="ml-3 text-gray-600">
                    Loading activities...
                  </span>
                </div>
              </section>
            )}

            {error && (
              <section className="mb-6 ">
                <div className="flex justify-center items-center h-48">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
                    <h3 className="text-red-800 font-semibold mb-2">
                      Error Loading Activities
                    </h3>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </section>
            )}

            {!loading && !error && (
              <>
              <div className="mt-8">
                {isAuthenticated && (
                  <>
                    <SectionMyEvents events={myEvents} />
                    <SectionAllEvents events={allEvents} />
                  </>
                )}
                
                {!isAuthenticated && (
                  <SectionAllEvents events={allEvents} />
                )}
                
                <h2 className="font-bold mb-6 text-2xl py-2">Event Types</h2>
                {eventTypes.map((type, idx) => (
                  <EventTypeSection key={idx} {...type} />
                ))}
              </div>
              </>
            )}
          </>
        )}
    </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
