"use client";
import EventCard from "../../components/EventCard";
import { activitiesApi } from "../../../lib/activities";
import type { Activity } from "../../../lib/types";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { MagnifyingGlassIcon, ChevronDownIcon, PlusIcon } from "@heroicons/react/24/outline";
import { auth } from "../../../lib/utils";
import { USER_ROLES } from "../../../lib/constants";
import ProfileCard from "../../components/ProfileCard";
import SearchCard from "../../components/SearchCard";

// Transform Activity to EventCard format
const transformActivityToEvent = (activity: Activity) => {
  if (!activity) {
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
    id: activity.id,
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

export default function SocialEngagementActivities() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Check authentication and user role 
  useEffect(() => {
    const authenticated = auth.isAuthenticated();
    const role = auth.getUserRole();
    setIsAuthenticated(authenticated);
    setUserRole(role);
  }, []);

  // Fetch social activities
  useEffect(() => {
    const fetchSocialEngagementActivities = async () => {
      try {
        setLoading(true);
        const response = await activitiesApi.getActivities();
        
        if (response.success && response.data) {
          // Filter activities
          const SocialEngagementActivities = response.data.filter(activity => 
            Array.isArray(activity.categories) && activity.categories.some(cat => 
              cat.includes("Social Engagement Activities")
            )
          );
          setActivities(SocialEngagementActivities);
        } else {
          setError(response.error || 'Failed to fetch activities');
        }
      } catch (err) {
        console.error('Error fetching Social Engagement Activities activities:', err);
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSocialEngagementActivities();
  }, []);

  // Handle scroll
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

  const events = activities.map(transformActivityToEvent);

  // Get logo based on user role
  const getLogo = () => {
    if (!isAuthenticated) return "/Logo_Kasetsart.svg";
    return userRole === USER_ROLES.ORGANIZER ? "/Logo_Staff.svg" : "/Logo_Kasetsart.svg";
  };

  // Get navigation for authenticated users
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
                    ? "sticky top-14 w-full px-4"
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
                      ? "max-w-md mx-auto scale-90"
                      : "relative w-150"
                  }`
                : "relative w-150"
            }`}
          >
            <div className="flex bg-white items-center rounded-md px-4 py-3 shadow-md"
              onClick={() => setIsOpen(true)}
            >
              <MagnifyingGlassIcon className="text-black-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ค้นหากิจกรรม"
                className="font-mitr ml-2 flex-1 border-0 bg-transparent outline-none"
                onFocus={() => setIsOpen(true)}
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

        {/* Back to home */}
        <div className="mb-6">
          <Link 
            href="/"
            className="inline-flex items-center text-[#215701] hover:text-[#00361C] transition-colors"
          >
            <ChevronDownIcon className="w-5 h-5 mr-1 rotate-90" />
            Back to Home
          </Link>
        </div>

        {/* Event Type Header Section */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-[#A1E59E]/26 to-red-200 rounded-lg p-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Social Engagement Activities </h1>
            </div>
            <Image
              src="/brainlove.svg"
              alt="brain icon"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
        </section>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-600">Loading social engagement activities...</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto text-center">
            <h3 className="text-red-800 font-semibold mb-2">Error Loading Activities</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Activities grid */}
        {!loading && !error && (
          <>
            {events.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-gray-800 font-semibold mb-2 text-xl">No Social Engagement Activities Found</h3>
                <p className="text-gray-600">There are currently no social engagement activities available.</p>
                {userRole === USER_ROLES.ORGANIZER && (
                  <Link href="/new" className="btn bg-[#215701] text-white px-4 py-2 rounded hover:bg-[#00361C] mt-4 inline-block">
                    Create Social Engagement Activity
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {events.map((event, idx) => (
                  <EventCard key={idx} {...event} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}