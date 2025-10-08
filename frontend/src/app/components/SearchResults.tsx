"use client";
import Image from "next/image";
import Link from "next/link";

import { MapPinIcon } from "@heroicons/react/20/solid";
import { Calendar } from "lucide-react";

interface Event {
  id: number;
  title: string;
  dateStart: string;
  dateEnd: string;
  location: string;
  category: string[];
  imgSrc: string;
  status: string;
}

interface SearchResultsProps {
  events: Event[];
  onBack?: () => void;
}

export default function SearchResults({ events, onBack }: SearchResultsProps) {
  // Use event.status and style like EventCard
  const renderEventStatus = (event: Event) => {
    let colorClass = '';
    switch (event.status) {
      case 'upcoming':
        colorClass = 'bg-red-100 text-red-800';
        break;
      case 'ongoing':
        colorClass = 'bg-green-100 text-green-800';
        break;
      case 'past':
        colorClass = 'bg-gray-100 text-gray-800';
        break;
      default:
        colorClass = 'bg-gray-100 text-gray-800';
    }
    // Capitalize first letter
    const label = event.status ? event.status.charAt(0).toUpperCase() + event.status.slice(1) : '';
    return (
      <span className={`${colorClass} text-xs px-2 py-1 rounded-full font-semibold`}>
        {label}
      </span>
    );
  };

  if (!events || events.length === 0) {
    return (
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <button
            className="text-green-600 border-b border-green-600 hover:border-green-700 hover:text-green-700 cursor-pointer"
            onClick={onBack}
          >
            ← Back
          </button>
          <span />
        </div>
        <p className="text-center text-gray-600">No events found matching your search.</p>
      </div>
    );
  }

  return (
    
    <div className="mt-6 mb-10">
      <button
        className="mb-4 text-green-600 border-b border-green-600 hover:border-green-700 hover:text-green-700 cursor-pointer"
        onClick={onBack}> ← Back
      </button>

      <h2 className="font-semibold text-xl mb-4">Search Results ({events.length} events)</h2>
      <div className="space-y-4">
        {events.map((event, idx) => (
          <Link href={`/event-detail/${event.id}`} key={idx}>
            <div className="bg-white rounded-lg shadow-md p-4 mt-4 flex gap-4 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="w-48 h-32 relative flex-shrink-0">
                <Image
                  src={event.imgSrc}
                  alt={event.title}
                  fill
                  className="rounded-md object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">{event.title}</h3>
                  {renderEventStatus(event)}
                </div>
                <div className="text-sm text-gray-600 mt-2 space-y-1">
                  <p><MapPinIcon className="inline-block text-red-500 w-4 h-4 mr-1" /> {event.location}</p>
                  <p><Calendar className="inline-block w-4 h-4 mr-1" /> {event.dateStart} - {event.dateEnd}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {event.category.map((cat, i) => (
                      <span key={i} className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}