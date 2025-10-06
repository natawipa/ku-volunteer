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
import { auth } from "../lib/utils";
import { USER_ROLES } from "../lib/constants";
import { activitiesApi } from "../lib/activities";
import type { Activity } from "../lib/types";
import AdminLayout from "./admin/components/AdminLayout";
import AdminContent from "./admin/AdminContent";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("All Categories");
  const [searchDate, setSearchDate] = useState("");
  const [isSearchApplied, setIsSearchApplied] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('searchHistory');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  // Save search history to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }
  }, [searchHistory]);


  // Filter events based on search criteria
  // const filterEvents = (events: ReturnType<typeof transformActivityToEvent>[]) => {
  // return events.filter(ev => {
  //   const q = searchQuery.toLowerCase().trim();
  //   const matchesSearch =
  //     !q ||
  //     ev.title.toLowerCase().includes(q) ||
  //     ev.location.toLowerCase().includes(q);

  //     // Category filter
  //     const matchesCategory = searchCategory === "All Categories" ||
  //       (Array.isArray(ev.category) && ev.category.some(c => {
  //         if (searchCategory === "Social Impact") {
  //           return c.includes("Social Engagement Activities");
  //         }
  //         return c.includes(searchCategory);
  //       }));

  //     // Date filter - check if searchDate falls within event dates or is before start
  //     const matchesDate = !searchDate || (() => {
  //       const searchDateObj = new Date(searchDate);
  //       const startDateObj = new Date(ev.dateStart.split('/').reverse().join('-')); // Convert dd/mm/yyyy to yyyy-mm-dd
  //       const endDateObj = new Date(ev.dateEnd.split('/').reverse().join('-'));
        
  //       // Check if search date is within event range or before start
  //       return searchDateObj >= startDateObj && searchDateObj <= endDateObj;
  //     })();

  //     return matchesSearch && matchesCategory && matchesDate;
  //   });
  // };

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
      const handleScroll = () => setIsScrolled(window.scrollY > 100);
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


  // Filter events based on searchQuery (case-insensitive, matches title or location)
  const getFilteredEvents = () => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return events;
    return events.filter(ev =>
      ev.title.toLowerCase().includes(q) ||
      ev.location.toLowerCase().includes(q)
    );
  };

  // Render events in search results layout (filtered)
  const renderSearchResults = () => {
    const filteredEvents = getFilteredEvents();
    if (!filteredEvents || filteredEvents.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">No events found matching your search.</p>
        </div>
      );
    }

    return (
      <div className="mt-6">
        <h2 className="font-semibold text-xl mb-4">Search Results ({filteredEvents.length} events)</h2>
        <div className="space-y-4">
          {filteredEvents.map((event, idx) => (
            <Link href={`/event-detail/${event.id}`} key={idx}>
              <div className="bg-white rounded-lg shadow-md p-4 mb-8 flex gap-4 hover:shadow-lg hover:scale-103 transition-transform transition-shadow">
                <div className="w-48 h-32 relative flex-shrink-0">
                  <Image
                    src={event.imgSrc}
                    alt={event.title}
                    fill
                    className="rounded-md object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Location: {event.location}</p>
                    <p>Date: {event.dateStart} - {event.dateEnd}</p>
                    <div className="flex gap-2 mt-2">
                      {event.category.map((cat, i) => (
                        <span key={i} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  // Get appropriate sections based on user role
  const getSections = () => {
    // If search is applied, show search results layout
    if (isSearchApplied) {
      return renderSearchResults();
    }

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
              onClick={() => { setIsOpen(true); setIsSearchApplied(true); }}
            >
              <MagnifyingGlassIcon className="text-black-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search activities"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  const trimmed = e.target.value.trim();
                  if (trimmed === '') {
                    setIsSearchApplied(false);
                  } else {
                    setIsSearchApplied(true);
                  }
                }}
                className="font-mitr ml-2 flex-1 border-0 bg-transparent outline-none"
                onFocus={() => { setIsOpen(true); setIsSearchApplied(true); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsOpen(false);
                    setIsSearchApplied(true);
                    // Add to search history if not empty and not duplicate
                    const trimmed = searchQuery.trim();
                    if (trimmed && !searchHistory.includes(trimmed)) {
                      setSearchHistory([trimmed, ...searchHistory].slice(0, 10)); // keep max 10
                    }
                  }
                }}
              />
              {/* Search history dropdown */}
              {isOpen && searchHistory.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow z-50 max-h-48 overflow-y-auto">
                  {searchHistory.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 cursor-pointer">
                      <span
                        onClick={() => {
                          setSearchQuery(item);
                          setIsSearchApplied(true);
                          setIsOpen(false);
                        }}
                        className="flex-1 text-left"
                      >
                        {item}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchHistory(searchHistory.filter((h) => h !== item));
                        }}
                        className="ml-2 text-xs text-red-500 hover:text-red-700"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {isSearchApplied && searchQuery && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchQuery('');
                    setSearchCategory('All Categories');
                    setSearchDate('');
                    setIsSearchApplied(false);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 px-2"
                >
                  Clear
                </button>
              )}
              <div className="h-6 w-[1px] bg-gray-200 mx-2"></div>
              <ChevronDownIcon className="text-black-400 w-5 h-5 ml-2 opacity-50" />
            </div>

            {isOpen && (
              <div className="absolute top-full mt-1 w-full z-50">
                <SearchCard
                  query={searchQuery}
                  setQuery={setSearchQuery}
                  category={searchCategory}
                  setCategory={setSearchCategory}
                  date={searchDate}
                  setDate={setSearchDate}
                  history={searchHistory.map(q => ({ query: q, category: "All Categories", date: "" }))}
                  setHistory={(h) => setSearchHistory(h.map(item => item.query))}
                  onSelectHistory={(item) => {
                    setSearchQuery(item.query);
                    setIsSearchApplied(true);
                    setIsOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsOpen(false);
                      setIsSearchApplied(true);
                      // Add to search history if not empty and not duplicate
                      const trimmed = searchQuery.trim();
                      if (trimmed && !searchHistory.includes(trimmed)) {
                        setSearchHistory([trimmed, ...searchHistory].slice(0, 10));
                      }
                    }
                  }}
                  onApply={() => {
                    setIsOpen(false);
                    setIsSearchApplied(true);
                    // Add to search history if not empty and not duplicate
                    const trimmed = searchQuery.trim();
                    if (trimmed && !searchHistory.includes(trimmed)) {
                      setSearchHistory([trimmed, ...searchHistory].slice(0, 10));
                    }
                  }}
                />
              </div>
            )}
          </div>
        </section>
          
        {/* -------------------------- */}
        
        {getSections()}
            
        {/* Show Event Types sections only when not in search mode */}
        {!isSearchApplied && (
          <>
            <h2 className="font-bold mb-6 text-2xl py-2">Event Types</h2>
            <div>
              {eventTypes.map((type, idx) => (
                <EventTypeSection key={idx} {...type} />
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}