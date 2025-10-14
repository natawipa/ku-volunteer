import type { DeletionRequestEvent } from '@/app/admin/events/components/AdminDeletionRequestCard';
// lib/activities.ts
import { httpClient } from './utils';
import { API_ENDPOINTS } from './constants';
import type { Activity, ApiResponse } from './types';

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

   // Get Deletion Requests
  async getDeletionRequests(): Promise<ApiResponse<DeletionRequestEvent[]>> {
    try {
      const response = await httpClient.get<unknown>(API_ENDPOINTS.ACTIVITIES.DELETION_REQUESTS);

      if (response.success && response.data) {
        const data = response.data as Record<string, unknown> | unknown[];
        const rawArray: Record<string, unknown>[] =
          (typeof data === 'object' && data !== null && 'results' in data && Array.isArray((data as { results?: unknown[] }).results))
            ? (data as { results: unknown[] }).results as Record<string, unknown>[]
            : Array.isArray(data)
              ? data as Record<string, unknown>[]
              : [];

        if (rawArray.length === 0) {
          if (!(Array.isArray(data) || (typeof data === 'object' && data !== null && 'results' in data))) {
            console.error('Unexpected deletion request response format:', data);
          }
        }

        // Fetch activity details for each deletion request
            const activityIds = rawArray
              .map((item) => item.activity)
              .filter((id): id is string | number => (typeof id === 'string' || typeof id === 'number') && id !== null && id !== undefined);
        const activityResults = await Promise.all(activityIds.map((id) => this.getActivity(id)));
        const activityMap: Record<number | string, Activity> = {};
        activityResults.forEach((res, i) => {
          if (res.success && res.data) {
            activityMap[activityIds[i]] = res.data;
          }
        });

        // Map each item to DeletionRequestEvent shape
        const mapped: DeletionRequestEvent[] = rawArray.map((item) => {
        const activityId = (item.activity as number | string | undefined);
        const activity = activityId !== undefined ? activityMap[activityId] : undefined;
          return {
            id: item.id as number ?? 0,
            activity: activityId ?? 0,
            title: (item.activity_title as string) ?? activity?.title ?? '',
            description: activity?.description ?? '',
            category: activity?.categories ?? [],
            post: activity?.organizer_name ?? '',
            datestart: activity?.start_at ?? '',
            dateend: activity?.end_at ?? '',
            location: activity?.location ?? '',
            organizer: activity?.organizer_name ?? '',
            image: activity?.cover_image_url ?? '',
            reason: typeof item.reason === 'string' ? item.reason : '',
            capacity: activity?.max_participants ?? 0,
            additionalImages: [],
          } as DeletionRequestEvent;
        });

        return { success: true, data: mapped };
      }

      return { success: false, data: [], error: response.error };
    } catch (error) {
      console.error('❌ Error in getDeletionRequests:', error);
      return { success: false, data: [], error: error instanceof Error ? error.message : 'Unknown error' };
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

  // Get activities by organizer ID
  async getActivitiesByOrganizer(organizerId: number): Promise<ApiResponse<Activity[]>> {
    const result = await this.getActivities();
    if (result.success && result.data) {
      const filteredData = result.data.filter(activity => 
        activity.organizer_profile_id === organizerId
      );
      return { ...result, data: filteredData };
    }
    return result;
  },
};