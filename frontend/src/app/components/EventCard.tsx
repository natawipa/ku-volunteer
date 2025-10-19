import { CalendarIcon } from "@heroicons/react/24/outline";
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/utils';

export interface EventCardProps {
  id: number;
  title: string;
  post: string;
  dateStart: string;
  dateEnd: string;
  location: string;
  category?: string[];
  imgSrc: string;
  status?: string;
  capacity: number;
}

const statusColors: Record<string, string> = {
  upcoming: "bg-red-700",
  during: "bg-indigo-600",
  complete: "bg-green-600",
};

const categoryColors: Record<string, string> = {
  "University Activities": "bg-[#B3E6FF]",
  "Enhance Competencies": "bg-[#FFBDBE]",
  "Social Engagement Activities": "bg-[#FFEA47]",
};

const EventCard: React.FC<EventCardProps> = ({ id,title, dateStart, dateEnd, category, imgSrc, status 
}) => {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    // If user is not authenticated, redirect to login instead of going to detail
    if (!auth.isAuthenticated()) {
      e.preventDefault();
      router.push('/login');
      return;
    }
    // otherwise navigate to detail page
    router.push(`/event-detail/${id}`);
  };

  return (
    <div onClick={handleClick} role="button" tabIndex={0} className="cursor-pointer">
      <div className="bg-transparent rounded-lg p-4 w-60 relative flex-shrink-0 hover:scale-105 hover:bg-gray-100 transition-transform duration-200">
        <img
          src={imgSrc}
          alt={title}
          className="rounded-lg object-cover"
          style={{ width: '100%', height: '120px' }}
        />

        {/* Status Badge */}
      {status && (
        <span
          className={`absolute font-bold top-4 right-4 text-white text-sm px-2 py-1 rounded-tl-[5px] rounded-tr-[5px] rounded-bl-[20px] rounded-br-[5px] ${statusColors[status]}`}
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
      {category && category.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1 text-xs">
          {(Array.isArray(category) ? category : [category]).map((c, idx) => (
            <span
              key={idx}
              className={`text-black px-2 py-1 rounded-full ${categoryColors[c]}`}
            >
              #{c}
            </span>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

export default EventCard;
