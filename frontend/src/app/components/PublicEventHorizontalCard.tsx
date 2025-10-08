"use client";
import Link from 'next/link';
import { MapPinIcon } from '@heroicons/react/20/solid'

export interface PublicEventCardData {
  id: string | number;
  title: string;
  description: string;
  category: string;
  dateStart: string;
  dateEnd: string; 
  location: string;
  organizer: string;
  participants_count: number;
  max_participants: number;
  imgSrc?: string;
}

interface Props {
  event: PublicEventCardData;
  onJoin?: (id: string | number) => void;
}

export default function PublicEventHorizontalCard({ event, onJoin }: Props) {
  return (
    <div className="relative flex gap-4 items-stretch overflow-hidden rounded-lg shadow-md p-4 bg-gradient-to-r from-green-200/25 to-gray-200/25 transition group hover:shadow-lg">
      <Link
        href={`/event-detail/${event.id}`}
        className="flex flex-1 gap-4 items-stretch no-underline"
        style={{ textDecoration: 'none' }}
      >
        {/* Event image on the left */}
        <div className="flex-shrink-0 w-28 h-28 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          {/* Replace with event.image if available, fallback to a default */}
          <img
            src={event.imgSrc || "/titleExample.jpg"}
            alt={event.title}
            className="object-cover w-full h-full"
          />
        </div>
        {/* Decorative background accent */}
        <div className="absolute -right-6 -bottom-6 w-40 h-40 rounded-full bg-green-900/5 pointer-events-none transition-transform duration-200 group-hover:scale-105" />
        <div className="relative z-10 flex-1 flex flex-col gap-2">
          <div className="flex items-start gap-4">
            <h3 className="font-semibold text-lg leading-snug line-clamp-2" title={event.title}>{event.title}</h3>
          </div>
          <span className="absolute top-0 right-0 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {event.category}
          </span>
          <div className="flex items-center gap-3 text-xs text-gray-700 mt-1">
            <span className="bg-white/60 border border-green-600/10 rounded px-2 py-0.5" title="Date">{event.dateStart} - {event.dateEnd}</span>
            <span className="text-gray-600 truncate max-w-[240px]" title={event.location}> <MapPinIcon className="inline-block text-red-500 w-4 h-4 mr-1 -mt-1.5" />{event.location}</span>
            <span className="text-gray-500" title="Organizer">{event.organizer}</span>
            <span className="font-medium" title="Participants">{event.participants_count}/{event.max_participants} participants</span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-3">{event.description}</p>
        </div>
      </Link>
      <div className="relative z-10 w-32 flex flex-col gap-2 items-stretch justify-end">
        <button
          onClick={() => onJoin?.(event.id)}
          className="bg-white/60 text-green-700 border border-green-600/20 py-2 rounded-md text-xs font-medium hover:bg-green-50 transition-colors shadow-sm"
        >
          Join
        </button>
      </div>
    </div>
  );
}
