import EventCardHorizontal from "./EventCardHorizontal";
import { EventCardProps } from "./EventCard";
import Link from "next/link";

interface EventTypeSectionProps {
  title: string;
  titleEng?: string;
  color: string;
  backgroundBrain?: string;
  events: EventCardProps[];
}

const EventTypeSection: React.FC<EventTypeSectionProps> = ({
  title,
  titleEng = title === "กิจกรรมมหาวิทยาลัย" ? "university" : title === "กิจกรรมเพื่อการเสริมสร้างสมรรถนะ" ? "skill-building" : "social",
  color,
  backgroundBrain,
  events,
}) => {
  return (
    <Link href={`/event-type/${titleEng}`}>
      <div className={`shadow-lg p-4 mb-10 rounded-lg relative ${color} overflow-hidden hover:scale-102 transition-transform duration-200`}>
        {/* Background brain image */}
        {backgroundBrain && (
          <div
            className="absolute right-0 bottom-0 bg-no-repeat bg-contain opacity-50 pointer-events-none"
          style={{
            backgroundImage: `url(${backgroundBrain})`,
            width: "200px",
            height: "200px",
            backgroundSize: "contain",
          }}
        />
      )}

        {/* Section title */}
        <h2 className="font-medium mb-2 relative z-10 text-xl">
          {title} <span className="text-gray-600">&gt;</span>
        </h2>

        {/* Events list */}
        <p className="font-regular mb-2 relative z-10 text-medium">Recent Event:</p>
        
        <div className="flex gap-4 overflow-x-auto relative z-10 pb-2">
          {events.length === 0 ? (
            <p className="text-sm text-gray-500">No events yet</p>
          ) : (
            <EventCardHorizontal key={0} {...events[0]} capacity={events[0].capacity} />
          )}
        </div>
      </div>
    </Link>
  );
};

export default EventTypeSection;


