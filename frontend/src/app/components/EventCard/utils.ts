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

// Transform backend activity to frontend card format
export function transformActivityToEvent(activity: Activity): EventCardData {
  if (!activity) {
    console.warn("Empty activity passed to transform function");
    const now = new Date().toLocaleDateString("en-GB");
    return {
      id: 0,
      title: "Untitled Activity",
      description: "No description",
      organizer: "Unknown Organizer",
      participants_count: 0,
      max_participants: 0,
      dateStart: now,
      dateEnd: now,
      location: "Unknown Location",
      category: [],
      imgSrc: "/default-event.jpg",
      status: "unknown",
      posted_at: new Date().toISOString(),
    };
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
    imgSrc:
      activity.cover_image_url ||
      activity.cover_image ||
      "/default-event.jpg",
    status: activity.status ?? "unknown",
    posted_at: activity.created_at ?? new Date().toISOString(),
  };
}

// Event filtering utilities for different contexts
export interface EventFilterConfig {
  activities: Activity[];
  userRole: string | null;
  isAuthenticated: boolean;
  userApplications?: { activity: number | null; status: string }[];
  organizerProfileId?: number | null;
}

// Constants for activity statuses (to avoid importing from constants in utils)
const ACTIVITY_STATUS = {
  PENDING: 'pending',
  UPCOMING: 'upcoming', 
  OPEN: 'open',
  DURING: 'during',
  COMPLETE: 'complete',
  FULL: 'full',
  CLOSED: 'closed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

const APPLICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved', 
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
} as const;

const USER_ROLES = {
  STUDENT: 'student',
  ORGANIZER: 'organizer',
  ADMIN: 'admin',
} as const;

// Filter events for "My Events" section based on user role
export function getMyEvents(config: EventFilterConfig): EventCardData[] {
  const { activities, userRole, isAuthenticated, userApplications = [], organizerProfileId } = config;
  
  if (!isAuthenticated) return [];
  
  if (userRole === USER_ROLES.STUDENT) {
    // My Events: Events the student has applied to and been approved for (all statuses)
    const approvedActivityIds = userApplications
      .filter(app => app.status === APPLICATION_STATUS.APPROVED && app.activity !== null)
      .map(app => app.activity as number);
    
    return activities
      .filter(activity => approvedActivityIds.includes(activity.id))
      .map(transformActivityToEvent)
      .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
  }
  
  if (userRole === USER_ROLES.ORGANIZER) {
    // My Events: ALL events created by this organizer (all statuses)
    const filteredActivities = activities.filter(activity => {
      console.log(`Activity ${activity.id}: organizer_profile_id=${activity.organizer_profile_id}, matches=${activity.organizer_profile_id === organizerProfileId}`);
      return activity.organizer_profile_id === organizerProfileId;
    });
    
    console.log('Filtered activities for organizer:', filteredActivities.length);
    
    return filteredActivities
      .map(transformActivityToEvent)
      .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
  }
  
  return [];
}

// Filter events for "All Events" section based on user role
export function getAllEvents(config: EventFilterConfig): EventCardData[] {
  const { activities, userRole, isAuthenticated, userApplications = [], organizerProfileId } = config;
  
  if (!isAuthenticated) {
    // Not authenticated: show events students can apply to (open, upcoming)
    return activities
      .filter(activity => 
        activity.status === ACTIVITY_STATUS.OPEN || 
        activity.status === ACTIVITY_STATUS.UPCOMING
      )
      .map(transformActivityToEvent)
      .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
  }
  
  if (userRole === USER_ROLES.STUDENT) {
    // All Events: Events student can still apply to (open, upcoming only)
    return activities
      .filter(activity => 
        activity.status === ACTIVITY_STATUS.OPEN || 
        activity.status === ACTIVITY_STATUS.UPCOMING
      )
      .map(transformActivityToEvent)
      .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
  }
  
  if (userRole === USER_ROLES.ORGANIZER) {
    // All Events: Events that students can still apply to (open, upcoming)
    return activities
      .filter(activity => 
        activity.status === ACTIVITY_STATUS.OPEN || 
        activity.status === ACTIVITY_STATUS.UPCOMING
      )
      .map(transformActivityToEvent)
      .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
  }
  
  return [];
}

// Filter events for EventTypeSection - events students can apply to (open, upcoming)
export function getOpeningEvents(activities: Activity[]): EventCardData[] {
  // Display events that students can still apply to (open, upcoming)
  return activities
    .filter(activity => 
      activity.status === ACTIVITY_STATUS.OPEN || 
      activity.status === ACTIVITY_STATUS.UPCOMING
    )
    .map(transformActivityToEvent)
    .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
}
