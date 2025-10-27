"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";

import { auth } from "../lib/utils";
import { USER_ROLES } from "../lib/constants";
import { activitiesApi } from "../lib/activities";
import type { Activity } from "../lib/types";

import EventTypeSection from "./components/EventTypeSection";
import EventCardSquare from "./components/EventCard/EventCardSquare";
import type { EventCardData } from "./components/EventCard/utils";
import ProfileCard from "./components/ProfileCard";
import SearchLayout from "./components/SearchLayout";
import AdminLayout from "./admin/components/AdminLayout";
import AdminContent from "./admin/AdminContent";

// Transform backend activity to frontend card format
const transformActivityToEvent = (activity: Activity): EventCardData => {
  if (!activity) {
    console.warn("Empty activity passed to transform function");
    const now = new Date().toLocaleDateString("en-GB");
    return {
      id: 0,
      title: "Unknown Activity",
      description: "No description",
      organizer: "Unknown Organizer",
      participants_count: 0,
      max_participants: 0,
      dateStart: now,
      dateEnd: now,
      location: "Unknown Location",
      category: [],
      imgSrc: "/default-event.jpg",
      status: "unknown",
      posted_at: new Date().toISOString(),
    };
  }

  return {
    id: activity.id ?? 0,
    title: activity.title ?? "Untitled Activity",
    description: activity.description ?? "No description",
    organizer: activity.organizer_name ?? "Unknown Organizer",
    participants_count: activity.current_participants ?? 0,
    max_participants: activity.max_participants ?? 0,
    dateStart: activity.start_at ?? new Date().toISOString(),
    dateEnd: activity.end_at ?? new Date().toISOString(),
    location: activity.location ?? "Unknown Location",
    category: activity.categories ?? [],
    imgSrc:
      activity.cover_image_url ||
      activity.cover_image ||
      "/default-event.jpg",
    status: activity.status === "open" ? "upcoming" : activity.status ?? "unknown",
    posted_at: activity.created_at ?? new Date().toISOString(),
  };
};

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

// Navigation Link Component
const NavLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className="relative border-b border-transparent hover:border-black transition-all duration-200"
  >
    {children}
  </Link>
);

const CreateButton = () => (
  <Link
    href="/new-event"
    className="btn bg-[#215701] text-white px-2 py-2 rounded hover:bg-[#00361C] transition-all duration-200"
  >
    <div className="flex items-center">
      <Plus className="w-4 h-4 mr-1" />
      <span>New</span>
    </div>
  </Link>
);

// Main Home Page Component
export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
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
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
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

  const getLogoSrc = () => {
    if (!isAuthenticated) return "/logo-kasetsart.svg";
    switch (userRole) {
      case USER_ROLES.ORGANIZER:
        return "/logo-organizer.svg";
      case USER_ROLES.STUDENT:
        return "/logo-student.svg";
      default:
        return "/logo-kasetsart.svg";
    }
  };

  const getNavigation = () => {
    const commonLinks = (
      <>
        <NavLink href="/document">Document</NavLink>
        <NavLink href="/all-events">My Event</NavLink>
      </>
    );

    if (!isAuthenticated)
      return (
        <nav className="flex items-center space-x-8">
          <NavLink href="/document">Document</NavLink>
          <NavLink href="/all-events">All Event</NavLink>
          <Link
            href="/login"
            className="btn bg-[#215701] text-white px-4 py-2 rounded hover:bg-[#00361C] transition-all duration-200"
          >
            Sign In
          </Link>
        </nav>
      );

    if (userRole === USER_ROLES.STUDENT)
      return (
        <nav className="flex items-center space-x-8">
          {commonLinks}
          <ProfileCard />
        </nav>
      );

    if (userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.ORGANIZER)
      return (
        <nav className="flex items-center space-x-8">
          {commonLinks}
          <CreateButton />
          <ProfileCard />
        </nav>
      );
  };

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
    <div className="relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#DAE9DC] to-white h-[350px]" />
      <Image
        src="/mountain.svg"
        alt="mountain"
        width={1920}
        height={510}
        className="w-full h-[510px] absolute inset-0 top-0 object-cover pt-11"
      />

      <div className="relative p-6">
        {/* Header */}
        <header
          className={`flex justify-between items-center ${
            isAuthenticated ? "sticky top-0 z-10 mb-6 bg-[#DAE9DC]/10" : ""
          }`}
        >
          <Image src={getLogoSrc()} alt="Small Logo" width={64} height={64} />
          {getNavigation()}
        </header>

        {/* Logo Center */}
        <div className="flex justify-center">
          <Image src={getLogoSrc()} alt="Big Logo" width={180} height={180} />
        </div>

        {/* Search Layout */}
        {!loading && !error && (
          <section className="sticky top-10 z-[101]">
            <SearchLayout
              activities={activities}
              setIsSearchActive={setIsSearchActive}
              searchInputRef={searchInputRef}
              isScrolled={isScrolled}
            />
          </section>
        )}

        {/* Main Content */}
        {!isSearchActive && (
          <>
            {loading && (
              <section className="mb-6 mt-18">
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
                  <span className="ml-3 text-gray-600">
                    Loading activities...
                  </span>
                </div>
              </section>
            )}

            {error && (
              <section className="mb-6 mt-18">
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
                <SectionUpcomingEvents events={events} />
                <h2 className="font-bold mb-6 text-2xl py-2">Event Types</h2>
                {eventTypes.map((type, idx) => (
                  <EventTypeSection key={idx} {...type} />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
