import Image from "next/image";
import Link from "next/link";
import { EventCardProps } from "./EventCard";
import { CalendarIcon, MapPinIcon, UserGroupIcon, ClockIcon } from "@heroicons/react/24/outline";

const EventCardHorizontal: React.FC<EventCardProps> = ({
  id,
  title,
  post,
  dateStart,
  dateEnd,
  location,
  imgSrc,
  capacity,
}) => {
  return (
    <Link href={`/event-detail/${id}`}>
    <div className="flex items-center rounded-lg gap-4 min-w-[400px]">
      <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200"> {/* 32 * 4 = 128px */}
        <Image
          src={imgSrc || "/default-event.jpg"}
          alt={title}
          width={128}
          height={128}
          className="w-full h-full object-cover"
          unoptimized={imgSrc?.startsWith('http')}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/default-event.jpg";
          }}
        />
    </div>

      {/* Content */}
      <div className="flex flex-col flex-1 gap-2 w-[1000px]">
        {/* Title */}
        <div className="flex justify-between items-center h-8">
          <h3 className="font-semibold text-base">{title}</h3>
        </div>

        {/* Info row: Date, Location, Capacity */}
        <div className="flex items-center text-sm text-gray-600 mt-1 gap-10">
          {/* Post Date */}
          <div className="flex items-center gap-1 md:">
            <ClockIcon className="w-4 h-4" />
            <span>Post at {post}</span>
          </div>
          {/* Date */}
          <div className="flex items-center gap-1">
            <CalendarIcon className="w-4 h-4" />
            <span>{dateStart} - {dateEnd}</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1">
            <MapPinIcon className="w-4 h-4" />
            <span>{location}</span>
          </div>

          {/* Capacity (optional) */}
          {capacity && (
            <div className="flex items-center gap-1">
              <UserGroupIcon className="w-4 h-4" />
              <span>Accept {capacity} students</span>
            </div>
          )}
        </div>
      </div>
    </div>
    </Link>
  );
};

export default EventCardHorizontal;
