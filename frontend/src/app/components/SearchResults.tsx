"use client";
import PublicEventHorizontalCard, { PublicEventCardData } from "./PublicEventHorizontalCard";

interface SearchEvent {
  id: string | number;
  title: string;
  description?: string;
  category: string | string[];
  dateStart: string;
  dateEnd: string;
  location: string;
  organizer?: string;
  participants_count?: number;
  max_participants?: number;
  imgSrc?: string;
  status?: string;
}

interface SearchResultsProps {
  events: SearchEvent[];
  onBack?: () => void;
}

const SearchResults = ({ events, onBack }: SearchResultsProps) => {
  if (!events || events.length === 0) {
    return (
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <button
            className="text-green-600 border-b border-green-600 hover:border-green-700 hover:text-green-700 cursor-pointer"
            onClick={onBack}
          >
            ← Back
          </button>
          <span />
        </div>
        <p className="text-center text-gray-600">No events found matching your search.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 mb-10">
      <button
        className="mb-4 text-green-600 border-b border-green-600 hover:border-green-700 hover:text-green-700 cursor-pointer"
        onClick={onBack}> ← Back
      </button>

      <h2 className="font-semibold text-xl mb-4">Search Results ({events.length} events)</h2>
      <div className="space-y-4">
        {events.map((event, idx) => {
          // Convert event to PublicEventCardData
          const cardData: PublicEventCardData = {
            id: event.id,
            title: event.title,
            description: event.description || "",
            category: Array.isArray(event.category) ? event.category.join(", ") : event.category,
            dateStart: event.dateStart,
            dateEnd: event.dateEnd,
            location: event.location,
            organizer: event.organizer || "",
            participants_count: event.participants_count || 0,
            max_participants: event.max_participants || 0,
            imgSrc: event.imgSrc,
          };
          return (
            <div key={idx}>
              <PublicEventHorizontalCard event={cardData} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SearchResults;