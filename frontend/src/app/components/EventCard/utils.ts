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
