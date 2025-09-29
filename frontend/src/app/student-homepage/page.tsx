"use client";
import EventCard from "../components/EventCard";
import EventTypeSection from "../components/EventTypeSection";
import SearchCard from "../components/SearchCard";
import ProfileCard from "../components/ProfileCard";
import { MagnifyingGlassIcon, ChevronDownIcon} from "@heroicons/react/24/outline";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import Image from "next/image";

import { useRef, useState, useEffect} from "react";

// Fetch Data from example.json
import eventsData from "../example.json";

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
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isScrolled, setIsScrolled] = useState(false);
  
    // Handle scroll to add shadow to header
    useEffect(() => {
      const handleScroll = () => {
        if (window.scrollY > 100) {
          setIsScrolled(true);
        } else {
          setIsScrolled(false);
        }
      };
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }, []);
    
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
          <header className="flex justify-between items-center sticky top-0 z-10 mb-6 bg-[#DAE9DC]/10">
            <Image
              src="/Logo_Kasetsart.svg"
              alt="Small Logo"
              width={64}
              height={64}
              className="object-cover"
            />
            <nav className="flex items-center space-x-8">
              <Link href="/document" className="relative border-b-1 border-transparent hover:border-black transition-all duration-200">Document</Link>
              <Link href="/all-events" className="relative border-b-1 border-transparent hover:border-black transition-all duration-200">All Event</Link>
              <ProfileCard />
            </nav>
          </header>
  
          <div className="flex justify-center">
            <Image
              src="/Logo_Kasetsart.svg"
              alt="Big Logo"
              width={180}
              height={180}
              className="object-cover"
            />
          </div>
  
          <section
            className={`transition-all duration-300 z-40 ${
              isScrolled
                ? "sticky top-14 w-full px-4"   // sticks below navbar
                : "relative flex justify-center"
            }`}
          >
            <div
              ref={wrapperRef}
              className={`transition-all duration-300 ${
                isScrolled
                  ? "max-w-md mx-auto scale-90" // smaller when scrolled
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
