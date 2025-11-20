import { API_ENDPOINTS, ENV, ERROR_MESSAGES, STORAGE_KEYS } from './constants';
import type { ApiError, ApiResponse, LoginResponse, Activity } from './types';

class HttpClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAccessToken();

    const isFormData = options.body instanceof FormData;
    const defaultHeaders: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    };

    const config: RequestInit = {
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
      ...options,
    };
  
    try {
      const response = await fetch(url, config);
      const responseText = await response.text();
  
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        data = null;
      }
  
      if (!response.ok) {
        const nonField = Array.isArray(data?.non_field_errors) ? data.non_field_errors[0] : undefined;
        const message = data?.detail || data?.message || data?.error || nonField || ERROR_MESSAGES.SERVER_ERROR;
        throw new Error(message);
      }
  
      return { data, success: true };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : ERROR_MESSAGES.NETWORK_ERROR,
        success: false,
      };
    }
  }

  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  async get<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = unknown>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = unknown>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const httpClient = new HttpClient(ENV.API_BASE_URL);

export const auth = {
  setTokens(access: string, refresh: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
  },

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },

  getUserData(): { id?: string | number; email?: string; first_name?: string; last_name?: string; role?: string; is_active?: boolean; created_at?: string; updated_at?: string } | null {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  },

  getUserRole(): string | null {
    const userData = this.getUserData();
    return userData?.role || null;
  },

  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const url = `${ENV.API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || data?.message || data?.error || ERROR_MESSAGES.SERVER_ERROR);
      }

      if (data.access && data.refresh) {
        this.setTokens(data.access, data.refresh);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
      }

      return { data, success: true };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : ERROR_MESSAGES.NETWORK_ERROR,
        success: false,
      };
    }
  },

  logout(): void {
    this.clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
};

export const validation = {
  email(value: string): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) return 'Email is required';
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return null;
  },

  password(value: string): string | null {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters long';
    return null;
  },

  confirmPassword(password: string, confirmPassword: string): string | null {
    if (!confirmPassword) return 'Please confirm your password';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  },

  required(value: string | number | null | undefined, fieldName: string): string | null {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  },

  maxLength(value: string, max: number, fieldName: string): string | null {
    if (value && value.length > max) {
      return `${fieldName} must not exceed ${max} characters`;
    }
    return null;
  },
};

export const dateUtils = {
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  isPast(dateString: string): boolean {
    return new Date(dateString) < new Date();
  },

  isToday(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  },
};


export const stringUtils = {
  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
  },

  slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): {
  call: (...args: Parameters<T>) => void;
  cancel: () => void;
} => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };
  return { call: debounced, cancel };
};

export const handleApiError = (error: ApiError | string): string => {
  if (typeof error === 'string') return error;
  
  if (error.detail) return error.detail;
  if (error.message) return error.message;
  if (error.errors) {
    const firstError = Object.values(error.errors)[0];
    return Array.isArray(firstError) ? firstError[0] : firstError;
  }
  
  return ERROR_MESSAGES.SERVER_ERROR;
};

interface PosterImage {
  image: string;
}

export interface TransformedEvent {
  id: number;
  title: string;
  post: string;
  datestart: string;
  dateend: string;
  timestart: string;
  timeend: string;
  location: string;
  category: string[];
  capacity: number;
  currentParticipants: number;
  organizer: string;
  description: string;
  image: string;
  additionalImages: string[];
}

function normalizeUrl(url: string): string {
  if (!url) return url;
  try {
    new URL(url);
    return url;
  } catch {
    const base = ENV.API_BASE_URL.replace(/\/$/, '');
    let path = url.startsWith('/') ? url : `/${url}`;
    if (!path.startsWith('/media')) {
      path = path.startsWith('/') ? `/media${path}` : `/media/${path}`;
    }
    return `${base}${path}`;
  }
}

export function transformActivityData(activity: Activity): TransformedEvent {
  const posterImages: PosterImage[] = Array.isArray((activity as unknown as { poster_images?: PosterImage[] }).poster_images) 
    ? (activity as unknown as { poster_images: PosterImage[] }).poster_images 
    : [];

  return {
    id: activity.id,
    title: activity.title || 'Untitled Activity',
    post: new Date(activity.created_at || new Date()).toLocaleDateString('en-GB'),
    datestart: new Date(activity.start_at || new Date()).toLocaleDateString('en-GB'),
    dateend: new Date(activity.end_at || new Date()).toLocaleDateString('en-GB'),
    timestart: new Date(activity.start_at || new Date()).toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit'
    }),
    timeend: new Date(activity.end_at || new Date()).toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit'
    }),
    location: activity.location || 'Unknown Location',
    category: activity.categories || [],
    capacity: activity.max_participants || 0,
    currentParticipants: activity.current_participants || 0,
    organizer: activity.organizer_name || 'Unknown Organizer',
    description: activity.description || 'No description available',
    image: (() => {
      const raw = activity.cover_image_url || activity.cover_image || null;
      if (raw && typeof raw === 'string') return normalizeUrl(raw);
      if (posterImages.length > 0) {
        const first = posterImages.find(p => typeof p.image === 'string' && p.image.length > 0);
        if (first?.image) return normalizeUrl(first.image);
      }
      return "/default-event.jpg";
    })(),
    additionalImages: posterImages
      .map(p => p.image)
      .filter((image): image is string => typeof image === 'string' && image.length > 0)
      .map(normalizeUrl),
  };
}