// API service functions for the application
const API_BASE_URL = 'http://localhost:8000/api';

// Types for user profile data
export interface StudentProfile {
  student_id_external: string;
  year: number;
  faculty: string;
  major: string;
}

export interface OrganizerProfile {
  organization_type: string;
  organization_name: string;
}

export interface User {
  id: number;
  email: string;
  title: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'organizer' | 'admin';
  created_at: string;
  updated_at: string;
  profile?: StudentProfile;
  organizer_profile?: OrganizerProfile;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else if (response.status === 401) {
        // Try to refresh token
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the request with new token
          throw new Error('TOKEN_REFRESHED');
        } else {
          // Redirect to login if refresh failed
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return { success: false, error: 'Authentication failed' };
        }
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Request failed' };
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'TOKEN_REFRESHED') {
        throw error;
      }
      return { success: false, error: 'Network error' };
    }
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        return true;
      } else {
        return false;
      }
    } catch {
      return false;
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return { success: false, error: 'No authentication token found' };
    }

    try {
      // Decode the JWT token to get user ID
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.user_id;

      const response = await fetch(`${API_BASE_URL}/users/${userId}/`, {
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse<User>(response);
    } catch (error) {
      if (error instanceof Error && error.message === 'TOKEN_REFRESHED') {
        // Retry with refreshed token
        return this.getCurrentUser();
      }
      return { success: false, error: 'Failed to get user profile' };
    }
  }

  async updateUser(userId: number, userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/update/`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData),
      });

      return await this.handleResponse<User>(response);
    } catch (error) {
      if (error instanceof Error && error.message === 'TOKEN_REFRESHED') {
        // Retry with refreshed token
        return this.updateUser(userId, userData);
      }
      return { success: false, error: 'Failed to update user profile' };
    }
  }
}

export const apiService = new ApiService();