// Environment configuration
export const ENV = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  CLIENT_URL: process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/users/login/',
    REGISTER: '/api/users/register/',
    OAUTH_REGISTER: '/api/users/oauth-register/',
    GOOGLE_LOGIN: '/api/auth/google/login/',
    LOGOUT: '/api/users/logout/',
  },
  USERS: {
    PROFILE: '/api/users/profile/',
    LIST: '/api/users/list/',
    DETAIL: (id: string | number) => `/api/users/${id}/`,
    UPDATE: (id: string | number) => `/api/users/${id}/update/`,
    DELETE: (id: string | number) => `/api/users/delete/${id}/`,
  },
  ACTIVITIES: {
    LIST: '/api/activities/list/',
    CREATE: '/api/activities/create/',
    DETAIL: (id: string | number) => `/api/activities/${id}/`,
    UPDATE: (id: string | number) => `/api/activities/${id}/update/`,
    DELETE: (id: string | number) => `/api/activities/delete/${id}/`,
    REQUEST_DELETE: (id: string | number) => `/api/activities/request-delete/${id}/`,
    APPLY: `/api/activities/applications/create/`,
    GETAPPLICATIONS: `/api/activities/applications/list/`,
    APPLICATION_DETAIL: (id: string | number) => `/api/activities/applications/${id}/`,
    CANCELAPPLICATION: (id: string | number) => `/api/activities/applications/${id}/cancel/`,
    APPROVEDAPPLICATION: `/api/activities/my-approved-activities/`,
    EVENTAPPLICANTS: (activity_id: string | number) => `/api/activities/${activity_id}/applications/`,
    REVIEWAPPLICATION: (id: string | number) => `/api/activities/applications/${id}/review/`,
    METADATA: '/api/activities/metadata/',
    MODERATION_REVIEW: (id: string | number) => `/api/activities/moderation/${id}/review/`,
    POSTERS: (activity_id: string | number) => `/api/activities/${activity_id}/posters/`,
    DELETION_REQUESTS: '/api/activities/deletion-requests/',
    DELETION_REQUEST_REVIEW: (id: string | number) => `/api/activities/deletion-requests/${id}/review/`,
    
    CHECK_IN_CODE: (id: number | string) => `/api/activities/${id}/checkin-code/`,
    CHECK_IN: (id: number | string) => `/api/activities/${id}/checkin/`,
    CHECK_IN_LIST: (id: number | string) => `/api/activities/${id}/checkin-list/`,
    CHECK_IN_STATUS: (id: number | string) => `/api/activities/${id}/checkin-status/`,
  },
  TOKEN: {
    OBTAIN: '/api/token/',
    REFRESH: '/api/token/refresh/',
  },
} as const;

// User roles
export const USER_ROLES = {
  STUDENT: 'student',
  ORGANIZER: 'organizer',
  ADMIN: 'admin',
} as const;

// Activity statuses
export const ACTIVITY_STATUS = {
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

// Local storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
} as const;

// Route paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ROLE_SELECTION: '/role',
  ADMIN_HOME: '/admin',
  PROFILE: '/profile',
  EVENT_DETAIL: (id: string | number) => `/events/${id}`,
  EVENT_TYPE: {
    ENHANCE: '/event-type/enhance',
    SOCIAL: '/event-type/social',
    UNIVERSITY: '/event-type/university',
  },
  NEW_EVENT: '/new-event',
  ALL_EVENTS: '/all-events',
} as const;

// UI constants
export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000,
  MODAL_TRANSITION_DURATION: 200,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  POLL_INTERVAL: 30000, // 30 seconds
  CHECK_IN_POLL_INTERVAL: 10000, // 10 seconds
  CHECK_IN_CODE_LENGTH: 6,
} as const;

export const BUTTON_STYLES = {
  PRIMARY: 'bg-[#96C693] text-white px-8 py-3 rounded-lg hover:bg-[#72A070] cursor-pointer transition-all text-center',
  SECONDARY: 'bg-white text-gray-600 border border-gray-600 px-6 py-3 rounded-lg hover:bg-gray-200 cursor-pointer transition-all',
  DISABLED: 'bg-gray-400 text-white px-8 py-3 rounded-lg cursor-not-allowed font-medium',
  DANGER: 'bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 cursor-pointer transition-all',
} as const;

export const CHECK_IN_STYLES = {
  CHECKED_IN: { bgColor: 'bg-[#FFEAF4]', textColor: 'text-[#E169A1]', label: 'Checked In' },
  ABSENT: { bgColor: 'bg-[#FFE8B1]', textColor: 'text-[#C08A06]', label: 'Absent' },
  APPROVED: { bgColor: 'bg-[#D6E9D5]', textColor: 'text-[#215700]', label: 'Approved' },
} as const;

export const APPLICATION_STATUS = {
  PENDING: 'pending', 
  APPROVED: 'approved',
  REJECTED: 'rejected', 
  CANCELLED: 'cancelled',
  CHECKED_IN: 'checked_in',
  PLEASE_CHECKIN: 'please_checkin',
  ABSENT: 'absent'
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  ACCESS_DENIED: 'You do not have permission to access this resource.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FILE_TOO_LARGE: 'File size must be less than 5MB.',
  INVALID_FILE_TYPE: 'Only JPEG, PNG, and WebP images are supported.',
} as const;