import { auth } from "../../../lib/utils";
import { useRouter } from 'next/navigation';

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
// Organizational statuses
  pending: 'bg-yellow-500',
  open: 'bg-yellow-500',
  full: 'bg-yellow-500',
  closed: 'bg-yellow-400',
  canceled: 'bg-yellow-500',
  rejected: 'bg-yellow-500',

// Student statuses
  upcoming: 'bg-red-700',
  during: 'bg-indigo-600',
  complete: 'bg-green-600',
};

export const categoryColors: Record<string, string> = {
  'University Activities': 'bg-[#B3E6FF]',
  'Enhance Competencies': 'bg-[#FFBDBE]',
  'Social Engagement Activities': 'bg-[#FFEA47]',
};

export const formatDate = (dateString: string): string => {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatPostedTime = (date?: string): string => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export const useEventCardNavigation = () => {
  const router = useRouter();
  return (id: string | number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!auth.isAuthenticated()) router.push('/login');
    else router.push(`/event-detail/${id}`);
  };
};

export const categoryBackgrounds: Record<string, { color: string; backgroundBrain: string }> = {
  "University Activities": {
    color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#5992FF]/26",
    backgroundBrain: "/brainread.svg",
  },
  "Enhance Competencies": {
    color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#FFEA47]/26",
    backgroundBrain: "/brainthink.svg",
  },
  "Social Engagement Activities": {
    color: "bg-gradient-to-r from-[#A1E59E]/26 to-[#FF999B]/26",
    backgroundBrain: "/brainlove.svg",
  },
};

export const getCategoryBackground = (category: string): { color: string; backgroundBrain: string } => {
  return categoryBackgrounds[category] || {
    color: "bg-gray-100",
    backgroundBrain: "",
  };
};
