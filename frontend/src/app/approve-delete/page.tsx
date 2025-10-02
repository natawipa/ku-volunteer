"use client";
import { MagnifyingGlassIcon, ChevronDownIcon} from "@heroicons/react/24/outline";
import { PlusIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import Image from "next/image";

import { useRef, useState, useEffect} from "react";

// Fetch Data from requestDelete.json
import eventsData from "../requestDelete.json";
import { Check } from "lucide-react";

const events = eventsData.events;

interface Event {
  id: number;
  title: string;
  post: string;
  datestart: string;
  dateend: string;
  location: string;
  description: string;
  image: string;
  category: string[];
  reason: string;
  capacity: number;
  organizer: string;
  additionalImages?: string[];
}

export default function EventPage({ eventId = 1 }: { eventId?: number }) {
    const [event, setEvent] = useState<Event | null>(null);

    useEffect(() => {
        const selectedEvent = eventsData.events.find((e) => e.id === eventId);
        setEvent(selectedEvent || null);
    }, [eventId]);

    if (!event) return <p className="text-center mt-10">Event not found</p>;


    return (
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#DAE9DC] to-white h-[220px]"></div>
  
        {/* Mountain background */}
        <Image
          src="/mountain.svg"
          alt="mountain"
          width={920}
          height={410}
          className="w-full h-[200px] absolute inset-0 top-0 object-cover"
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

        {/* -------------------------- */} 

        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 mt-20 lg:mt-32">
            <h1 className="text-3xl font-bold mb-4 text-center">{event.title}</h1>
            <Image
            src={event.image}
            alt={event.title}
            width={500}
            height={310}
            className="w-3/4 mx-auto object-cover"
            />

            <div className="max-w-4xl mx-auto p-6 space-y-6">

        {/* Top Info Card */}
            <div className="bg-green-50 rounded-lg p-6 shadow">
                <div className="mb-4">
                    <p><strong>Post at:</strong> {event.post}</p>
                </div>
                <div className="grid lg:grid-cols-2 md:grid-cols-2 gap-4">
                    <p><strong>Date:</strong> {event.datestart} - {event.dateend}</p>
                    <p><strong>Location:</strong> {event.location}</p>
                    <p><strong>Type:</strong> {event.category.join(", ")}</p>
                    <p><strong>Capacity:</strong> {event.capacity} คน</p>
                    <p><strong>Organizer:</strong> {event.organizer}</p>
                </div>
            </div>

            {/* Image carousel / gallery */}
            <div className="relative w-full">
                <div className="overflow-x-auto scrollbar-hide">
                    <div className="flex space-x-4 p-2 min-w-full md:justify-center">
                    {event.additionalImages?.map((img, index) => (
                        <div key={index} className="flex-shrink-0">
                        <Image
                            src={img}
                            alt={`Event image ${index + 1}`}
                            width={180}
                            height={120}
                            className="rounded-lg object-cover shadow-md hover:scale-105 transition-transform cursor-pointer"
                        />
                        </div>
                    ))}
                    </div>
                </div>
            </div>

            {/* Event Details */}
            <h2 className="text-lg font-semibold mb-2">Event Description</h2>
            <div className="bg-white rounded-lg shadow p-4">                
                <p className="text-gray-700">{event.description}</p>
            </div>

            {/* Reason why this event is delete */}
            <h2 className="text-lg font-semibold mb-2">Reason for Deletion</h2>
            <div className="bg-red-50 rounded-lg shadow p-4 min-h-[200px]">
                <p className="text-gray-700">{event.reason}</p>
            </div>

            {/* Add Confirmation Checkbox */}
            <div className="flex gap-2">
                <input 
                    type="checkbox" 
                    id="confirmDelete"
                    className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <label htmlFor="confirmDelete" className="text-sm text-green-600">
                    Approve Deletion
                </label>
            </div>

            <div className="mt-4 flex gap-2">
                <input 
                    type="checkbox" 
                    id="confirmDelete"
                    className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                />
                <label htmlFor="rejectDelete" className="text-sm text-red-600">
                    Reject Deletion
                </label>
            </div>
            <textarea 
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-200"
                placeholder="Add reason for rejection..."
                rows={3}
            />
        </div>
        {/* Footer buttons */}
          <div className="flex justify-between pt-4 border-t mt-6">
            <button className="text-gray-600 hover:text-gray-900 cursor-pointer">
              Cancel
            </button>

            <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 cursor-pointer">
              Submit
            </button>
        </div>

        </div>

        </div>
    </div>
);
}