"use client";
import EventCard from "../homepage/components/EventCard";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { ChevronLeftIcon } from "@heroicons/react/20/solid";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Fetch Data from example.json
import eventsData from "../example.json";

const events = eventsData.events;

// ------------------------------------


export default function Profile() {
  const router = useRouter();

  return (
    <div className="relative">
      {/* Background gradient */}
      <div className="absolute inset-0 h-[115px] bg-gradient-to-b from-[#B4DDB6] to-white" >
        <Image
          src="/mountain.svg"
          alt="mountain"
          width={1920}
          height={510}
          className="flex absolute inset-x-0 top-0 w-full h-40 object-cover opacity-90  "
        />
      </div>

      {/* content */}
      <div className="relative p-6">

      {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute flex items-center gap-1 font-extrabold text-lg bg-white rounded-lg px-3 py-1 ring-[2px] ring-[#B4DDB6]
          hover:scale-105 transition-transform duration-200 hover:cursor-pointer hover:shadow-md"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          Back
        </button>


        {/* Profile card */}
        <div className="flex flex-col sm:flex-row items-center p-8 
                  space-y-4 sm:space-y-0 sm:space-x-8 
                  ml-0 sm:ml-4 md:ml-8 lg:ml-16 
                  transition-all duration-300">
          <Image
            src="/avatar.jpg"
            alt="profile"
            width={120}
            height={120}
            className="p-[4px] bg-gradient-to-t from-[#ACE9A9] to-[#CCDDCA] rounded-full object-cover"
          />
          <div>
            <h2 className="font-extrabold text-lg bg-white rounded-lg px-6 py-1 ring-[2px] ring-[#B4DDB6]">Mr. Somchai Ramrian</h2>
          </div>
        </div>

        {/* Profile Information */}
        <div className="flex flex-col w-full max-w-4xl mx-auto mb-8 p-6 
                bg-gradient-to-b from-[#D7EBCA]/50 to-[#EDFFCC]/50 
                rounded-3xl shadow-md">
          <div className="font-extrabold ml-8 mr-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-y-4 text-sm">
            {/* Row 1 */}
            <div className="flex justify-between items-center">
              <span>ID</span>
              <b className="w-48 h-7 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl mr-8">
                6610545952
              </b>
            </div>
            {/* Row 2 */}
            <div className="flex justify-between items-center">
              <span>Year</span>
              <b className="w-48 h-7 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl mr-8">
                3
              </b>
            </div>
            {/* Row 3 */}
            <div className="flex justify-between items-center">
              <span>Faculty</span>
              <b className="w-48 h-7 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl mr-8">
                Engineering
              </b>
            </div>
            {/* Row 4 */}
            <div className="flex justify-between items-center">
              <span>Major</span>
              <b className="w-48 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl mr-8">
                Software and Knowledge
              </b>
            </div>
          </div>
        </div>

        

        {/* My Event */}
        <section className="mb-6">
          <h3 className="font-bold text-xl mb-2">My Enrolled Event</h3>
          <div className="flex items-center">
            <div className="flex gap-4 overflow-x-auto">
              {events.map((e, i) => (
                <EventCard key={i} {...e} />
              ))}
            </div>
            <button className="ml-2 p-2 rounded-full bg-gray-200 hover:bg-gray-300">
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Favorite Event */}
        <section>
          <h3 className="font-bold text-xl mb-2">
            Favorite Event <span>⭐</span>
          </h3>
          <div className="flex items-center">
            <div className="flex gap-4 overflow-x-auto">
              {events.map((event, i) => (
                <EventCard key={i} {...event} />
              ))}
            </div>
            <button className="ml-2 p-2 rounded-full bg-gray-200 hover:bg-gray-300">
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
