import type { DeletionRequestEvent } from '@/app/admin/events/components/AdminDeletionRequestCard';
// lib/activities.ts
import { httpClient } from './utils';
import { API_ENDPOINTS, ENV } from './constants';
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

// Paginated response for applications
interface ApplicationsPaginatedResponse {
  count: number;
  next?: string;
  previous?: string;
  results: ActivityApplication[];
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

function isApplicationsPaginatedResponse(data: unknown): data is ApplicationsPaginatedResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'results' in data &&
    Array.isArray((data as ApplicationsPaginatedResponse).results)
  );
}

function isApplicationsArray(data: unknown): data is ActivityApplication[] {
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
          console.log('Extracted paginated results:', activitiesData);
        } 
        // Handle direct array response
        else if (isActivityArray(response.data)) {
          activitiesData = response.data;
          console.log('Using direct array response:', activitiesData);
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
      console.error('Error in getActivities:', error);
      return { 
        success: false, 
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

   // Get Deletion Requests
  async getDeletionRequests(params?: { status?: string }): Promise<ApiResponse<DeletionRequestEvent[]>> {
    try {
      let url = API_ENDPOINTS.ACTIVITIES.DELETION_REQUESTS;
      if (params?.status) {
        url += `?status=${encodeURIComponent(params.status)}`;
      }
      const response = await httpClient.get<unknown>(url);

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
  async createActivity(data: CreateActivityData & { cover?: File | null; pictures?: File[] | null }): Promise<ApiResponse<Activity>> {
    // If no files attached, use JSON POST via httpClient
    const { cover, pictures, ...payload } = data;
    if (!cover && (!pictures || pictures.length === 0)) {
      return httpClient.post<Activity>(API_ENDPOINTS.ACTIVITIES.CREATE, payload);
    }

    // Build FormData for multipart upload
    const form = new FormData();
    // Append known fields explicitly to avoid any/implicit typings
    if ((payload as CreateActivityData).title) form.append('title', String((payload as CreateActivityData).title));
    if ((payload as CreateActivityData).description) form.append('description', String((payload as CreateActivityData).description));
    if ((payload as CreateActivityData).location) form.append('location', String((payload as CreateActivityData).location));
    if ((payload as CreateActivityData).start_at) form.append('start_at', String((payload as CreateActivityData).start_at));
    if ((payload as CreateActivityData).end_at) form.append('end_at', String((payload as CreateActivityData).end_at));
    if ((payload as CreateActivityData).max_participants !== undefined && (payload as CreateActivityData).max_participants !== null) form.append('max_participants', String((payload as CreateActivityData).max_participants));
    if ((payload as CreateActivityData).hours_awarded !== undefined && (payload as CreateActivityData).hours_awarded !== null) form.append('hours_awarded', String((payload as CreateActivityData).hours_awarded));
    if ((payload as CreateActivityData).categories) form.append('categories', JSON.stringify((payload as CreateActivityData).categories));

    if (cover) form.append('cover_image', cover);

    // Send multipart request to create activity. We use fetch directly to allow FormData
    try {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${ENV.API_BASE_URL}${API_ENDPOINTS.ACTIVITIES.CREATE}`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      });

      const text = await res.text();
      const dataRes = text ? JSON.parse(text) : null;
      if (!res.ok) {
        return { success: false, error: dataRes?.detail || dataRes?.message || JSON.stringify(dataRes) };
      }

      console.log('Activity created successfully');

      // If posters provided, upload them to posters endpoint
      if (dataRes && dataRes.id && pictures && pictures.length > 0) {
        console.log(`Uploading ${pictures.length} poster image(s) for new activity ${dataRes.id}...`);
        const uploadResult = await this.uploadPosterImages(dataRes.id, pictures);
        
        if (!uploadResult.success) {
          console.error('Poster upload failed:', uploadResult.error);
          // Return partial success - activity created but posters failed
          return {
            success: true,
            data: dataRes,
            error: `Activity created, but poster upload failed: ${uploadResult.error}`
          };
        }
      } else {
        console.log('No posters to upload for new activity');
      }

      return { success: true, data: dataRes };
    } catch (error) {
      console.error('createActivity (multipart) error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },

  // Update activity
  async updateActivity(id: string | number, data: Partial<Activity> & { cover?: File | null; pictures?: File[] | null }): Promise<ApiResponse<Activity>> {
    const { cover, pictures, ...payload } = data;
    if (!cover && (!pictures || pictures.length === 0)) {
      return httpClient.put<Activity>(API_ENDPOINTS.ACTIVITIES.UPDATE(id), payload);
    }

    const form = new FormData();
  // Explicitly append expected fields (typed to Partial<Activity>)
  const p = payload as Partial<Activity>;
  if (p.title) form.append('title', String(p.title));
  if (p.description) form.append('description', String(p.description));
  if (p.location) form.append('location', String(p.location));
  if ((p as unknown as { start_at?: string }).start_at) form.append('start_at', String((p as unknown as { start_at?: string }).start_at));
  if ((p as unknown as { end_at?: string }).end_at) form.append('end_at', String((p as unknown as { end_at?: string }).end_at));
  if (p.max_participants !== undefined && p.max_participants !== null) form.append('max_participants', String(p.max_participants));
  if (p.hours_awarded !== undefined && p.hours_awarded !== null) form.append('hours_awarded', String(p.hours_awarded));
  if (p.categories) form.append('categories', JSON.stringify(p.categories));
    if (cover) form.append('cover_image', cover);

    try {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${ENV.API_BASE_URL}${API_ENDPOINTS.ACTIVITIES.UPDATE(id)}`, {
        method: 'PUT',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      });

      const text = await res.text();
      const dataRes = text ? JSON.parse(text) : null;
      if (!res.ok) {
        return { success: false, error: dataRes?.detail || dataRes?.message || JSON.stringify(dataRes) };
      }

      console.log('Activity updated successfully');

      // Upload poster images if provided
      if (pictures && pictures.length > 0 && dataRes && dataRes.id) {
        console.log(`Uploading ${pictures.length} poster image(s) for activity ${dataRes.id}...`);
        const uploadResult = await this.uploadPosterImages(dataRes.id, pictures);
        
        if (!uploadResult.success) {
          console.error('Poster upload failed:', uploadResult.error);
          // Return partial success - activity updated but posters failed
          return {
            success: true,
            data: dataRes,
            error: `Activity updated, but poster upload failed: ${uploadResult.error}`
          };
        }
      } else {
        console.log('No new posters to upload');
      }

      return { success: true, data: dataRes };
    } catch (error) {
      console.error('updateActivity (multipart) error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },

  // Upload poster images to activity posters endpoint (one request with multiple files)
  async uploadPosterImages(activityId: string | number, pictures: File[]): Promise<ApiResponse<unknown>> {
    if (!pictures || pictures.length === 0) return { success: true, data: null };

    try {
      const token = localStorage.getItem('access_token');
      
      // First, get existing posters to determine which order numbers are available
      console.log('Fetching existing posters to find available order slots...');
      
      // Add a delay to ensure database has been updated after any deletions
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const existingPostersResp = await this.getPosterImages(activityId);
      const existingOrders = new Set<number>();
      
      console.log('getPosterImages response:', {
        success: existingPostersResp.success,
        isArray: Array.isArray(existingPostersResp.data),
        dataLength: existingPostersResp.data?.length,
        data: existingPostersResp.data
      });
      
      if (existingPostersResp.success && existingPostersResp.data && Array.isArray(existingPostersResp.data)) {
        console.log('Processing existing posters:');
        existingPostersResp.data.forEach((poster, idx) => {
          console.log(`  Poster ${idx + 1}:`, {
            id: poster.id,
            order: poster.order,
            orderType: typeof poster.order,
            hasOrder: poster.order !== undefined && poster.order !== null
          });
          
          if (poster.order !== undefined && poster.order !== null) {
            existingOrders.add(poster.order);
            console.log(`  Added order ${poster.order} to existingOrders set`);
          } else {
            console.log(`  WARNING: Poster ${poster.id} has no order field`);
          }
        });
      } else {
        console.log('No existing posters found or data is not an array');
      }
      
      console.log('Final existingOrders set:', Array.from(existingOrders));
      
      // Find available order slots (1-4)
      const availableOrders: number[] = [];
      for (let i = 1; i <= 4; i++) {
        if (!existingOrders.has(i)) {
          availableOrders.push(i);
        }
      }
      
      console.log('Existing orders:', Array.from(existingOrders));
      console.log('Available orders:', availableOrders);
      console.log(`Uploading ${pictures.length} new poster(s)...`);
      
      // Validate we have enough slots
      if (pictures.length > availableOrders.length) {
        const error = `Cannot upload ${pictures.length} posters. Only ${availableOrders.length} slot(s) available.`;
        console.error('ERROR:', error);
        return { success: false, error };
      }
      
      // Post each image individually because the backend serializer expects a single image per POST
      for (let idx = 0; idx < pictures.length; idx++) {
        const pic = pictures[idx];
        const orderToUse = availableOrders[idx];
        const singleForm = new FormData();
        singleForm.append('image', pic);
        singleForm.append('order', String(orderToUse));

        console.log(`Uploading poster ${idx + 1}/${pictures.length} with order ${orderToUse}...`);

        const res = await fetch(`${ENV.API_BASE_URL}${API_ENDPOINTS.ACTIVITIES.POSTERS(activityId)}`, {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: singleForm,
        });

        const text = await res.text();
        console.log('Response status:', res.status, res.statusText);
        console.log('Response body (first 500 chars):', text.substring(0, 500));
        
        let dataRes = null;
        try {
          dataRes = text ? JSON.parse(text) : null;
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', parseError);
          console.error('Full response:', text);
          
          if (!res.ok) {
            return { 
              success: false, 
              error: `Server returned ${res.status} ${res.statusText}. Response is not valid JSON. Check server logs.` 
            };
          }
        }
        
        if (!res.ok) {
          console.error(`Failed to upload poster ${idx + 1} (order ${orderToUse}):`, dataRes);
          const errorMsg = dataRes?.detail || dataRes?.message || JSON.stringify(dataRes) || `Server error ${res.status}`;
          
          // If it's a duplicate key error, provide helpful context
          if (errorMsg.includes('unique') || errorMsg.includes('duplicate') || errorMsg.includes('already exists')) {
            console.error('Duplicate order conflict detected!');
            console.error('Tried to use order:', orderToUse);
            console.error('Existing orders found:', Array.from(existingOrders));
            return { 
              success: false, 
              error: `Order conflict: Poster order ${orderToUse} already exists. This might be a timing issue. Please try again.` 
            };
          }
          
          return { success: false, error: errorMsg };
        }
        console.log(`Poster ${idx + 1} uploaded successfully with order ${orderToUse}`);
      }
      
      console.log('All posters uploaded successfully!');
      return { success: true, data: null };
    } catch (error) {
      console.error('uploadPosterImages error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },

  // Get poster images for an activity
  async getPosterImages(activityId: string | number): Promise<ApiResponse<{ id: number; image: string; order?: number }[]>> {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${ENV.API_BASE_URL}${API_ENDPOINTS.ACTIVITIES.POSTERS(activityId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data?.detail || JSON.stringify(data), data: [] };
      }
      return { success: true, data: data };
    } catch (error) {
      console.error('getPosterImages error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Network error', data: [] };
    }
  },

  // Delete a poster image by id
  async deletePosterImage(activityId: string | number, posterId: string | number): Promise<ApiResponse<unknown>> {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${ENV.API_BASE_URL}${API_ENDPOINTS.ACTIVITIES.POSTERS(activityId)}${posterId}/`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.status === 204) return { success: true, data: null };
      const data = await res.json();
      return { success: res.ok, data: data, error: data?.detail || undefined };
    } catch (error) {
      console.error('deletePosterImage error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
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
    const response = await httpClient.get<ApplicationsPaginatedResponse | ActivityApplication[]>(API_ENDPOINTS.ACTIVITIES.GETAPPLICATIONS);
    if (response.success && response.data) {
      if (isApplicationsPaginatedResponse(response.data)) {
        return { success: true, data: response.data.results };
      }
      if (isApplicationsArray(response.data)) {
        return { success: true, data: response.data };
      }
    }
    return { success: response.success, data: [], error: response.error };
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
    const response = await httpClient.get<ApplicationsPaginatedResponse | ActivityApplication[]>(API_ENDPOINTS.ACTIVITIES.EVENTAPPLICANTS(activityId));
    if (response.success && response.data) {
      if (isApplicationsPaginatedResponse(response.data)) {
        return { success: true, data: response.data.results };
      }
      if (isApplicationsArray(response.data)) {
        return { success: true, data: response.data };
      }
    }
    return { success: response.success, data: [], error: response.error };
  },

  async reviewApplication(applicationId: string | number, data: ReviewApplicationRequest): Promise<ApiResponse<ActivityApplication>> {
    return httpClient.post<ActivityApplication>(API_ENDPOINTS.ACTIVITIES.REVIEWAPPLICATION(applicationId), data);
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