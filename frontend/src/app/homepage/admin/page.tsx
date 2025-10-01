"use client";
import EventCard from "../components/EventCard";
import SearchCard from "@/app/homepage/components/SearchCard";
import { MagnifyingGlassIcon, ChevronDownIcon} from "@heroicons/react/24/outline";
import { PlusIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import Image from "next/image";

import { useRef, useState, useEffect} from "react";

// Fetch Data from example.json
import eventsData from "./../../dataexample/example.json";
import students from "./../../dataexample/students.json";
import organizations from "./../../dataexample/organization.json";
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
              <Link href="/new" className="btn bg-[#215701] text-white px-2 py-2 rounded 
                      hover:bg-[#00361C]
                      transition-all duration-200">
              <div className="flex items-center">
              <PlusIcon className="w-4 h-4 mr-2" />
              <span className="mr-1">New</span>
              </div>
            </Link>
              <Link href="/profile">
              { <UserCircleIcon className="w-10 h-10 text-[#215701] hover:text-[#00361C] transition-all duration-200" /> }
              </Link>
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
        
        <section className="mb-6 mt-11">
            <h2 className="font-extrabold mb-2 text-2xl">Recent Pending Events</h2>
            <div className="flex gap-6 overflow-x-auto overflow-y-hidden pb-2 pt-2">
                {events.map((event, idx) => (
                <EventCard key={idx} {...event} />
                ))}
            </div>
        </section>

        <h2 className="font-bold mb-6 text-2xl pt-2">Status Events</h2>
        <Link href="/admin/events/pending">
          <h3 className="font-semibold mb-4 text-xl bg-gradient-to-r from-green-300/25 to-yellow-300/25 p-5 w-full rounded-lg shadow-md hover:scale-102 transition-transform duration-200">Pending Events</h3>
        </Link>
        <Link href="/admin/events/approved">
          <h3 className="font-semibold mb-4 text-xl bg-gradient-to-r from-blue-300/25 to-purple-300/25 p-5 w-full rounded-lg shadow-md hover:scale-102 transition-transform duration-200">Approved Events</h3>
        </Link>
        <Link href="/admin/events/rejected">
          <h3 className="font-semibold mb-4 text-xl bg-gradient-to-r from-red-300/25 to-pink-300/25 p-5 w-full rounded-lg shadow-md hover:scale-102 transition-transform duration-200">Rejected Events</h3>
        </Link>

        <h2 className="font-bold mb-6 text-2xl pt-6">User List</h2>
        <Link href={`admin/student-list`}>
          <div className={`shadow-lg p-4 mb-10 rounded-lg relative overflow-hidden  bg-gradient-to-r from-green-300/25 to-purple-500/25 hover:scale-102 transition-transform duration-200`}>
            {/* Background brain image */}
            <Image
                src={"/student.svg"}
                alt="Student illustration"
                width={200}
                height={200}
                className="absolute right-0 bottom-0 opacity-50 pointer-events-none"
              />
        
            {/* Section title */}
            <h2 className="font-medium mb-2 relative z-10 text-xl">
              Student List <span className="text-gray-600">&gt;</span>
            </h2>

            {/* List of student names */}
            <div className="space-y-3 px-4">
               {students.slice().reverse().slice(0, 2).map((s, index) => (
                <p
                  key={s.id}
                  className={`border-b border-gray-300 pb-2 ${
                    index === 1 ? "text-gray-400" : "text-gray-700"
                  }`}
                >
                  {s.title} {s.first_name} {s.last_name}
                </p>
              ))}
            </div>
          </div>
        </Link>
        
        <Link href="admin/organization-list">
          <div className={`shadow-lg p-4 mb-10 rounded-lg relative overflow-hidden  bg-gradient-to-r from-green-300/25 to-orange-400/25 hover:scale-102 transition-transform duration-200`}>
            {/* Background brain image */}
            <Image
                src={"/organization.svg"}
                alt="Organization illustration"
                width={200}
                height={200}
                className="absolute right-0 bottom-0 opacity-60 pointer-events-none"
              />
        
            {/* Section title */}
            <h2 className="font-medium mb-2 relative z-10 text-xl">
              Organization List <span className="text-gray-600">&gt;</span>
            </h2>

            {/* List of student names */}
            <div className="space-y-3 px-4">
               {organizations.slice().reverse().slice(0, 2).map((s, index) => (
                <p
                  key={s.id}
                  className={`border-b border-gray-300 pb-2 ${
                    index === 1 ? "text-gray-400" : "text-gray-700"
                  }`}
                >
                  {s.organization_name}
                </p>
              ))}
            </div>
          </div>
          </Link>


      </div>
    </div>
  );
}
