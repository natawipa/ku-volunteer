import EventCard from "./components/EventCard";
import EventTypeSection from "./components/EventTypeSection";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

const upcomingEvents = [
  // { title: "Event title", dateStart: "01/01/2025", dateEnd: "02/01/2025", location: "Building A", imgSrc: "/event1.jpg", status: "Open" },
  // { title: "Event title", dateStart: "02/01/2025", dateEnd: "02/01/2025", location: "Building B", imgSrc: "/event2.jpg", status: "Closed" },
];

const mostAttentionEvents = [
  // { title: "Event title", dateStart: "01/01/2025", dateEnd: "01/01/2025", location: "Building A", imgSrc: "/event1.jpg" },
  // { title: "Event title", dateStart: "02/01/2025", dateEnd: "02/01/2025", location: "Building B", imgSrc: "/event2.jpg" },
];

const eventTypes = [
  {
    title: "กิจกรรมมหาวิทยาลัย",
    color: "bg-gradient-to-r from-blue-100 to-blue-50",
    events: [],
  },
  {
    title: "กิจกรรมเพื่อการเสริมสร้างสมรรถนะ",
    color: "bg-gradient-to-r from-yellow-100 to-yellow-50",
    events: [],
  },
  {
    title: "กิจกรรมเพื่อสังคม",
    color: "bg-gradient-to-r from-pink-100 to-pink-50",
    events: [],
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
            <button className="btn bg-[#215701] text-white px-4 py-2 rounded">
              Sign In
            </button>
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
            {upcomingEvents.map((event, idx) => (
              <EventCard key={idx} {...event} />
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2 text-2xl">Most Attention Event</h2>
          <div className="flex gap-4 overflow-x-auto">
            {mostAttentionEvents.map((event, idx) => (
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
