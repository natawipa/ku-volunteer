"use client";
import Link from "next/link";
import Image from "next/image";
import EventCardHorizontal from "./EventCard/EventCardHorizontal";

import type { EventCardData } from "./EventCard/utils";
import type { EventCardHorizontalProps } from "./EventCard/EventCardHorizontal";

interface EventTypeSectionProps {
  title: string;
  color: string;
  backgroundBrain: string;
  events: EventCardData[];
}

// Map event type titles to their respective routes
const getEventTypeRoute = (title: string): string => {
  const routeMap: { [key: string]: string } = {
    "University Activities": "/event-type/university",
    "Enhance Competencies": "/event-type/enhance", 
    "Social Engagement Activities": "/event-type/social"
  };
  return routeMap[title] || "/";
};

export default function EventTypeSection({ title, color, backgroundBrain, events }: EventTypeSectionProps) {
  // Get gradient and background image from category backgrounds
  const categoryBackgrounds: Record<string, { color: string; backgroundBrain: string }> = {
    "University Activities": {
      color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#5992FF]/26",
      backgroundBrain: "/brainread.svg",
    },
    "Enhance Competencies": {
      color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#FFEA47]/26",
      backgroundBrain: "/brainthink.svg",
    },
    "Social Engagement Activities": {
      color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#FF999B]/26",
      backgroundBrain: "/brainlove.svg",
    },
  };
  const bgConfig = categoryBackgrounds[title] || { color: "bg-gray-100", backgroundBrain: "" };
  const route = getEventTypeRoute(title);
  
  // Get only the most recent event (first one in the array)
  const mostRecentEvent = events.length > 0 ? events[0] : null;

  return (
    <div className="mb-8">
      <Link href={route} className="block">
        {/* Event preview - Show only the most recent event */}
        <div className="mt-4">
          <div className={`relative rounded-lg p-8 flex items-center overflow-hidden min-h-[260px] ${bgConfig.color}`}> 
            {/* Large background image accent */}
            {bgConfig.backgroundBrain && (
              <img
                src={bgConfig.backgroundBrain}
                alt="background accent"
                className="absolute right-6 bottom-4 h-32 w-32 sm:h-40 sm:w-40 object-contain opacity-80 pointer-events-none"
                style={{ zIndex: 1 }}
              />
            )}
            <div className="relative z-10 w-full">
              <h3 className="text-2xl font-bold text-black mb-2">{title}</h3>
              {/* Transparent card, no image or empty state */}
              {mostRecentEvent ? (
                <div className="bg-transparent shadow-none">
                  <EventCardHorizontal event={{ ...mostRecentEvent, imgSrc: mostRecentEvent.imgSrc }} gradientBgClass="bg-transparent" showShadow={false} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-gray-700 font-semibold text-lg">No {title.toLowerCase()} available</p>
                  <p className="text-sm text-gray-500 mt-2">Click to view all activities</p>
                  <span className="inline-block text-white font-medium text-lg bg-black/20 px-4 py-2 rounded-lg hover:bg-black/30 transition-colors mt-6">
                    View All {events.length} {title} →
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* View All button for when events exist */}
        {mostRecentEvent && (
          <div className="text-center mt-4">
            <span className="inline-block text-white font-medium text-lg bg-black/20 px-4 py-2 rounded-lg hover:bg-black/30 transition-colors">
              View All {events.length} {title} →
            </span>
          </div>
        )}
      </Link>
    </div>
  );
}