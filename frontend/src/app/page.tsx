import EventCard from "./components/EventCard";
import EventTypeSection from "./components/EventTypeSection";
import EventCardHorizontal from "./components/EventCardHorizontal";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import Link from "next/link";

const events = [
  {
    title: "Volunteer Camp",
    dateStart: "10/09/2025",
    dateEnd: "12/09/2025",
    location: "Bangkok",
    catagory: ["กิจกรรมมหาวิทยาลัย", "เพื่อสังคม"],
    imgSrc: "/titleExample.jpg",
    status: "upcoming",
  },
  {
    title: "Coding Hackathon",
    dateStart: "15/09/2025",
    dateEnd: "16/09/2025",
    location: "KU Campus",
    catagory: ["เสริมสร้างสมรรถนะ"],
    imgSrc: "/titleExample2.jpg",
    status: "during",
  },
];

// ------------------------------------
const eventTypes = [
  {
    title: "กิจกรรมมหาวิทยาลัย",
    color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#5992FF]/26",
    backgroundBrain: "/brainread.svg",
    events: events.filter(e => e.catagory?.includes("กิจกรรมมหาวิทยาลัย")),
  },
  {
    title: "กิจกรรมเพื่อการเสริมสร้างสมรรถนะ",
    color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#FFEA47]/26",
    backgroundBrain: "/brainthink.svg",
    events: events.filter(e => e.catagory?.includes("เสริมสร้างสมรรถนะ")),
  },
  {
    title: "กิจกรรมเพื่อสังคม",
    color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#FF999B]/26",
    backgroundBrain: "/brainlove.svg",
    events: events.filter(e => e.catagory?.includes("เพื่อสังคม")),
  },
];

export default function Home() {
  return (
    <div className="relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#DAE9DC] to-white h-[350px] shadow-md"></div>

      {/* Mountain background */}
      <img
        src="/mountain.svg"
        alt="mountain"
        className="absolute inset-0 top-0 w-full h-[510px] object-cover pt-11"
      />

      {/* Foreground content */}
      <div className="relative p-6">
        <header className="flex justify-between items-center mb-6">
          <img
            src="/small_logo.png"
            alt="Small Logo"
            className="w-8 h-16 object-cover"
          />
          <nav className="space-x-8">
            <button className="btn">Document</button>
            <button className="btn">All Event</button>
            <Link href="/staff-homepage" 
            className="btn bg-[#215701] text-white px-4 py-2 rounded 
                      hover:shadow-lg hover:shadow-[#215701]/50 hover:shadow-x-0 hover:shadow-y-2
                      transition-all duration-200">
              Sign In
            </Link>
          </nav>
        </header>

        <div className="flex justify-center mb-6">
          <img
            src="/big_logo.png"
            alt="Big Logo"
            className="w-22 h-32 object-cover"
          />
        </div>

        <section className="mb-6 flex justify-center">
          <div className="flex bg-white items-center rounded-md px-4 py-3 w-150 shadow-md">
            <MagnifyingGlassIcon className="text-black-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ค้นหากิจกรรม"
              className="font-mitr ml-2 flex-1 border-0 bg-transparent outline-none"
            />

            <div className="h-6 w-[1px] bg-gray-200 mx-2"></div>
            <ChevronDownIcon className="text-black-400 w-5 h-5 ml-2 opacity-50" />
          </div>
        </section>
        
        <section className="mb-6 py-18">
          <h2 className="font-extrabold mb-2 text-2xl">Upcoming Event</h2>
          <div className="flex gap-6 overflow-x-auto">
            {events.map((event, idx) => (
              <EventCard key={idx} {...event} />
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2 text-2xl">Most Attention Event</h2>
          <div className="flex gap-4 overflow-x-auto">
            {events.map((event, idx) => (
              <EventCard key={idx} {...event} />
            ))}
          </div>
        </section>
            
        <h2 className="font-bold mb-2 text-2xl px-2">Event Types</h2>
        <div>
          {eventTypes.map((type, idx) => (
            <EventTypeSection key={idx} {...type} />
          ))}
      </div>

      </div>
    </div>
  );
}
