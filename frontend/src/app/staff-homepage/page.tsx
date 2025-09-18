import EventCard from "../components/EventCard";
import EventTypeSection from "../components/EventTypeSection";
// import EventCardHorizontal from "../components/EventCardHorizontal";
import { MagnifyingGlassIcon, ChevronDownIcon, PlusIcon } from "@heroicons/react/24/outline";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import Image from "next/image";

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
        className="absolute inset-0 top-0 w-full h-[510px] object-cover pt-11"
      />

      {/* Foreground content */}
      <div className="relative p-6">
        <header className="flex justify-between items-center">
          <Image
            src="/Logo_Staff.svg"
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
            src="/Logo_Staff.svg"
            alt="Big Logo"
            width={180}
            height={180}
            className="object-cover"
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

        {/* -------------------------- */}

        <section className="mb-6 mt-18">
          <h2 className="font-extrabold mb-2 text-2xl">My Organized Event</h2>
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
