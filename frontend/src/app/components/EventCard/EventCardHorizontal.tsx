"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Calendar, Users, MapPin, Clock } from "lucide-react";
import { auth } from "../../../lib/utils";
import { EventCardData, formatDate, formatPostedTime, getCategoryBackground, categoryColors } from "./utils";

export default function EventCardHorizontal({ event }: { event: EventCardData }) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!auth.isAuthenticated()) {
      router.push("/login");
      return;
    }
    router.push(`/event-detail/${event.id}`);
  };

  // Get category color and background image
  const mainCategory = Array.isArray(event.category) ? event.category[0] : event.category;
  const { color, backgroundBrain } = getCategoryBackground(mainCategory);

  return (
    <div
      className={`relative flex flex-col sm:flex-row gap-4 items-start sm:items-stretch overflow-hidden rounded-lg shadow-md p-4 ${color} transition group hover:shadow-lg w-full cursor-pointer`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      {/* Image */}
      <div className="flex-shrink-0 w-full sm:w-40 h-28 rounded-lg overflow-hidden bg-gray-100">
        <Image
          src={event.imgSrc || "/default-event.jpg"}
          alt={event.title}
          width={400}
          height={120}
          className="object-cover w-full h-full"
          unoptimized
        />
      </div>

      {/* Dynamic Background Accent */}
      {backgroundBrain && (
        <img
          src={backgroundBrain}
          alt="background accent"
          className="absolute -right-6 -bottom-6 w-40 h-40 pointer-events-none transition-transform duration-200 group-hover:scale-105 opacity-30"
        />
      )}

      {/* Info */}
      <div className="relative z-10 flex-1 flex flex-col gap-2">
        <h3 className="font-semibold text-lg leading-snug line-clamp-2" title={event.title}>
          {event.title}
        </h3>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-700 mt-1">
          {/* Category */}
          {event.category && (
            Array.isArray(event.category)
              ? event.category.map((cat, idx) => (
                  <span
                    key={idx}
                    className={`text-black px-2 py-0.5 rounded-full ${categoryColors[cat] || 'bg-green-100'}`}
                  >
                    #{cat}
                  </span>
                ))
              : (
                  <span className={`text-black px-2 py-0.5 rounded-full ${categoryColors[event.category] || 'bg-green-100'}`}>
                    #{event.category}
                  </span>
                )
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-700 mt-1">
          <span className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {formatDate(event.dateStart)} – {formatDate(event.dateEnd)}
          </span>

          <span className="flex items-center text-gray-600 truncate max-w-[120px]" title={event.organizer}>
            <Users className="w-3 h-3 mr-1" />
            {event.participants_count}/{event.max_participants}
          </span>

          <span className="flex items-center">
            <MapPin className="w-3 h-3 mr-1" />
            <span className="truncate max-w-[120px]" title={event.location}>
              {event.location}
            </span>
          </span>

          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            <span>{formatPostedTime(event.posted_at)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
