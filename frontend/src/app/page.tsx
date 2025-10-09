"use client";
import EventCard from "./components/EventCard";
import EventTypeSection from "./components/EventTypeSection";
import { PlusIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import Image from "next/image";

import ProfileCard from "./components/ProfileCard";

import { useRef, useState, useEffect} from "react";
import { auth } from "../lib/utils";
import { USER_ROLES } from "../lib/constants";
import { activitiesApi } from "../lib/activities";
import type { Activity } from "../lib/types";
import AdminLayout from "./admin/components/AdminLayout";
import AdminContent from "./admin/AdminContent";
import SearchLayout from "./components/SearchLayout";

// Transform Activity to EventCard format with better error handling
const transformActivityToEvent = (activity: Activity) => {
  if (!activity) {
    console.warn('⚠️ Empty activity passed to transform function');
    return {
      id: 0,
      title: 'Unknown Activity',
      post: new Date().toLocaleDateString('en-GB'),
      dateStart: new Date().toLocaleDateString('en-GB'),
      dateEnd: new Date().toLocaleDateString('en-GB'),
      location: 'Unknown Location',
      category: [],
      imgSrc: "/titleExample.jpg",
      capacity: 0,
      status: 'unknown'
    };
  }

  return {
    id: activity.id || 0,
    title: activity.title || 'Untitled Activity',
    post: new Date(activity.created_at || new Date()).toLocaleDateString('en-GB'),
    dateStart: new Date(activity.start_at || new Date()).toLocaleDateString('en-GB'),
    dateEnd: new Date(activity.end_at || new Date()).toLocaleDateString('en-GB'),
    location: activity.location || 'Unknown Location',
    category: activity.categories || [],
    imgSrc: "/titleExample.jpg",
    capacity: activity.max_participants || 0,
    status: activity.status === "open" ? "upcoming" : activity.status || 'unknown',
  };
};

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Check authentication and user role on component mount
  useEffect(() => {
    const authenticated = auth.isAuthenticated();
    const role = auth.getUserRole();
    setIsAuthenticated(authenticated);
    setUserRole(role);
  }, []);

  // Fetch activities on component mount
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await activitiesApi.getActivities();

        if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            setActivities(response.data);
          } else {
            setActivities([]);
            setError('Invalid activities data format');
          }
        } else {
          setError(response.error || 'Failed to fetch activities');
          setActivities([]);
        }
      } catch {
        setError('Network error occurred');
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Transform activities to events format with safety check
  const events = Array.isArray(activities) 
    ? activities.map(transformActivityToEvent)
    : [];

  const eventTypes = [
    {
      title: "University Activities",
      color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#5992FF]/26",
      backgroundBrain: "/brainread.svg",
      events: events.filter(e => Array.isArray(e.category) && e.category.some(cat => cat.includes("University Activities"))),
    },
    {
      title: "Enhance Competencies",
      color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#FFEA47]/26",
      backgroundBrain: "/brainthink.svg",
      events: events.filter(e => Array.isArray(e.category) && e.category.some(cat => (
        cat.includes("Development of Morality") ||
        cat.includes("Development of Thinking") ||
        cat.includes("Development of Interpersonal") ||
        cat.includes("Development of Health")
      ))),
    },
    {
      title: "Social Engagement Activities",
      color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#FF999B]/26",
      backgroundBrain: "/brainlove.svg",
      events: events.filter(e => Array.isArray(e.category) && e.category.some(cat => cat.includes("Social Engagement Activities"))),
    },
  ];

  // Handle scroll to add shadow to header for authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      const handleScroll = () => setIsScrolled(window.scrollY > 100);
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [isAuthenticated]);

  // Get appropriate logo based on user role
  const getLogo = () => {
    if (!isAuthenticated) return "/Logo_Kasetsart.svg";
    return userRole === USER_ROLES.ORGANIZER ? "/Logo_Staff.svg" : "/Logo_Kasetsart.svg";
  };

  // Get appropriate navigation for authenticated users
  const getNavigation = () => {
    if (!isAuthenticated) {
      return (
        <nav className="space-x-8">
          <Link href="/document" className="relative border-b-1 border-transparent hover:border-black transition-all duration-200">Document</Link>
          <Link href="/all-events" className="relative border-b-1 border-transparent hover:border-black transition-all duration-200">
            {(userRole === USER_ROLES.ORGANIZER || userRole === USER_ROLES.STUDENT) ? 
            "My Event" : "All Event"}
          </Link>
          <Link href="/login" 
          className="btn bg-[#215701] text-white px-4 py-2 rounded 
                    hover:bg-[#00361C]
                    transition-all duration-200">
            Sign In
          </Link>
        </nav>
      );
    }

    return (
      <nav className="flex items-center space-x-8">
        <Link href="/document" className="relative border-b-1 border-transparent hover:border-black transition-all duration-200">Document</Link>
        <Link href="/all-events" 
          className="relative border-b-1 border-transparent hover:border-black transition-all duration-200">
          {(userRole === USER_ROLES.ORGANIZER || userRole === USER_ROLES.STUDENT) ? "My Event" : "All Event"}
        </Link>        
      {userRole === USER_ROLES.ORGANIZER || userRole === USER_ROLES.ADMIN && (
          <Link href="/new" className="btn bg-[#215701] text-white px-2 py-2 rounded 
                    hover:bg-[#00361C]
                    transition-all duration-200">
            <div className="flex items-center">
            <PlusIcon className="w-4 h-4 mr-2" />
            <span className="mr-1">New</span>
            </div>
          </Link>
        )}
        <ProfileCard/>
      </nav>
    );
  };

  // Render sections for events on the homepage
  const getSections = () => {
    if (!events || events.length === 0) {
      return (
        <section className="mb-6">
          <div className="flex justify-center items-center h-48">
            <div className="text-gray-600">No activities available at the moment.</div>
          </div>
        </section>
      );
    }

    return (
      <section className="mb-6">
        <h2 className="font-bold mb-4 text-2xl">Upcoming Events</h2>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {events.slice(0, 12).map((e) => (
            <EventCard key={e.id} {...e} />
          ))}
        </div>
      </section>
    );
  };

  // If the user is an authenticated admin, render the admin dashboard as the
  // root homepage. Hooks have already been declared above in a stable order.
  if (isAuthenticated && userRole === USER_ROLES.ADMIN) {
    return (
      <AdminLayout>
        <AdminContent />
      </AdminLayout>
    );
  }

  // Non-admin homepage
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[#DAE9DC] to-white h-[350px]"></div>

      <Image
        src="/mountain.svg"
        alt="mountain"
        width={1920}
        height={510}
        className="w-full h-[510px] absolute inset-0 top-0 object-cover pt-11"
      />

      <div className="relative p-6"> 
        <header className={`flex justify-between items-center ${isAuthenticated ? `sticky top-0 z-10 mb-6 bg-[#DAE9DC]/10` : ''}`}>
          <Image src={getLogo()} alt="Small Logo" width={64} height={64} className="object-cover" />
          {getNavigation()}
        </header>

        <div className="flex justify-center">
          <Image src={getLogo()} alt="Big Logo" width={180} height={180} className="object-cover" />
        </div>

        {/* Only show SearchLayout if not loading or error */}
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

        {/* Only show Upcoming Events and Event Types if not searching */}
        {!isSearchActive && (
          <>
            {loading ? (
              <section className="mb-6 mt-18">
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                  <span className="ml-3 text-gray-600">Loading activities...</span>
                </div>
              </section>
            ) : error ? (
              <section className="mb-6 mt-18">
                <div className="flex justify-center items-center h-48">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
                    <h3 className="text-red-800 font-semibold mb-2">Error Loading Activities</h3>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Try Again</button>
                  </div>
                </div>
              </section>
            ) : (
              <>
                {getSections()}
                <h2 className="font-bold mb-6 text-2xl py-2">Event Types</h2>
                <div>
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