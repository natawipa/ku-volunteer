// lib/activities.ts
import { httpClient } from './utils';
import { API_ENDPOINTS } from './constants';
import type { 
  Activity, 
  ApiResponse, 
  CreateApplicationRequest,
  ReviewApplicationRequest,
  ActivityApplication} from './types';

// Create activity data type that matches your backend serializer
export interface CreateActivityData {
  title: string;
  description: string;
  location: string;
  start_at: string; // ISO string
  end_at: string; // ISO string
  max_participants?: number;
  hours_awarded?: number;
  categories: string[];
}
// Activities metadata type
interface ActivityMetadata {
  top_levels: string[];
  compound_categories: string[];
  subcategories: Record<string, string[]>;
  categories_max: number;
}

// Type for paginated response
interface ActivitiesPaginatedResponse {
  count: number;
  next?: string;
  previous?: string;
  results: Activity[];
}

// Type guard to check if response is paginated
function isPaginatedResponse(data: unknown): data is ActivitiesPaginatedResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'results' in data &&
    Array.isArray((data as ActivitiesPaginatedResponse).results)
  );
}

// Type guard to check if response is direct array
function isActivityArray(data: unknown): data is Activity[] {
  return Array.isArray(data);
}

// Activities API service
export const activitiesApi = {
  // Get all activities
  async getActivities(): Promise<ApiResponse<Activity[]>> {
    try {
      const response = await httpClient.get<ActivitiesPaginatedResponse | Activity[]>(API_ENDPOINTS.ACTIVITIES.LIST);
      
      if (response.success && response.data) {
        let activitiesData: Activity[] = [];
        
        // Handle paginated response
        if (isPaginatedResponse(response.data)) {
          activitiesData = response.data.results;
          console.log('📊 Extracted paginated results:', activitiesData);
        } 
        // Handle direct array response
        else if (isActivityArray(response.data)) {
          activitiesData = response.data;
          console.log('📊 Using direct array response:', activitiesData);
        }
        
        // Return new response with the extracted array
        return {
          success: true,
          data: activitiesData
        };
      }
      
      // If no data or not successful, return empty array
      return {
        success: response.success,
        data: [],
        error: response.error
      };
      
    } catch (error) {
      console.error('❌ Error in getActivities:', error);
      return { 
        success: false, 
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  // Get activity by ID
  async getActivity(id: string | number): Promise<ApiResponse<Activity>> {
    return httpClient.get<Activity>(API_ENDPOINTS.ACTIVITIES.DETAIL(id));
  },

  // Create new activity
  async createActivity(data: CreateActivityData): Promise<ApiResponse<Activity>> {
    return httpClient.post<Activity>(API_ENDPOINTS.ACTIVITIES.CREATE, data);
  },

  // Update activity
  async updateActivity(id: string | number, data: Partial<Activity>): Promise<ApiResponse<Activity>> {
    return httpClient.put<Activity>(API_ENDPOINTS.ACTIVITIES.UPDATE(id), data);
  },

  // Delete activity
  async deleteActivity(id: string | number): Promise<ApiResponse<void>> {
    return httpClient.delete<void>(API_ENDPOINTS.ACTIVITIES.DELETE(id));
  },

  // Get activity metadata (categories, etc.)
  async getActivityMetadata(): Promise<ApiResponse<ActivityMetadata>> {
    return httpClient.get<ActivityMetadata>(API_ENDPOINTS.ACTIVITIES.METADATA);
  },

  // Get activities by category
  async getActivitiesByCategory(category: string): Promise<ApiResponse<Activity[]>> {
    const result = await this.getActivities();
    if (result.success && result.data) {
      const filteredData = result.data.filter(activity => 
        activity.categories?.includes(category)
      );
      return { ...result, data: filteredData };
    }
    return result;
  },

  // student applications
  async createApplication(data: CreateApplicationRequest): Promise<ApiResponse<ActivityApplication>> {
    return httpClient.post<ActivityApplication>(API_ENDPOINTS.ACTIVITIES.APPLY, data);
  },

  async getUserApplications(): Promise<ApiResponse<ActivityApplication[]>> {
    return httpClient.get<ActivityApplication[]>(API_ENDPOINTS.ACTIVITIES.GETAPPLICATIONS);
  },

  async getApplicationDetail(id: string | number): Promise<ApiResponse<ActivityApplication>> {
    return httpClient.get<ActivityApplication>(API_ENDPOINTS.ACTIVITIES.APPLICATION_DETAIL(id));
  },

  async cancelApplication(id: string | number): Promise<ApiResponse<void>> {
    return httpClient.post<void>(API_ENDPOINTS.ACTIVITIES.CANCELAPPLICATION(id));
  },

  async getApprovedActivities(): Promise<ApiResponse<Activity[]>> {
    return httpClient.get<Activity[]>(API_ENDPOINTS.ACTIVITIES.APPROVEDAPPLICATION);
  },

  // organizer application reviews
  async getActivityApplications(activityId: string | number): Promise<ApiResponse<ActivityApplication[]>> {
    return httpClient.get<ActivityApplication[]>(API_ENDPOINTS.ACTIVITIES.EVENTAPPLICANTS(activityId));
  },

  async reviewApplication(applicationId: string | number, data: ReviewApplicationRequest): Promise<ApiResponse<ActivityApplication>> {
    return httpClient.post<ActivityApplication>(API_ENDPOINTS.ACTIVITIES.REVIEWAPPLICATION(applicationId), data);
  },
};