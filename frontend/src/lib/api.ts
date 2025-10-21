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
  profile_image?: string;
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

export interface StudentProfileUpdate {
  student_id_external?: string; 
  year?: number;
  faculty?: string;
  major?: string;
}

export interface UserUpdate {
  id?: number;
  email?: string;
  title?: string;
  first_name?: string;
  last_name?: string;
  role?: 'student' | 'organizer' | 'admin';
  profile?: StudentProfileUpdate;
  organizer_profile?: OrganizerProfile;
}

class ApiService {
  //Fetch all users (admin only). Returns ApiResponse<User[]> or paginated results.
  public async getUserList(): Promise<ApiResponse<User[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/list/`, {
        headers: this.getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        // Support both paginated and non-paginated responses
        const users = Array.isArray(data) ? data : (data.results || []);
        return { success: true, data: users };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || errorData.detail || 'Failed to fetch user list' };
      }
    } catch {
      return { success: false, error: 'Network error' };
    }
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async login(email: string, password: string): Promise<ApiResponse<{access: string, refresh: string, user: User}>> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store tokens in localStorage
        if (data.access) localStorage.setItem('access_token', data.access);
        if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
        return { success: true, data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  async logout(): Promise<ApiResponse<null>> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        const response = await fetch(`${API_BASE_URL}/users/logout/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        // clear local storage even logout fail
        if (!response.ok) {
          console.warn('Logout failed, but clearing local storage anyway');
        }
      }

      this.clearAuthTokens();
      
      return { success: true, data: null };
    } catch (error) {
      console.error('Logout error:', error);
      this.clearAuthTokens();
      return { success: true, data: null };
    }
  }

  private clearAuthTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    sessionStorage.clear();
  }


  async register(userData: {
    email: string;
    password: string;
    confirm: string;
    title?: string;
    first_name: string;
    last_name: string;
    role: 'student' | 'organizer';
    // Student fields
    student_id_external?: string;
    year?: number;
    faculty?: string;
    major?: string;
    // Organizer fields
    organize?: string;
    organization_name?: string;
  }): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      return await this.handleResponse<User>(response);
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Network error' };
    }
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
      console.log('updateUser called with:', { userId, userData });
      
      const url = `${API_BASE_URL}/users/${userId}/update/`;
      console.log('Making request to:', url);
      
      const headers = this.getAuthHeaders();
      console.log('Headers:', headers);
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(userData),
      });
  
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
  
      const responseText = await response.text();
      console.log('Raw response:', responseText);
  
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch {
        console.error(' Failed to parse response as JSON:', responseText);

        return { 
          success: false, 
          error: `Server returned invalid JSON: ${responseText}` 
        };
      }
  
      if (response.ok) {
        console.log('Update successful!');
        return { success: true, data: responseData };
      } else {
        console.error('Update failed:', responseData);
        
        let errorMessage = 'Request failed';
        if (responseData.detail) {
          errorMessage = responseData.detail;
        } else if (responseData.message) {
          errorMessage = responseData.message;
        } else if (typeof responseData === 'object') {
          errorMessage = JSON.stringify(responseData);
        } else if (typeof responseData === 'string') {
          errorMessage = responseText;
        }
        
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('NETWORK ERROR in updateUser:', error);
      console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown');
      
      if (error instanceof Error && error.message === 'TOKEN_REFRESHED') {
        return this.updateUser(userId, userData);
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error occurred' 
      };
    }
  }

  /**
   * Upload profile image for a user
   */
  async uploadProfileImage(userId: number, imageFile: File): Promise<ApiResponse<User>> {
    try {
      const formData = new FormData();
      formData.append('profile_image', imageFile);

      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/users/${userId}/update/`, {
        method: 'PATCH',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.detail || 'Failed to upload profile image' };
      }
    } catch (error) {
      console.error('Upload profile image error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Get full URL for profile image
   */
  getProfileImageUrl(profileImage?: string | null): string {
    if (!profileImage) {
      return '/avatar.jpg';
    }
    
    // If it's already a full URL, return it
    if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
      return profileImage;
    }
    
    // If it starts with /media/, construct full URL
    if (profileImage.startsWith('/media/')) {
      return `http://localhost:8000${profileImage}`;
    }
    
    // If it's a relative path without /media/, add it
    if (profileImage.startsWith('users/')) {
      return `http://localhost:8000/media/${profileImage}`;
    }
    
    // Default case: assume it's a path that needs /media/ prefix
    return `http://localhost:8000/media/${profileImage}`;
  }
}

export const apiService = new ApiService();