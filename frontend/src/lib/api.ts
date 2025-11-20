const API_BASE_URL = 'http://localhost:8000/api';

export interface StudentProfile {
  student_id_external: string;
  year: number;
  faculty: string;
  major: string;
}

export interface OrganizerProfile {
  id?: number;
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
  public async getUserList(): Promise<ApiResponse<User[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/list/`, {
        headers: this.getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
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
        if (data.access) localStorage.setItem('access_token', data.access);
        if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
        return { success: true, data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Login failed' };
      }
    } catch {
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

        if (!response.ok) {
          console.warn('Logout failed, but clearing local storage anyway');
        }
      }

      this.clearAuthTokens();
      
      return { success: true, data: null };
    } catch {
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
    student_id_external?: string;
    year?: number;
    faculty?: string;
    major?: string;
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
    } catch {
      return { success: false, error: 'Network error' };
    }
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else if (response.status === 401) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          throw new Error('TOKEN_REFRESHED');
        } else {
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
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.user_id;

      const response = await fetch(`${API_BASE_URL}/users/${userId}/`, {
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse<User>(response);
    } catch (error) {
      if (error instanceof Error && error.message === 'TOKEN_REFRESHED') {
        return this.getCurrentUser();
      }
      return { success: false, error: 'Failed to get user profile' };
    }
  }

  async updateUser(userId: number, userData: Partial<User>): Promise<ApiResponse<User>> {
    try {      
      const url = `${API_BASE_URL}/users/${userId}/update/`;      
      const headers = this.getAuthHeaders();      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(userData),
      });
      const responseText = await response.text();  
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch {
        return { 
          success: false, 
          error: `Server returned invalid JSON: ${responseText}` 
        };
      }
  
      if (response.ok) {
        return { success: true, data: responseData };
      } else {
        
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
      if (error instanceof Error && error.message === 'TOKEN_REFRESHED') {
        return this.updateUser(userId, userData);
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error occurred' 
      };
    }
  }

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
    } catch {
      return { success: false, error: 'Network error' };
    }
  }

  getProfileImageUrl(profileImage?: string | null): string {
    if (!profileImage) {
      return '/avatar.jpg';
    }
    
    if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
      return profileImage;
    }
    
    if (profileImage.startsWith('/media/')) {
      return `http://localhost:8000${profileImage}`;
    }
    
    if (profileImage.startsWith('users/')) {
      return `http://localhost:8000/media/${profileImage}`;
    }
    
    return `http://localhost:8000/media/${profileImage}`;
  }

  async deleteUser(userId: number): Promise<ApiResponse<null>> {
    try {      
      const url = `${API_BASE_URL}/users/delete/${userId}/`;      
      const headers = this.getAuthHeaders();      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: headers,
      });
      if (response.ok) {
        return { success: true, data: null };
      } else {
        const responseText = await response.text();        
        let responseData;
        try {
          responseData = responseText ? JSON.parse(responseText) : {};
        } catch {
          return { 
            success: false, 
            error: `Server returned invalid JSON: ${responseText}` 
          };
        }

        let errorMessage = 'Delete failed';
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
      
      if (error instanceof Error && error.message === 'TOKEN_REFRESHED') {
        return this.deleteUser(userId);
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error occurred' 
      };
    }
  }

  async forgotPassword(email: string): Promise<ApiResponse<{message: string}>> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.error || 'Failed to send reset email' };
      }
    } catch {
      return { success: false, error: 'Network error' };
    }
  }

  async resetPassword(email: string, token: string, password: string): Promise<ApiResponse<{message: string}>> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.error || 'Failed to reset password' };
      }
    } catch {
      return { success: false, error: 'Network error' };
    }
  }
}

export const apiService = new ApiService();