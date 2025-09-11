import EventCard from "./EventCard";

interface EventTypeSectionProps {
  title: string;
  description?: string;
  color: string; // Tailwind background color
  backgroundBrain?: string;
  events: {
    title: string;
    date: string;
    location: string;
    imgSrc: string;
  }[];
}

const EventTypeSection: React.FC<EventTypeSectionProps> = ({ title, color, events }) => {
  return (
    <div className={`p-4 rounded-lg mb-4 ${color}`}>
      <h2 className="font-medium mb-2">{title}</h2>
      <div className="flex gap-4 overflow-x-auto">
        {events.map((event, idx) => (
          <EventCard key={idx} {...event} />
        ))}
      </div>
    </div>
  );
};

export default EventTypeSection;
