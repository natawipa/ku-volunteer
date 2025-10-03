"use client";
import EventCard from "./components/EventCard";
import EventTypeSection from "./components/EventTypeSection";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon, PlusIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import Image from "next/image";

import SearchCard from "./components/SearchCard";
import ProfileCard from "./components/ProfileCard";

import { useRef, useState, useEffect} from "react";
import { useRouter } from "next/navigation";
import { auth } from "../lib/utils";
import { USER_ROLES } from "../lib/constants";
import { activitiesApi } from "../lib/activities";
import type { Activity } from "../lib/types";

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
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Check authentication and user role on component mount
  useEffect(() => {
    const authenticated = auth.isAuthenticated();
    const role = auth.getUserRole();
    setIsAuthenticated(authenticated);
    setUserRole(role);
  }, []);

  // Redirect admins to admin homepage
  useEffect(() => {
    if (isAuthenticated && userRole === USER_ROLES.ADMIN) {
      router.replace("/admin");
    }
  }, [isAuthenticated, userRole, router]);

  // Fetch activities on component mount
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching activities...');
        const response = await activitiesApi.getActivities();
        
        console.log('📥 Activities API response:', response);
        
        if (response.success && response.data) {
          // Make sure response.data is an array
          if (Array.isArray(response.data)) {
            setActivities(response.data);
            console.log('✅ Activities set:', response.data);
          } else {
            console.error('❌ Activities data is not an array:', response.data);
            setActivities([]);
            setError('Invalid activities data format');
          }
        } else {
          console.error('❌ API error:', response.error);
          setError(response.error || 'Failed to fetch activities');
          setActivities([]);
        }
      } catch (err) {
        console.error('❌ Network error:', err);
        setError('Network error occurred');
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Debug: Log activities state
  useEffect(() => {
    console.log('🔍 Activities state updated:', activities);
    console.log('🔍 Activities is array:', Array.isArray(activities));
    console.log('🔍 Activities length:', activities.length);
  }, [activities]);

  // Transform activities to events format with safety check
  const events = Array.isArray(activities) 
    ? activities.map(transformActivityToEvent)
    : [];

  console.log('🔍 Events array:', events);

  const eventTypes = [
    {
      title: "University Activities",
      color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#5992FF]/26",
      backgroundBrain: "/brainread.svg",
      events: events.filter(e => {
        return Array.isArray(e.category) && e.category.some(cat => 
          cat.includes("University Activities")
        );
      }),
    },
    {
      title: "Enhance Competencies",
      color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#FFEA47]/26",
      backgroundBrain: "/brainthink.svg",
      events: events.filter(e => {
        return Array.isArray(e.category) && e.category.some(cat => 
          cat.includes("Development of Morality") ||
          cat.includes("Development of Thinking") ||
          cat.includes("Development of Interpersonal") ||
          cat.includes("Development of Health")
        );
      }),
    },
    {
      title: "Social Engagement Activities",
      color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#FF999B]/26",
      backgroundBrain: "/brainlove.svg",
      events: events.filter(e => {
        return Array.isArray(e.category) && e.category.some(cat => 
          cat.includes("Social Engagement Activities")
        );
      }),
    },
  ];

  // Handle scroll to add shadow to header for authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      const handleScroll = () => {
        if (window.scrollY > 100) {
          setIsScrolled(true);
        } else {
          setIsScrolled(false);
        }
      };
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [isAuthenticated]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          <Link href="/all-events" className="relative border-b-1 border-transparent hover:border-black transition-all duration-200">All Event</Link>
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
        <Link href="/all-events" className="relative border-b-1 border-transparent hover:border-black transition-all duration-200">All Event</Link>
        {userRole === USER_ROLES.ORGANIZER && (
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

  // Get appropriate sections based on user role
  const getSections = () => {
    // Loading state
    if (loading) {
      return (
        <section className="mb-6 mt-18">
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-600">Loading activities...</span>
          </div>
        </section>
      );
    }

    // Error state
    if (error) {
      return (
        <section className="mb-6 mt-18">
          <div className="flex justify-center items-center h-48">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
              <h3 className="text-red-800 font-semibold mb-2">Error Loading Activities</h3>
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
      );
    }

    // Empty state
    if (!events || events.length === 0) {
      return (
        <section className="mb-6 mt-18">
          <div className="flex justify-center items-center h-48">
            <div className="text-center">
              <h3 className="text-gray-800 font-semibold mb-2">No Activities Found</h3>
              <p className="text-gray-600">There are currently no activities available.</p>
              {userRole === USER_ROLES.ORGANIZER && (
                <Link href="/new" className="btn bg-[#215701] text-white px-4 py-2 rounded hover:bg-[#00361C] mt-4 inline-block">
                  Create Your First Activity
                </Link>
              )}
            </div>
          </div>
        </section>
      );
    }

    if (!isAuthenticated) {
      return (
        <>
          <section className="mb-6 mt-18">
            <h2 className="font-extrabold mb-2 text-2xl">Upcoming Event</h2>
            <div className="flex gap-6 overflow-x-auto overflow-y-hidden pb-2 pt-2">
              {events.slice(0, 6).map((event, idx) => (
                <EventCard key={idx} {...event} />
              ))}
            </div>
          </section>

          <section className="mb-6">
            <h2 className="font-bold mb-2 text-2xl">Most Attention Event</h2>
            <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 pt-2">
              {events.slice(0, 6).map((event, idx) => (
                <EventCard key={idx} {...event} />
              ))}
            </div>
          </section>
        </>
      );
    }

    if (userRole === USER_ROLES.STUDENT) {
      return (
        <>
          <section className="mb-6 mt-18">
            <h2 className="font-extrabold mb-2 text-2xl">My Enrolled Event</h2>
            <div className="flex gap-6 overflow-x-auto overflow-y-hidden pb-2 pt-2">
              {events.slice(0, 4).map((event, idx) => (
                <EventCard key={`enrolled-${idx}`} {...event} />
              ))}
            </div>
          </section>
          
          <section className="mb-6">
            <h2 className="font-extrabold mb-2 text-2xl">Upcoming Event</h2>
            <div className="flex gap-6 overflow-x-auto overflow-y-hidden pb-2 pt-2">
              {events.slice(0, 6).map((event, idx) => (
                <EventCard key={`upcoming-${idx}`} {...event} />
              ))}
            </div>
          </section>

          <section className="mb-6">
            <h2 className="font-bold mb-2 text-2xl">Most Attention Event</h2>
            <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 pt-2">
              {events.slice(0, 6).map((event, idx) => (
                <EventCard key={`popular-${idx}`} {...event} />
              ))}
            </div>
          </section>
        </>
      );
    }

    if (userRole === USER_ROLES.ORGANIZER) {
      return (
        <>
          <section className="mb-6 mt-18">
            <h2 className="font-extrabold mb-2 text-2xl">My Organization Event</h2>
            <div className="flex gap-6 overflow-x-auto overflow-y-hidden pb-2 pt-2">
              {events.slice(0, 4).map((event, idx) => (
                <EventCard key={`my-events-${idx}`} {...event} />
              ))}
            </div>
          </section>
          
          <section className="mb-6 mt-18">
            <h2 className="font-extrabold mb-2 text-2xl">Upcoming Event</h2>
            <div className="flex gap-6 overflow-x-auto overflow-y-hidden pb-2 pt-2">
              {events.slice(0, 6).map((event, idx) => (
                <EventCard key={`org-upcoming-${idx}`} {...event} />
              ))}
            </div>
          </section>

          <section className="mb-6">
            <h2 className="font-bold mb-2 text-2xl">Most Attention Event</h2>
            <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 pt-2">
              {events.slice(0, 6).map((event, idx) => (
                <EventCard key={`org-popular-${idx}`} {...event} />
              ))}
            </div>
          </section>
        </>
      );
    }

    return null;
  };

  return (
    <div className="relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#DAE9DC] to-white h-[350px]"></div>

      {/* Mountain background */}
      <Image
        src="/mountain.svg"
        alt="mountain"
        width={1920}
        height={510}
        className="w-full h-[510px] absolute inset-0 top-0 object-cover pt-11"
      />

      {/* Foreground content */}
      <div className="relative p-6"> 
        <header className={`flex justify-between items-center ${
          isAuthenticated ? `sticky top-0 z-10 mb-6 bg-[#DAE9DC]/10` : ''
        }`}>
          <Image
            src={getLogo()}
            alt="Small Logo"
            width={64}
            height={64}
            className="object-cover"
          />
          {getNavigation()}
        </header>

        <div className="flex justify-center">
          <Image
            src={getLogo()}
            alt="Big Logo"
            width={180}
            height={180}
            className="object-cover"
          />
        </div>

        <section
          className={`mb-6 ${
            isAuthenticated && userRole === USER_ROLES.STUDENT
              ? `transition-all duration-300 z-40 ${
                  isScrolled
                    ? "sticky top-14 w-full px-4"   // sticks below navbar
                    : "relative flex justify-center"
                }`
              : "flex justify-center"
          }`}
        >
          <div
            ref={wrapperRef}
            className={`${
              isAuthenticated && userRole === USER_ROLES.STUDENT
                ? `transition-all duration-300 ${
                    isScrolled
                      ? "max-w-md mx-auto scale-90" // smaller when scrolled
                      : "relative w-150"
                  }`
                : "relative w-150"
            }`}
          >

            <div className="flex bg-white items-center rounded-md px-4 py-3 shadow-md"
              onClick={() => setIsOpen(true)} // toggle on click
            >
              <MagnifyingGlassIcon className="text-black-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Find activities"
                className="font-mitr ml-2 flex-1 border-0 bg-transparent outline-none"
                onFocus={() => setIsOpen(true)}   // open when focused
              />
              <div className="h-6 w-[1px] bg-gray-200 mx-2"></div>
              <ChevronDownIcon className="text-black-400 w-5 h-5 ml-2 opacity-50" />
            </div>

            {/* Dropdown SearchCard */}
            {isOpen && (
              <div className="absolute top-full mt-1 w-full z-50">
                <SearchCard />
              </div>
            )}
          </div>
        </section>
          
        {/* -------------------------- */}
        
        {getSections()}
            
        <h2 className="font-bold mb-6 text-2xl py-2">Event Types</h2>
        <div>
          {eventTypes.map((type, idx) => (
            <EventTypeSection key={idx} {...type} />
          ))}
      </div>

      </div>
    </div>
  );
}