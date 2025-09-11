import Image from "next/image";
import { CalendarIcon } from "@heroicons/react/24/outline";

interface EventCardProps {
  title: string;
  dateStart: string;
  dateEnd: string;
  location: string;
  catagory?: string[];
  imgSrc: string;
  status?: string;
}

const statusColors: Record<string, string> = {
  upcoming: "bg-red-700",
  during: "bg-indigo-600",
  complete: "bg-green-600",
};

const catagoryColors: Record<string, string> = {
  "กิจกรรมมหาลัย": "bg-[#B3E6FF]",
  "เพื่อสังคม": "bg-[#FFBDBE]",
  "เสริมสร้างสมรรถนะ": "bg-[#FFEA47]",
};

const EventCard: React.FC<EventCardProps> = ({ title, dateStart, dateEnd, location, catagory, imgSrc, status }) => {
  return (
    <div className="bg-transparent rounded-lg p-4 w-60 relative flex-shrink-0">
      <Image 
        src={imgSrc} 
        alt={title} 
        width={240} 
        height={140} 
        className="rounded-lg object-cover" 
        />

        {/* Status Badge */}
      {status && (
        <span
          className={`absolute font-bold top-2 right-2 text-white text-xs px-2 py-1 rounded-tl-[5px] rounded-tr-[5px] rounded-bl-[20px] rounded-br-[5px] ${statusColors[status]}`}
        >
          {status}
        </span>
      )}

      {/* Title */}
      <h3 className="font-semibold text-lg mt-2">{title}</h3>

      {/* Date */}
      <section className="flex items-center  bg-[#BBF0D0] rounded-full px-2 py-1 w-full mt-1">
        <CalendarIcon className="w-4 h-4" />
        <p className="text-sm ml-2">{dateStart} - {dateEnd}</p>
      </section>

      {/* Category */}
      {catagory && catagory.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1 text-xs">
          {(Array.isArray(catagory) ? catagory : [catagory]).map((c, idx) => (
            <span
              key={idx}
              className={`text-black px-2 py-1 rounded-full ${catagoryColors[c]}`}
            >
              #{c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default EventCard;
