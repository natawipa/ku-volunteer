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
    METADATA: '/api/activities/metadata/',
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
  OPEN: 'open',
  FULL: 'full',
  CLOSED: 'closed',
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
  PROFILE: '/profile',
  EVENT_DETAIL: (id: string | number) => `/events/${id}`,
  EVENT_TYPE: {
    ENHANCE: '/event-type/enhance',
    SOCIAL: '/event-type/social',
    UNIVERSITY: '/event-type/university',
  },
  NEW_EVENT: '/new',
} as const;

// UI constants
export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000,
  MODAL_TRANSITION_DURATION: 200,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
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