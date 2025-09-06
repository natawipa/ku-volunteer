import Image from "next/image";
import { CalendarIcon } from "@heroicons/react/24/outline";

interface EventCardProps {
  title: string;
  dateStart: string;
  dateEnd: string;
  location: string;
  catagory?: string;
  imgSrc: string;
}

const EventCard: React.FC<EventCardProps> = ({ title, dateStart, dateEnd, location, catagory, imgSrc }) => {
  return (
    <div className="bg-transparent rounded-lg p-4 w-60">
      <Image src={imgSrc} alt={title} width={240} height={140} className="rounded-lg" />
      <h3 className="font-semibold text-lg mt-2">{title}</h3>
      <section className="flex items-center  bg-[#BBF0D0] rounded-full px-2 py-1 w-full mt-1">
        <CalendarIcon className="w-4 h-4" />
        <p className="text-sm ml-2">{dateStart} - {dateEnd}</p>
      </section>

      <section className="flex items-center justify-between mt-2">
        <p className="text-sm text-gray-500">{catagory}</p>
      </section>
    </div>
  );
};

export default EventCard;
