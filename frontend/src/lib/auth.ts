/**
 * Authentication utilities for managing user state and roles
 */

export interface User {
  id: string;
  email: string;
  role: 'student' | 'organizer' | 'staff';
  firstName?: string;
  lastName?: string;
  studentID?: string;
  faculty?: string;
  major?: string;
}

/**
 * Get the current user's access token from localStorage
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

/**
 * Get the current user's refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

/**
 * Get current user data from localStorage or API
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const userData = localStorage.getItem('user_data');
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Store user data in localStorage
 */
export function setCurrentUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user_data', JSON.stringify(user));
}

/**
 * Clear all authentication data
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_data');
}

/**
 * Store authentication tokens
 */
export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
}

/**
 * Get user role, defaulting to 'student' if no user or role found
 */
export function getUserRole(): 'student' | 'organizer' | 'staff' {
  const user = getCurrentUser();
  return user?.role || 'student';
}