// import SearchFilter from "../components/SearchCard";
import { MagnifyingGlassIcon, ChevronDownIcon, PlusIcon } from "@heroicons/react/24/outline";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import Image from "next/image";

// Fetch Data from example.json
import eventsData from "../../example.json";
import EventCardHorizontal from "@/app/homepage/components/EventCardHorizontal";

const events = eventsData.events;

// ------------------------------------
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
                src="/Logo_Student.svg"
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
                src="/Logo_Student.svg"
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

            {/* <EventCard /> */}

            <div className="relative bg-gradient-to-r from-[#A1E59E]/26 to-[#5992FF]/26 
                    max-w-7xl sm:px-6 lg:px-8 lg:mt-15 
                    border-indigo-50 rounded shadow-md flex items-center justify-between">
    
            {/* Text section (keeps padding) */}
            <div className="px-6">
                <h2 className="font-bold text-3xl">University Event</h2>
            </div>

            {/* Image section (flush to edge) */}
            <div className="pb-0 pr-3">
                <Image 
                src="/brainread.svg"
                alt="brainread" 
                width={120} 
                height={120} 
                className="object-contain opacity-50" 
                />
            </div>
        </div>
        {/* Event card */}
            <div className="p-4 mt-4 border-[4px] border-green-50 rounded-lg shadow-md space-y-4">
            <EventCardHorizontal />
            </div>
      </div>
    </div>
  );
}
