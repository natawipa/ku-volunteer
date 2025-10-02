"use client";
import EventCard from "./components/EventCard";
import EventTypeSection from "./components/EventTypeSection";
import SearchCard from "./components/SearchCard";
import ProfileCard from "./components/ProfileCard";
import { MagnifyingGlassIcon, ChevronDownIcon, PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { isAuthenticated, getUserRole } from "../lib/auth";

// Fetch Data from example.json
import eventsData from "./example.json";

const events = eventsData.events;

// ------------------------------------
const eventTypes = [
  {
    title: "กิจกรรมมหาวิทยาลัย",
    color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#5992FF]/26",
    backgroundBrain: "/brainread.svg",
    events: events.filter(e => e.category?.includes("กิจกรรมมหาวิทยาลัย")),
  },
  {
    title: "กิจกรรมเพื่อการเสริมสร้างสมรรถนะ",
    color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#FFEA47]/26",
    backgroundBrain: "/brainthink.svg",
    events: events.filter(e => e.category?.includes("เสริมสร้างสมรรถนะ")),
  },
  {
    title: "กิจกรรมเพื่อสังคม",
    color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#FF999B]/26",
    backgroundBrain: "/brainlove.svg",
    events: events.filter(e => e.category?.includes("เพื่อสังคม")),
  },
];

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userRole, setUserRole] = useState<'student' | 'organizer' | 'staff'>('student');
  const [authenticated, setAuthenticated] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Check authentication status and user role on mount
  useEffect(() => {
    setAuthenticated(isAuthenticated());
    if (isAuthenticated()) {
      setUserRole(getUserRole());
    }
  }, []);

  // Handle scroll to add shadow to header (for authenticated users)
  useEffect(() => {
    if (!authenticated) return;
    
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [authenticated]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get the appropriate logo based on user role
  const getLogo = () => {
    if (!authenticated) return "/Logo_Kasetsart.svg";
    return userRole === 'organizer' || userRole === 'staff' ? "/Logo_Staff.svg" : "/Logo_Kasetsart.svg";
  };

  // Get role-specific content sections
  const getRoleSpecificSections = () => {
    if (!authenticated) {
      return (
        <>
          <section className="mb-6 mt-18">
            <h2 className="font-extrabold mb-2 text-2xl">Upcoming Event</h2>
            <div className="flex gap-6 overflow-x-auto overflow-y-hidden pb-2 pt-2">
              {events.map((event, idx) => (
                <EventCard key={idx} {...event} />
              ))}
            </div>
          </section>

          <section className="mb-6">
            <h2 className="font-bold mb-2 text-2xl">Most Attention Event</h2>
            <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 pt-2">
              {events.map((event, idx) => (
                <EventCard key={idx} {...event} />
              ))}
            </div>
          </section>
        </>
      );
    }

    // Authenticated user sections
    switch (userRole) {
      case 'student':
        return (
          <>
            <section className="mb-6 mt-18">
              <h2 className="font-extrabold mb-2 text-2xl">My Enrolled Event</h2>
              <div className="flex gap-6 overflow-x-auto overflow-y-hidden pb-2 pt-2">
                {events.map((event, idx) => (
                  <EventCard key={idx} {...event} />
                ))}
              </div>
            </section>
            
            <section className="mb-6">
              <h2 className="font-extrabold mb-2 text-2xl">Upcoming Event</h2>
              <div className="flex gap-6 overflow-x-auto overflow-y-hidden pb-2 pt-2">
                {events.map((event, idx) => (
                  <EventCard key={idx} {...event} />
                ))}
              </div>
            </section>

            <section className="mb-6">
              <h2 className="font-bold mb-2 text-2xl">Most Attention Event</h2>
              <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 pt-2">
                {events.map((event, idx) => (
                  <EventCard key={idx} {...event} />
                ))}
              </div>
            </section>
          </>
        );
      case 'organizer':
      case 'staff':
        return (
          <>
            <section className="mb-6 mt-18">
              <h2 className="font-extrabold mb-2 text-2xl">My Organization Event</h2>
              <div className="flex gap-6 overflow-x-auto overflow-y-hidden pb-2 pt-2">
                {events.map((event, idx) => (
                  <EventCard key={idx} {...event} />
                ))}
              </div>
            </section>
            
            <section className="mb-6 mt-18">
              <h2 className="font-extrabold mb-2 text-2xl">Upcoming Event</h2>
              <div className="flex gap-6 overflow-x-auto overflow-y-hidden pb-2 pt-2">
                {events.map((event, idx) => (
                  <EventCard key={idx} {...event} />
                ))}
              </div>
            </section>

            <section className="mb-6">
              <h2 className="font-bold mb-2 text-2xl">Most Attention Event</h2>
              <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 pt-2">
                {events.map((event, idx) => (
                  <EventCard key={idx} {...event} />
                ))}
              </div>
            </section>
          </>
        );
      default:
        return null;
    }
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
        <header className={`flex justify-between items-center ${authenticated && isScrolled ? 'sticky top-0 z-10 mb-6 bg-[#DAE9DC]/10' : ''}`}>
          <Image
            src={getLogo()}
            alt="Small Logo"
            width={64}
            height={64}
            className="object-cover"
          />
          <nav className="flex items-center space-x-8">
            <Link href="/document" className="relative border-b-1 border-transparent hover:border-black transition-all duration-200">Document</Link>
            <Link href="/all-events" className="relative border-b-1 border-transparent hover:border-black transition-all duration-200">All Event</Link>
            
            {/* Show different nav items based on authentication */}
            {!authenticated ? (
              <Link href="/login" 
                className="btn bg-[#215701] text-white px-4 py-2 rounded 
                          hover:bg-[#00361C]
                          transition-all duration-200">
                Sign In
              </Link>
            ) : (
              <>
                {/* Show "New" button for organizers/staff */}
                {(userRole === 'organizer' || userRole === 'staff') && (
                  <Link href="/new" className="btn bg-[#215701] text-white px-2 py-2 rounded 
                            hover:bg-[#00361C]
                            transition-all duration-200">
                    <div className="flex items-center">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      <span className="mr-1">New</span>
                    </div>
                  </Link>
                )}
                <ProfileCard role={userRole === 'student' ? 'student-homepage' : 'organization-homepage'} />
              </>
            )}
          </nav>
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

        {/* Dynamic search section based on authentication and scroll state */}
        <section
          className={`mb-6 transition-all duration-300 z-40 ${
            authenticated && isScrolled
              ? "sticky top-14 w-full px-4"   // sticks below navbar for authenticated users
              : "flex justify-center"
          }`}
        >
          <div
            ref={wrapperRef}
            className={`transition-all duration-300 ${
              authenticated && isScrolled
                ? "max-w-md mx-auto scale-90" // smaller when scrolled for authenticated users
                : "relative w-150"
            }`}
          >
            <div className="flex bg-white items-center rounded-md px-4 py-3 shadow-md"
              onClick={() => setIsOpen(true)} // toggle on click
            >
              <MagnifyingGlassIcon className="text-black-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ค้นหากิจกรรม"
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
            
        {/* Role-specific content sections */}
        {getRoleSpecificSections()}
            
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
