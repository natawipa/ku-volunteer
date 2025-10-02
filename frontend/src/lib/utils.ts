import { API_ENDPOINTS, ENV, ERROR_MESSAGES, STORAGE_KEYS } from './constants';
import type { ApiError, ApiResponse, LoginResponse } from './types';

// HTTP client class for API requests
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
  
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };
  
    console.log('🌐 Making request to:', url);
    console.log('🔧 Request config:', {
      method: config.method,
      headers: config.headers,
      body: config.body ? JSON.parse(config.body as string) : 'No body'
    });
  
    try {
      const response = await fetch(url, config);
      console.log('📄 Response status:', response.status);
      console.log('📄 Response ok:', response.ok);
  
      const responseText = await response.text();
      console.log('📄 Raw response:', responseText);
  
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch (parseError) {
        console.error('❌ Failed to parse JSON:', parseError);
        data = null;
      }
  
      if (!response.ok) {
        console.error('❌ API Error Response:', data);
        throw new Error(data?.detail || data?.message || data?.error || ERROR_MESSAGES.SERVER_ERROR);
      }
  
      console.log('✅ API Success Response:', data);
      return { data, success: true };
    } catch (error) {
      console.error('❌ API Request Error:', error);
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

  // HTTP methods
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

// Create HTTP client instance
export const httpClient = new HttpClient(ENV.API_BASE_URL);

// Authentication utilities
export const auth = {
  // Store tokens in localStorage
  setTokens(access: string, refresh: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
  },

  // Get access token
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  // Get refresh token
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  // Clear all tokens
  clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },

  // Get user data from localStorage
  getUserData(): { id?: string | number; email?: string; first_name?: string; last_name?: string; role?: string; is_active?: boolean; created_at?: string; updated_at?: string } | null {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  },

  // Get user role
  getUserRole(): string | null {
    const userData = this.getUserData();
    return userData?.role || null;
  },

  // Login user
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    // Make direct fetch request without Authorization header for login
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

      // Store tokens and user data
      if (data.access && data.refresh) {
        this.setTokens(data.access, data.refresh);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
      }

      return { data, success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        error: error instanceof Error ? error.message : ERROR_MESSAGES.NETWORK_ERROR,
        success: false,
      };
    }
  },

  // Logout user
  logout(): void {
    this.clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
};

// Form validation utilities
export const validation = {
  // Email validation
  email(value: string): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) return 'Email is required';
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return null;
  },

  // Password validation
  password(value: string): string | null {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters long';
    return null;
  },

  // Confirm password validation
  confirmPassword(password: string, confirmPassword: string): string | null {
    if (!confirmPassword) return 'Please confirm your password';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  },

  // Required field validation
  required(value: string | number | null | undefined, fieldName: string): string | null {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  },

  // Max length validation
  maxLength(value: string, max: number, fieldName: string): string | null {
    if (value && value.length > max) {
      return `${fieldName} must not exceed ${max} characters`;
    }
    return null;
  },
};

// Date utilities
export const dateUtils = {
  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  // Format datetime for display
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

  // Check if date is in the past
  isPast(dateString: string): boolean {
    return new Date(dateString) < new Date();
  },

  // Check if date is today
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

// String utilities
export const stringUtils = {
  // Capitalize first letter
  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  // Truncate string
  truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
  },

  // Slugify string
  slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },
};

// Debounce utility
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

// Error handler utility
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