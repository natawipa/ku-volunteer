"use client";
import Image from "next/image";
import { useMemo } from "react";
import Link from "next/link";

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
}

export default function SearchResults({ events }: SearchResultsProps) {
  const renderEventStatus = (event: Event) => {
    const startDate = new Date(event.dateStart.split('/').reverse().join('-'));
    const endDate = new Date(event.dateEnd.split('/').reverse().join('-'));
    const now = new Date();
    
    let status: 'Upcoming' | 'Past' | 'Ongoing';
    if (startDate > now) {
      status = 'Upcoming';
    } else if (endDate < now) {
      status = 'Past';
    } else {
      status = 'Ongoing';
    }

    const statusColors: Record<'Upcoming' | 'Past' | 'Ongoing', string> = {
      Upcoming: 'bg-blue-100 text-blue-800',
      Past: 'bg-gray-100 text-gray-800',
      Ongoing: 'bg-green-100 text-green-800'
    };

    return (
      <span className={`${statusColors[status]} text-xs px-2 py-1 rounded-full`}>
        {status}
      </span>
    );
  };

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No events found matching your search.</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="font-semibold text-xl mb-4">Search Results ({events.length} events)</h2>
      <div className="space-y-4">
        {events.map((event, idx) => (
          <Link href={`/event-detail/${event.id}`} key={idx}>
            <div className="bg-white rounded-lg shadow-md p-4 flex gap-4 hover:shadow-lg transition-shadow cursor-pointer">
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
                  <p>📍 {event.location}</p>
                  <p>📅 {event.dateStart} - {event.dateEnd}</p>
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