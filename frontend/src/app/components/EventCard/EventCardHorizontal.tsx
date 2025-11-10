"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Calendar, Users, MapPin, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { auth } from "../../../lib/utils";
import { USER_ROLES } from "../../../lib/constants";
import { getPendingApplicationsForActivity } from "../../../lib/notifications";
import { EventCardData, formatDate, formatPostedTime, getCategoryBackground, categoryColors } from "./utils";

export interface EventCardHorizontalProps {
  event: EventCardData;
  // Layout customization
  gradientBgClass?: string; // e.g., "bg-gradient-to-r from-green-400 to-blue-500"
  showShadow?: boolean;
  imageWidth?: string; // e.g., "w-40", "w-32"
  imageHeight?: string; // e.g., "h-28", "h-32"
  middleColorBorder?: string;
  endColorBorder?: string;
  
  // Visibility toggles
  showCategory?: boolean;
  showDate?: boolean;
  showParticipants?: boolean;
  showLocation?: boolean;
  showPostedTime?: boolean;
  showBadge?: boolean;
  showGradientBorder?: boolean;
  
  // Style customization
  cardPadding?: string;
  titleClassName?: string;
  infoTextClassName?: string;
  hoverScale?: boolean;
  hoverBgClass?: string;
  
  // Behavior customization
  onClick?: (event: EventCardData) => void;
  requireAuth?: boolean;
}

export default function EventCardHorizontal({
  event,
  gradientBgClass,
  showShadow = true,
  imageWidth = "sm:w-40",
  imageHeight = "h-28",
  middleColorBorder = "#DAE9DC",
  endColorBorder = "#CEF7CE",
  showCategory = true,
  showDate = true,
  showParticipants = true,
  showLocation = true,
  showPostedTime = true,
  showBadge = false,
  showGradientBorder = true,
  cardPadding = "p-4",
  titleClassName = "font-semibold text-lg leading-snug line-clamp-2",
  infoTextClassName = "text-xs text-gray-700",
  hoverScale = true,
  hoverBgClass = "hover:bg-transparent",
  onClick,
  requireAuth = true,
}: EventCardHorizontalProps) {
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const userRole = auth.getUserRole();
  const isOrganizer = userRole === USER_ROLES.ORGANIZER;

  // Fetch pending applications count for organizers
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
    
    // Custom onClick handler
    if (onClick) {
      onClick(event);
      return;
    }

    // Default behavior
    if (requireAuth && !auth.isAuthenticated()) {
      router.push("/login");
      return;
    }
    router.push(`/event-detail/${event.id}`);
  };

  const mainCategory = Array.isArray(event.category) ? event.category[0] : event.category;
  const { color } = getCategoryBackground(mainCategory);

  const cardClasses = [
    "relative flex flex-col sm:flex-row gap-4 items-start sm:items-stretch overflow-hidden rounded-lg",
    cardPadding,
    gradientBgClass || color,
    "transition-transform duration-200 w-full cursor-pointer group",
    hoverBgClass,
    hoverScale ? "hover:scale-105" : "",
  ].filter(Boolean).join(" ");

  return (
    <div
      className="relative p-0.5 rounded-lg transition-transform duration-200 w-full cursor-pointer group"
      style={{
      ...(showGradientBorder !== false ? {
          background: `linear-gradient(to right, white, ${middleColorBorder} 50%, ${endColorBorder})`
        } : {}),     
      ...(hoverScale ? { transform: "scale(1.03)" } : {}),
        ...(showShadow ? { boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" } : {}),
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >

      <div className={cardClasses}>
      {/* Image */}
      <div className={`flex-shrink-0 w-full ${imageWidth} ${imageHeight} rounded-lg overflow-hidden bg-gray-100`}>
        <Image
          src={event.imgSrc || "/default-event.jpg"}
          alt={event.title}
          width={400}
          height={120}
          className="object-cover w-full h-full"
          unoptimized
        />
      </div>

      {/* Pending Applications Badge (for organizers) */}
      {isOrganizer && showBadge && pendingCount > 0 && (
        <span className="absolute top-2 left-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-[#DC143C] rounded-full shadow-md z-20">
          {pendingCount}
        </span>
      )}

      {/* Info */}
      <div className="relative z-10 flex-1 flex flex-col gap-2">
        <h3 className={titleClassName} title={event.title}>
          {event.title}
        </h3>

        {/* Category */}
        {showCategory && event.category && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-700 mt-1">
            {Array.isArray(event.category)
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
                )}
          </div>
        )}

        {/* Details */}
        <div className={`flex flex-wrap items-center gap-3 mt-1 ${infoTextClassName}`}>
          {showDate && (
            <span className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(event.dateStart)} – {formatDate(event.dateEnd)}
            </span>
          )}

          {showParticipants && (
            <span className="flex items-center text-gray-600 truncate max-w-[120px]" title={event.organizer}>
              <Users className="w-3 h-3 mr-1" />
              {event.participants_count}/{event.max_participants}
            </span>
          )}

          {showLocation && (
            <span className="flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              <span className="truncate max-w-[120px]" title={event.location}>
                {event.location}
              </span>
            </span>
          )}

          {showPostedTime && event.posted_at && (
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              <span>{formatPostedTime(event.posted_at)}</span>
            </span>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
