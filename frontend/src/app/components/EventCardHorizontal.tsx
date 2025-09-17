import Image from "next/image";
import { EventCardProps } from "./EventCard";
import { CalendarIcon, MapPinIcon, UserGroupIcon, ClockIcon } from "@heroicons/react/24/outline";

// const statusColors: Record<string, string> = {
//   upcoming: "bg-red-700",
//   during: "bg-indigo-600",
//   complete: "bg-green-600",
// };

const EventCardHorizontal: React.FC<EventCardProps> = ({
  title,
  post,
  dateStart,
  dateEnd,
  location,
  imgSrc,
  capacity,
}) => {
  return (
    <div className="flex items-center rounded-lg gap-4 min-w-[400px]">
      {/* Thumbnail */}
      <Image
        src={imgSrc}
        alt={title}
        width={150} 
        height={120} 
        className="rounded-lg object-cover"
      />

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
  );
};

export default EventCardHorizontal;
