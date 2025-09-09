import { ChevronRightIcon } from "@heroicons/react/24/outline";

const events = [
  { title: "Text title", status: "upcoming", img: "/event1.jpg" },
  { title: "Text title", status: "during", img: "/event2.jpg" },
  { title: "Text title", status: "complete", img: "/event3.jpg" },
];

function EventCard({ title, status, img }: any) {
  const statusColors: Record<string, string> = {
    upcoming: "bg-red-500",
    during: "bg-blue-500",
    complete: "bg-green-600",
  };

  return (
    
    <div className="rounded-xl overflow-hidden bg-white shadow-md w-56 shrink-0">
      <div className="relative">
        <img src={img} alt={title} className="h-32 w-full object-cover" />
        <span
          className={`absolute top-2 right-2 text-white text-xs px-2 py-1 rounded ${statusColors[status]}`}
        >
          {status}
        </span>
      </div>
      <div className="p-3">
        <h3 className="font-bold text-sm">{title}</h3>
        <p className="text-xs text-gray-500">DD/MM/YY - DD/MM/YY</p>
        <div className="mt-2 flex flex-wrap gap-1 text-xs">
          <span className="bg-black text-white px-2 py-1 rounded">
            #หมวดวิชาศาสตร์
          </span>
          <span className="bg-orange-500 text-white px-2 py-1 rounded">
            #หมวดอื่น
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  return (
    <div className="relative">
      {/* Background gradient */}
      <div className="absolute inset-0 h-[115px] bg-gradient-to-b from-[#B4DDB6] to-white" >
        <img
          src="/mountain.svg"
          alt="mountain"
          className="flex absolute inset-x-0 top-0 w-full h-40 object-cover opacity-90  "
        />
      </div>

      {/* content */}
      <div className="relative p-6">
        {/* Profile card */}
        <div className="flex flex-col sm:flex-row items-center p-8 
                  space-y-4 sm:space-y-0 sm:space-x-8 
                  ml-0 sm:ml-4 md:ml-8 lg:ml-16 
                  transition-all duration-300">
          <img
            src="/avatar.jpg"
            alt="profile"
            className="w-30 h-30 p-[4px] bg-gradient-to-t from-[#ACE9A9] to-[#CCDDCA] rounded-full object-cover"
          />
          <div>
            <h2 className="font-extrabold text-lg bg-white rounded-lg px-6 py-1 ring-[2px] ring-[#B4DDB6]">Mr. Somchai Ramrian</h2>
          </div>
        </div>

        {/* Profile Information */}
        <div className="flex flex-col w-full max-w-4xl mx-auto mb-8 p-6 
                bg-gradient-to-b from-[#D7EBCA]/50 to-[#EDFFCC]/50 
                rounded-3xl shadow-md">
          <div className="font-extrabold ml-8 mr-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-y-4 text-sm">
            {/* Row 1 */}
            <div className="flex justify-between items-center">
              <span>ID</span>
              <b className="w-48 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl mr-8">
                6610545952
              </b>
            </div>
            {/* Row 2 */}
            <div className="flex justify-between items-center">
              <span>Year</span>
              <b className="w-48 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl mr-8">
                3
              </b>
            </div>
            {/* Row 3 */}
            <div className="flex justify-between items-center">
              <span>Faculty</span>
              <b className="w-48 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl mr-8">
                Engineering
              </b>
            </div>
            {/* Row 4 */}
            <div className="flex justify-between items-center">
              <span>Major</span>
              <b className="w-48 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl mr-8">
                Software and Knowledge
              </b>
            </div>
          </div>
        </div>

        {/* My Event */}
        <section className="mb-6">
          <h3 className="font-bold text-xl mb-2">My Event</h3>
          <div className="flex items-center">
            <div className="flex gap-4 overflow-x-auto">
              {events.map((e, i) => (
                <EventCard key={i} {...e} />
              ))}
            </div>
            <button className="ml-2 p-2 rounded-full bg-gray-200 hover:bg-gray-300">
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Favorite Event */}
        <section>
          <h3 className="font-bold text-xl mb-2">
            Favorite Event <span>⭐</span>
          </h3>
          <div className="flex items-center">
            <div className="flex gap-4 overflow-x-auto">
              {events.map((e, i) => (
                <EventCard key={i} {...e} />
              ))}
            </div>
            <button className="ml-2 p-2 rounded-full bg-gray-200 hover:bg-gray-300">
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
