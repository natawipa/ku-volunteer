"use client";

import { useRef, useState, useEffect } from "react";

import { auth } from "../lib/utils";
import { USER_ROLES } from "../lib/constants";
import { activitiesApi } from "../lib/activities";
import type { Activity } from "../lib/types";

import EventTypeSection from "./components/EventTypeSection";
import EventCardSquare from "./components/EventCard/EventCardSquare";
import { EventCardData, transformActivityToEvent } from "./components/EventCard/utils";
import Header from "./components/Header";
import AdminLayout from "./admin/components/AdminLayout";
import AdminContent from "./admin/AdminContent";
import HeroImage from "./components/HeroImage";
import Navbar from "./components/Navbar";


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

function SectionUpcomingEvents({
  events,
}: {
  events: ReturnType<typeof transformActivityToEvent>[];
}) {
  if (!events.length) {
    return (
      <section className="mb-6">
        <div className="flex justify-center items-center h-48">
          <p className="text-gray-600">No activities available at the moment.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <h2 className="font-bold mb-4 text-2xl">Upcoming Events</h2>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {events.slice(0, 6).map((e) => (
          <EventCardSquare key={e.id} event={e} />
        ))}
      </div>
    </section>
  );
}

// Main Home Page Component
export default function Home() {
  const [, setIsScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Check Authentication on Mount
  useEffect(() => {
    setIsAuthenticated(auth.isAuthenticated());
    setUserRole(auth.getUserRole());
  }, []);

  // Fetch Activities
  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const response = await activitiesApi.getActivities();

        if (response.success && Array.isArray(response.data)) {
          setActivities(response.data);
        } else {
          throw new Error(response.error || "Failed to fetch activities");
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
    fetchActivities();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const handleScroll = () => setIsScrolled(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isAuthenticated]);

  const events = activities.map(transformActivityToEvent);

  const eventTypes = EVENT_TYPE_DEFINITIONS.map((type) => ({
    ...type,
    events: events.filter(
      (e) => Array.isArray(e.category) && e.category.some(type.match)
    ),
  }));
    // Admin View
  if (isAuthenticated && userRole === USER_ROLES.ADMIN) {
    return (
      <AdminLayout>
        <AdminContent />
      </AdminLayout>
    );
  }

// 🏠 Main Home Page Render
  return (
    <div className="relative pt-6 px-4">
      {/* Background */}
      <HeroImage />
      {/* Header */}
      <Navbar isAuthenticated={isAuthenticated} userRole={userRole} />
      <div className="relative">
        <Header showBigLogo={true} showSearch={true} activities={activities} 
              setIsSearchActive={setIsSearchActive} searchInputRef={searchInputRef}/>

        {/* Main Content */}
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
                <SectionUpcomingEvents events={events} />
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
