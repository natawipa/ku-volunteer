import Image from "next/image";
import { CalendarIcon, MapPinIcon, UserGroupIcon } from "@heroicons/react/24/outline";

interface EventCardProps {
  title: string;
  dateStart: string;
  dateEnd: string;
  location: string;
  catagory?: string[];
  imgSrc: string;
  status?: string;
  capacity?: number; // optional field if you want "accept 30 students"
}

const statusColors: Record<string, string> = {
  upcoming: "bg-red-700",
  during: "bg-indigo-600",
  complete: "bg-green-600",
};

const EventCardHorizontal: React.FC<EventCardProps> = ({
  title,
  dateStart,
  dateEnd,
  location,
  imgSrc,
  status,
  capacity,
}) => {
  return (
    <div className="flex items-center rounded-lg gap-4 min-w-[400px]">
      {/* Thumbnail */}
      <Image
        src={imgSrc}
        alt={title}
        width={150}
        height={200}
        className="rounded-md object-cover flex-shrink-100"
      />

      {/* Content */}
      <div className="flex flex-col flex-1 gap-2 w-[1000px]">
        {/* Title + status */}
        <div className="flex justify-between items-center h-8">
          <h3 className="font-semibold text-base">{title}</h3>
        </div>

        {/* Info row: Date, Location, Capacity */}
        <div className="flex items-center text-sm text-gray-600 mt-1 gap-10">
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
