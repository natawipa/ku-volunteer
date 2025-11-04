"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

import { activitiesApi } from "../../../lib/activities";
import type { Activity } from "../../../lib/types";
import { EventCardData, transformActivityToEvent } from "../../components/EventCard/utils";
import EventCardHorizontal from "../../components/EventCard/EventCardHorizontal";
import Header from "../../components/Header";
import Navbar from "../../components/Navbar";
import HeroImage from "../../components/HeroImage";

// Map of event type params to their display titles, gradient colors, and brain images
const EVENT_TYPE_MAP: Record<
  string,
  { title: string; color: string; brain: string }
> = {
  "university-activities": {
    title: "University Activities",
    color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#5992FF]/26",
    brain: "/brain-read.svg",
  },
  "enhance-competencies": {
    title: "Enhance Competencies",
    color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#FFEA47]/26",
    brain: "/brain-think.svg",
  },
  "social-engagement-activities": {
    title: "Social Engagement Activities",
    color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#FF999B]/26",
    brain: "/brain-smart.svg",
  },
};

// Matches event type with backend categories
const EVENT_TYPE_MATCHERS: Record<string, (cat: string) => boolean> = {
  "University Activities": (cat) => cat.includes("University Activities"),
  "Enhance Competencies": (cat) =>
    [
      "Development of Morality",
      "Development of Thinking",
      "Development of Interpersonal",
      "Development of Health",
    ].some((keyword) => cat.includes(keyword)),
  "Social Engagement Activities": (cat) =>
    cat.includes("Social Engagement Activities"),
};

// Main Component
export default function EventTypePage() {
  const params = useParams();
  const eventTypeParam =
    typeof params["type"] === "string"
      ? params["type"]
      : Array.isArray(params["type"])
      ? params["type"][0]
      : "";

  const getBorderEventCardColors = () => {
  if (eventTypeParam === "university-activities") {
    return {
    middleColorBorder: "#D7E4FF",
    endColorBorder: "#C5D8FF",
    };
  }
  if (eventTypeParam === "enhance-competencies") {
    return {
      middleColorBorder: "#FFF9CF",
      endColorBorder: "#FFF7BC",
    };
  }
  if (eventTypeParam === "social-engagement-activities") {
    return {
    middleColorBorder: "#FFDEE0",
    endColorBorder: "#FFCCCF",
    };
  }
  return {
      middleColorBorder: "#DAE9DC",
      endColorBorder: "#CEF7CE",
    };
  };

  const borderColors = getBorderEventCardColors();
  const eventTypeConfig = EVENT_TYPE_MAP[eventTypeParam];
  const eventTypeTitle = eventTypeConfig?.title || "Unknown";

  const [events, setEvents] = useState<EventCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Activities
  useEffect(() => {
    if (eventTypeTitle === "Unknown") return;

    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await activitiesApi.getActivities();

        if (response.success && Array.isArray(response.data)) {
          const matcher = EVENT_TYPE_MATCHERS[eventTypeTitle];
          const filtered = response.data.filter(
            (a: Activity) =>
              Array.isArray(a.categories) && a.categories.some(matcher)
          );
          setEvents(filtered.map(transformActivityToEvent));
        } else {
          throw new Error(response.error || "Failed to fetch activities");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Network error");
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [eventTypeTitle]);

  // Render
  if (eventTypeTitle === "Unknown") {
    return (
      <div className="p-8 text-center text-xl text-gray-600">
        Event type not found.
      </div>
    );
  }

  return (
    <div className="relative pt-6 px-4">
      {/* Header */}
      <HeroImage />
      <Navbar />
      <Header showBigLogo={true} />
      
    <div className="w-full max-w-3xl mx-auto py-8 px-2 sm:px-0">
      {/* Gradient Header */}
      <div className="relative mt-10">
      <div
        className={`relative rounded-lg shadow mb-8 flex items-center min-h-[110px] px-4 sm:px-8 py-4 w-full ${eventTypeConfig.color}`}
      >
        {eventTypeConfig.brain && (
          <Image
            src={eventTypeConfig.brain}
            alt="brain accent"
            width={120}
            height={120}
            className="absolute right-2 sm:right-6 bottom-0 h-24 w-24 sm:h-32 sm:w-32 object-contain opacity-90 pointer-events-none"
            priority
          />
        )}
        <div className="relative z-10 w-full flex items-center">
          <h1 className="text-xl sm:text-3xl font-bold text-black">
            {eventTypeTitle}
          </h1>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
          <span className="ml-3 text-gray-600">Loading events...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center mx-auto">
          <h3 className="text-red-800 font-semibold mb-2">
            Error Loading Events
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && events.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[120px] w-full">
          <p className="text-gray-700 font-semibold text-lg">
            No {eventTypeTitle.toLowerCase()} available
          </p>
        </div>
      )}

      {/* Events List */}
      <div className="flex flex-col gap-6">
        {events.map((event) => (
          <EventCardHorizontal
            key={event.id}
            event={event}
            gradientBgClass="bg-white"
            middleColorBorder={borderColors.middleColorBorder}
            endColorBorder={borderColors.endColorBorder}
            showShadow
            hoverScale={false}
          />
        ))}
      </div>

      {/* More Button */}
      {events.length > 0 && (
        <div className="flex justify-center mt-8">
          <button className="text-green-700 font-semibold flex items-center gap-2 hover:underline">
            More
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
    </div>
    </div>
  );
}
