import EventCard from "./EventCard";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { MapPinIcon } from "@heroicons/react/20/solid";

interface EventCardProps {
  title: string;
  dateStart: string;
  dateEnd: string;
  location: string;
  catagory?: string[];
  imgSrc: string;
  status?: string;
}

interface EventTypeSectionProps {
  title: string;
  color: string;
  backgroundBrain?: string;
  events: EventCardProps[];
}

const EventTypeSection: React.FC<EventTypeSectionProps> = ({
  title,
  color,
  backgroundBrain,
  events,
}) => {
  return (
    <div className={`p-4 rounded-lg mb-4 relative ${color}`}>
      {/* Background brain image */}
      {backgroundBrain && (
        <div
          className="absolute right-0 bottom-0 bg-no-repeat bg-contain opacity-25 pointer-events-none"
          style={{
            backgroundImage: `url(${backgroundBrain})`,
            width: "150px",
            height: "150px",
            backgroundSize: "contain",
          }}
        />
      )}

      {/* Section title */}
      <h2 className="font-medium mb-2 relative z-10">
        {title} <span className="text-gray-600">&gt;</span>
      </h2>

      {/* Events list */}
      <div className="flex gap-4 overflow-x-auto relative z-10 pb-2">
        {events.length === 0 ? (
          <p className="text-sm text-gray-500">No events yet</p>
        ) : (
          events.map((event, idx) => <EventCard key={idx} {...event} />)
        )}
      </div>
    </div>
  );
};

export default EventTypeSection;
