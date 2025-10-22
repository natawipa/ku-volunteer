"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Calendar } from "lucide-react";
import { auth } from "../../../lib/utils";
import { EventCardData, formatDate, statusColors, categoryColors } from "./utils";

export default function EventCardSquare({ event }: { event: EventCardData }) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!auth.isAuthenticated()) {
      router.push("/login");
      return;
    }
    router.push(`/event-detail/${event.id}`);
  };

  return (
    <div
      className="bg-transparent rounded-lg p-4 w-60 relative flex-shrink-0 hover:scale-105 hover:bg-gray-100 transition-transform duration-200"
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      {/* Event Image */}
      <div className="rounded-lg overflow-hidden w-full h-[120px]">
        <Image
          src={event.imgSrc || "/default-event.jpg"}
          alt={event.title}
          width={400}
          height={120}
          className="object-cover w-full h-full"
          unoptimized
        />
      </div>

      {/* Status */}
      {event.status && (
        <span
          className={`absolute font-bold top-4 right-4 text-white text-sm px-2 py-1 rounded-tl-[5px] rounded-tr-[5px] rounded-bl-[20px] rounded-br-[5px] ${
            statusColors[event.status] || "bg-gray-400"
          }`}
        >
          {event.status}
        </span>
      )}

      {/* Title */}
      <h3 className="font-semibold text-lg mt-2">{event.title}</h3>

      {/* Date */}
      <section className="flex items-center bg-[#BBF0D0] rounded-full px-2 py-1 w-full mt-1">
        <Calendar className="w-4 h-4" />
        <p className="text-sm ml-2">
          {formatDate(event.dateStart)} - {formatDate(event.dateEnd)}
        </p>
      </section>

      {/* Category */}
      {event.category && (
        <div className="mt-2 flex flex-wrap gap-1 text-xs">
          {(Array.isArray(event.category) ? event.category : [event.category]).map((c, idx) => (
            <span
              key={idx}
              className={`text-black px-2 py-1 rounded-full ${categoryColors[c] || "bg-gray-200"}`}
            >
              #{c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
