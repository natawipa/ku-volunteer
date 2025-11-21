"use client";
import Link from "next/link";
import Image from "next/image";
import EventCardHorizontal from "./EventCard/EventCardHorizontal";
import type { EventCardData } from "./EventCard/utils";
import { CircleChevronRight } from "lucide-react";

interface EventTypeSectionProps {
  title: string;
  events: EventCardData[];
}

const getEventTypeRoute = (title: string): string => {
  const routeMap: { [key: string]: string } = {
    "University Activities": "/event-type/university-activities",
    "Enhance Competencies": "/event-type/enhance-competencies",
    "Social Engagement Activities": "/event-type/social-engagement-activities"
  };
  return routeMap[title] || "/";
};

export default function EventTypeSection({ title, events }: EventTypeSectionProps) {
  const categoryBackgrounds: Record<string, { color: string; backgroundBrain: string }> = {
    "University Activities": {
      color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#5992FF]/26",
      backgroundBrain: "/brain-read.svg",
    },
    "Enhance Competencies": {
      color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#FFEA47]/26",
      backgroundBrain: "/brain-think.svg",
    },
    "Social Engagement Activities": {
      color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#FF999B]/26",
      backgroundBrain: "/brain-smart.svg",
    },
  };
  const bgConfig = categoryBackgrounds[title] || { color: "bg-gray-100", backgroundBrain: "" };
  const route = getEventTypeRoute(title);
  
  const mostRecentEvent = events.length > 0 ? events[0] : null;

  return (
    <div className="mb-8">
      <Link href={route} className="block">
        <div className="mt-8">
          <div className={`relative rounded-lg pt-2 pb-8 px-8 flex items-center overflow-hidden min-h-[260px] ${bgConfig.color}`}> 
              {bgConfig.backgroundBrain && (
                      <Image
                        src={bgConfig.backgroundBrain}
                        alt="background accent"
                        width={256}
                        height={256}
                        className="absolute right-6 bottom-0 h-52 w-52 sm:h-64 sm:w-64 object-contain opacity-80 pointer-events-none"
                        style={{ zIndex: 1 }}
                        priority
                      />
            )}
            <div className="relative z-10 w-full">
              <div className="flex items-center justify-between pt-2 mb-2">
                <h3 className="text-2xl font-bold text-black">{title}</h3>
                {mostRecentEvent && (
                  <span className="flex items-center gap-2 text-black font-medium text-base transition-colors cursor-pointer hover:text-gray-500">
                    View All ({events.length}) <CircleChevronRight size={20} />
                  </span>
                )}
              </div>
              {mostRecentEvent ? (
                <div className="bg-transparent shadow-none">
                  <EventCardHorizontal event={{ ...mostRecentEvent, imgSrc: mostRecentEvent.imgSrc }} gradientBgClass="bg-transparent" showShadow={false} showGradientBorder={false} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[120px] w-full bg-transparent rounded-lg">
                  <p className="text-gray-700 font-semibold text-lg">No {title.toLowerCase()} available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}