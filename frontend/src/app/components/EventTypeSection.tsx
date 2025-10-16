"use client";
import Link from "next/link";
import Image from "next/image";
import EventCardHorizontal from "./EventCardHorizontal";

interface EventTypeSectionProps {
  title: string;
  color: string;
  backgroundBrain: string;
  events: Array<{
    id: number;
    title: string;
    post: string;
    dateStart: string;
    dateEnd: string;
    location: string;
    category: string[];
    imgSrc: string;
    capacity: number;
    status: string;
  }>;
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
  const route = getEventTypeRoute(title);
  
  // Get only the most recent event (first one in the array)
  const mostRecentEvent = events.length > 0 ? events[0] : null;

  return (
    <div className="mb-8">
      {/* Entire section wrapped in Link with gradient background */}
      <Link href={route} className="block">
        <div className={`${color} rounded-lg p-6 cursor-pointer hover:opacity-90 transition-opacity`}>
          
          {/* Header section */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold">{title}</h3>
            <Image
              src={backgroundBrain}
              alt="brain icon"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>

          {/* Event preview - Show only the most recent event */}
          <div className="mt-4">
            {mostRecentEvent ? (
              <div className="bg-white/80 rounded-lg p-4 backdrop-blur-sm">
                <EventCardHorizontal {...mostRecentEvent} />
              </div>
            ) : (
              <div className="bg-white/80 rounded-lg p-8 text-center backdrop-blur-sm">
                <p className="text-gray-500">No {title.toLowerCase()} available</p>
                <p className="text-sm text-gray-400 mt-2">Click to view all activities</p>
              </div>
            )}
          </div>

          {/* View all link */}
          <div className="text-center mt-4 pt-4 border-t border-white/30">
            <span className="text-white font-medium text-lg bg-black/20 px-4 py-2 rounded-lg hover:bg-black/30 transition-colors">
              View All {events.length} {title} →
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}