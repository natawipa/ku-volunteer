"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { auth } from "../../../lib/utils";
import { USER_ROLES } from "../../../lib/constants";
import { getPendingApplicationsForActivity } from "../../../lib/notifications";
import { EventCardData, formatDate, statusColors, categoryColors } from "./utils";

export interface EventCardSquareProps {
  event: EventCardData;
  gradientBgClass?: string;
  showShadow?: boolean;
  imageWidth?: string;
  imageHeight?: string;

  showStatus?: boolean;
  showDate?: boolean;
  showCategory?: boolean;
  showBadge?: boolean;
  cardPadding?: string;
  titleClassName?: string;
  infoTextClassName?: string;
  hoverScale?: boolean;
  hoverBgClass?: string;

  onClick?: (event: EventCardData) => void;
  requireAuth?: boolean;
}

export default function EventCardSquare({
  event,
  gradientBgClass = "bg-transparent",
  showShadow = false,
  hoverBgClass = "hover:bg-gray-100",
  hoverScale = true,
  showBadge = true,
}: EventCardSquareProps) {
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const userRole = auth.getUserRole();
  const isOrganizer = userRole === USER_ROLES.ORGANIZER;

  useEffect(() => {
    if (isOrganizer && showBadge && event.id) {
      const fetchPending = async () => {
        try {
          const activityId = typeof event.id === 'string' ? parseInt(event.id, 10) : event.id;
          const count = await getPendingApplicationsForActivity(activityId);
          setPendingCount(count);
        } catch (error) {
          console.error('Error fetching pending count:', error);
        }
      };
      fetchPending();
    }
  }, [event.id, isOrganizer, showBadge]);

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
      className={`${gradientBgClass} rounded-lg p-4 w-60 relative flex-shrink-0 ${
        hoverScale ? "hover:scale-105" : ""
      } ${showShadow ? "shadow-md" : ""} ${hoverBgClass} transition-transform duration-200`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
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

      {event.status && (
        <span
          className={`absolute font-bold top-4 right-4 text-white text-sm px-2 py-1 rounded-tl-[5px] rounded-tr-[5px] rounded-bl-[20px] rounded-br-[5px] ${
            statusColors[event.status] || "bg-gray-400"
          }`}
        >
          {event.status}
        </span>
      )}

      {isOrganizer && showBadge && pendingCount > 0 && (
        <span className="absolute top-2 left-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-[#DC143C] rounded-full shadow-md">
          {pendingCount}
        </span>
      )}

      <h3 className="font-semibold text-lg mt-2 line-clamp-2 min-h-[4.5rem]" title={event.title}>
        {event.title}
      </h3>

      <section className="flex items-center bg-[#BBF0D0] rounded-full px-2 py-1 w-full mt-1">
        <Calendar className="w-4 h-4" />
        <p className="text-sm ml-2">
          {formatDate(event.dateStart)} - {formatDate(event.dateEnd)}
        </p>
      </section>

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
