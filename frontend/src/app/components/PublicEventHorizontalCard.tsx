"use client";
import Link from 'next/link';
import Image from 'next/image';
import { MapPinIcon } from '@heroicons/react/20/solid'
import { Calendar } from 'lucide-react';

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

const formatDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('en-GB'); } catch { return iso; }
};

export default function PublicEventHorizontalCard({ event, onJoin }: Props) {
  return (
    <div className="relative flex flex-col sm:flex-row gap-4 items-start sm:items-stretch overflow-hidden rounded-lg shadow-md p-4 bg-gradient-to-r from-green-200/25 to-gray-200/25 transition group hover:shadow-lg">
      <Link
        href={`/event-detail/${event.id}`}
        className="flex flex-col sm:flex-row flex-1 gap-4 items-start sm:items-stretch no-underline"
        style={{ textDecoration: 'none' }}
      >
        {/* Event image */}
        <div className="flex-shrink-0 w-full sm:w-28 h-40 sm:h-28 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          <Image
            src={event.imgSrc || "/titleExample.jpg"}
            alt={event.title}
            width={112}
            height={112}
            className="object-cover w-full h-full"
          />
        </div>

        {/* Decorative background accent */}
        <div className="absolute -right-6 -bottom-6 w-40 h-40 rounded-full bg-green-900/5 pointer-events-none transition-transform duration-200 group-hover:scale-105" />

        {/* Event info */}
        <div className="relative z-10 flex-1 flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
            <h3 className="font-semibold text-lg leading-snug line-clamp-2" title={event.title}>
              {event.title}
            </h3>

            {/* On small screens, category appears under title; on larger, moves right */}
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap sm:hidden">
              {event.category}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-700 mt-1">
            <span className="bg-white/60 border border-green-600/10 rounded px-2 py-0.5">
              <Calendar className="inline-block w-3 h-3 mr-1 -mt-1" /> 
              {formatDate(event.dateStart)} - {formatDate(event.dateEnd)}
            </span>
            <span className="text-gray-600 truncate max-w-[240px]" title={event.location}>
              <MapPinIcon className="inline-block text-red-500 w-3 h-3 mr-1 -mt-1" />
              {event.location && event.location.trim() ? event.location : "Unknown location"}
            </span>
            <span className="text-gray-500">{event.organizer}</span>
            <span className="font-medium">{event.participants_count}/{event.max_participants} participants</span>
          </div>

          <p className="text-sm text-gray-600 line-clamp-3">{event.description}</p>
        </div>
      </Link>

      {/* Right side: category + join button (side-by-side on desktop, stacked on mobile) */}
      <div className="relative z-10 flex sm:flex-col items-center sm:items-end justify-between gap-2 w-full sm:w-auto mt-2 sm:mt-0">
        <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
          {event.category}
        </span>
        <button
          onClick={() => onJoin?.(event.id)}
          className="w-full sm:w-auto bg-white/60 text-green-700 border border-green-600/20 px-4 py-1.5 rounded-md text-xs font-medium hover:bg-green-50 transition-colors shadow-sm whitespace-nowrap"
        >
          Join
        </button>
      </div>
    </div>
  );
}