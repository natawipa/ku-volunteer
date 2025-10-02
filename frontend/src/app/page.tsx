"use client";
import EventCard from "./components/EventCard";
import EventTypeSection from "./components/EventTypeSection";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon, PlusIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import Image from "next/image";

// Fetch Data from example.json
import eventsData from "./example.json";
import SearchCard from "./components/SearchCard";
import ProfileCard from "./components/ProfileCard";

import { useRef, useState, useEffect} from "react";
import { auth } from "../lib/utils";
import { USER_ROLES } from "../lib/constants";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Check authentication and user role on component mount
  useEffect(() => {
    const authenticated = auth.isAuthenticated();
    const role = auth.getUserRole();
    setIsAuthenticated(authenticated);
    setUserRole(role);
  }, []);

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
    if (!isAuthenticated) {
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

    if (userRole === USER_ROLES.STUDENT) {
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
    }

    if (userRole === USER_ROLES.ORGANIZER) {
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
