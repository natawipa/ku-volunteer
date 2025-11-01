import { Activity } from "@/lib/types";

export interface EventCardData {
  id: string | number;
  title: string;
  description: string;
  category: string | string[];
  dateStart: string;
  dateEnd: string;
  location: string;
  organizer: string;
  participants_count: number;
  max_participants: number;
  posted_at?: string;
  imgSrc?: string;
  status?: string;
}

export const statusColors: Record<string, string> = {
pending: 'bg-gray-400',     
open: 'bg-blue-500',
full: 'bg-sky-500',
closed: 'bg-gray-700',    
cancelled: 'bg-red-600',
rejected: 'bg-red-600',
upcoming: 'bg-amber-300',
during: 'bg-indigo-500',
complete: 'bg-emerald-600',
};

export const categoryColors: Record<string, string> = {
  'University Activities': 'bg-[#B3E6FF]',
  'Social Engagement Activities': 'bg-[#FFBDBE]',
  'Enhance Competencies': 'bg-[#FFEA47]',
  // Enhance Competencies subcategories
  'Development of Morality and Ethics': 'bg-[#FFEA47]',
  'Development of Thinking and Learning Skills': 'bg-[#FFEA47]',
  'Development of Interpersonal Skills and Relationship Building': 'bg-[#FFEA47]',
  'Development of Health and Well-being': 'bg-[#FFEA47]',
};

export function formatDate(dateString: string): string {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatPostedTime(date?: string): string {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const categoryBackgrounds: Record<string, { color: string; backgroundBrain: string }> = {
  "University Activities": {
    color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#5992FF]/26",
    backgroundBrain: "/brain-read.svg",
  },
  "Enhance Competencies": {
    color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#FFEA47]/26",
    backgroundBrain: "/brain-think.svg",
  },
  "Social Engagement Activities": {
    color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#FF999B]/26",
    backgroundBrain: "/brain-smart.svg",
  },
  // Enhance Competencies subcategories
  "Development of Morality and Ethics": {
    color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#FFEA47]/26",
    backgroundBrain: "/brain-think.svg",
  },
  "Development of Thinking and Learning Skills": {
    color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#FFEA47]/26",
    backgroundBrain: "/brain-think.svg",
  },
  "Development of Interpersonal Skills and Relationship Building": {
    color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#FFEA47]/26",
    backgroundBrain: "/brain-think.svg",
  },
  "Development of Health and Well-being": {
    color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#FFEA47]/26",
    backgroundBrain: "/brain-think.svg",
  },
};

export function getCategoryBackground(category: string): { color: string; backgroundBrain: string } {
  return categoryBackgrounds[category] || {
    color: "bg-gray-100",
    backgroundBrain: "",
  };
}

export const transformActivityToEvent = (activity: Activity): EventCardData => {
  if (!activity) {
    console.warn('⚠️ Empty activity passed to transform function');
    return getDefaultEventCardData();
  }

  return {
    id: activity.id ?? 0,
    title: activity.title ?? "Untitled Activity",
    description: activity.description ?? "No description",
    organizer: activity.organizer_name ?? "Unknown Organizer",
    participants_count: activity.current_participants ?? 0,
    max_participants: activity.max_participants ?? 0,
    dateStart: activity.start_at ?? new Date().toISOString(),
    dateEnd: activity.end_at ?? new Date().toISOString(),
    location: activity.location ?? "Unknown Location",
    category: activity.categories ?? [],
    imgSrc: activity.cover_image_url || activity.cover_image || "/default-event.jpg",
    status: activity.status ?? "unknown",
    posted_at: activity.created_at ?? new Date().toISOString(),
  };
};


export const getDefaultEventCardData = (): EventCardData => ({
  id: 0,
  title: 'Unknown Activity',
  description: 'No description available',
  organizer: 'Unknown Organizer',
  participants_count: 0,
  max_participants: 0,
  dateStart: new Date().toISOString(),
  dateEnd: new Date().toISOString(),
  location: 'Unknown Location',
  category: [],
  imgSrc: "/default-event.jpg",
  status: 'unknown',
  posted_at: new Date().toISOString(),
});


export const transformMultipleActivitiesToEvents = (activities: Activity[]): EventCardData[] => {
  return activities.map(transformActivityToEvent);
};