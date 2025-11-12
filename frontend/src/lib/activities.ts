import type { DeletionRequestEvent } from '@/app/admin/events/components/AdminDeletionRequestCard';
// lib/activities.ts
import { httpClient } from './utils';
import { API_ENDPOINTS, ENV } from './constants';
import type { 
  Activity, 
  ApiResponse, 
  CreateApplicationRequest,
  ReviewApplicationRequest,
  ActivityApplication,
  CheckInRecord } from './types';

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

        // Fetch activity details only for requests where activity still exists (not null)
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
          
          // Use stored activity_title from the deletion request if activity is deleted (null)
          const title = (item.activity_title as string) || activity?.title || 'Deleted Activity';
          
          return {
            id: item.id as number ?? 0,
            activity: activityId ?? 0,
            title: title,
            description: activity?.description ?? '',
            category: activity?.categories ?? [],
            post: activity?.organizer_name ?? '',
            datestart: activity?.start_at ?? '',
            dateend: activity?.end_at ?? '',
            location: activity?.location ?? '',
            organizer: activity?.organizer_name ?? '',
            image: activity?.cover_image ?? activity?.cover_image_url ?? '/titleExample.jpg',
            reason: typeof item.reason === 'string' ? item.reason : '',
            capacity: activity?.max_participants ?? 0,
            additionalImages: [],
            status: typeof item.status === 'string' ? item.status : undefined,
            requested_at: typeof item.requested_at === 'string' ? item.requested_at : undefined,
            reviewed_at: typeof item.reviewed_at === 'string' ? item.reviewed_at : undefined,
            review_note: typeof item.review_note === 'string' ? item.review_note : undefined,
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
    const p = payload as CreateActivityData;
    
    console.log('🔍 Creating activity with data:', {
      title: p.title,
      description: p.description,
      location: p.location,
      start_at: p.start_at,
      end_at: p.end_at,
      max_participants: p.max_participants,
      hours_awarded: p.hours_awarded,
      categories: p.categories,
      hasCover: !!cover,
    });
    
    if (p.title) form.append('title', String(p.title));
    if (p.description) form.append('description', String(p.description));
    if (p.location) form.append('location', String(p.location));
    if (p.start_at) form.append('start_at', String(p.start_at));
    if (p.end_at) form.append('end_at', String(p.end_at));
    if (p.max_participants !== undefined && p.max_participants !== null) form.append('max_participants', String(p.max_participants));
    if (p.hours_awarded !== undefined && p.hours_awarded !== null) form.append('hours_awarded', String(p.hours_awarded));
    if (p.categories) form.append('categories', JSON.stringify(p.categories));

    if (cover) form.append('cover_image', cover);

    try {
      const token = localStorage.getItem('access_token');
      const endpoint = `${ENV.API_BASE_URL}${API_ENDPOINTS.ACTIVITIES.CREATE}`;
      
      console.log('Fetching endpoint:', endpoint);
      console.log('Token present:', !!token);
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      });

      console.log('Response status:', res.status, res.statusText);
      console.log('Response headers:', {
        contentType: res.headers.get('content-type'),
      });

      const text = await res.text();
      console.log('Response (first 1000 chars):', text.substring(0, 1000));

      // Check if response is HTML
      if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
        console.error('Backend returned HTML (likely 404 or 500 error)');
        console.error('Full HTML response:', text);
        return { 
          success: false, 
          error: `Server error ${res.status}. Backend returned HTML instead of JSON. Check server logs.` 
        };
      }

      let dataRes;
      try {
        dataRes = text ? JSON.parse(text) : null;
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError);
        return { 
          success: false, 
          error: `Invalid JSON response: ${text.substring(0, 200)}` 
        };
      }

      if (!res.ok) {
        console.error('API returned error:', dataRes);
        return { success: false, error: dataRes?.detail || dataRes?.message || JSON.stringify(dataRes) };
      }

      console.log('Activity created successfully');
      
      // Upload poster images if provided and activity was created successfully
      if (pictures && pictures.length > 0 && dataRes.id) {
        console.log(`Uploading ${pictures.length} poster image(s) for new activity ${dataRes.id}...`);
        const uploadResult = await this.uploadPosterImages(dataRes.id, pictures);
        
        if (!uploadResult.success) {
          console.warn('Poster upload failed:', uploadResult.error);
          return {
            success: true,
            data: dataRes,
            error: `Activity created, but poster upload failed: ${uploadResult.error}`
          };
        }
      }
      
      return { success: true, data: dataRes };
    } catch (error) {
      console.error('createActivity error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },

    // Update activity
  async updateActivity(id: string | number, data: Partial<Activity> & { cover?: File | null; pictures?: File[] | null }): Promise<ApiResponse<Activity>> {
    const { cover, pictures, ...payload } = data;
    const form = new FormData();
    const p = payload as Partial<Activity>;
    if (p.title) form.append('title', String(p.title));
    if (p.description) form.append('description', String(p.description));
    if (p.location) form.append('location', String(p.location));
    
    // Handle date fields 
    if (p.start_at) {
      const startDate = new Date(p.start_at);
      form.append('start_at', startDate.toISOString());
    }
    if (p.end_at) {
      const endDate = new Date(p.end_at);
      form.append('end_at', endDate.toISOString());
    }
    if (p.max_participants !== undefined && p.max_participants !== null) 
      form.append('max_participants', String(p.max_participants));
    if (p.hours_awarded !== undefined && p.hours_awarded !== null) 
      form.append('hours_awarded', String(p.hours_awarded));
    if (p.categories) 
      form.append('categories', JSON.stringify(p.categories));
    if (cover) form.append('cover_image', cover);

    try {
      const token = localStorage.getItem('access_token');
      console.log('Updating activity with FormData:', {
        title: p.title,
        start_at: p.start_at,
        end_at: p.end_at,
        hasCover: !!cover,
        hasPictures: !!(pictures && pictures.length > 0)
      });

      const res = await fetch(`${ENV.API_BASE_URL}${API_ENDPOINTS.ACTIVITIES.UPDATE(id)}`, {
        method: 'PUT',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      });

      const text = await res.text();
      console.log('Update response status:', res.status, res.statusText);
      
      let dataRes = null;
      try {
        dataRes = text ? JSON.parse(text) : null;
      } catch (parseError) {
        console.error('Failed to parse update response:', parseError);
        return { 
          success: false, 
          error: `Server returned invalid JSON: ${text.substring(0, 200)}` 
        };
      }

      if (!res.ok) {
        console.error('Update failed:', dataRes);
        return { 
          success: false, 
          error: dataRes?.detail || dataRes?.message || `Server error ${res.status}` 
        };
      }

      console.log('Activity updated successfully');

      // Upload poster images if provided
      if (pictures && pictures.length > 0) {
        console.log(`Uploading ${pictures.length} poster image(s)...`);
        const uploadResult = await this.uploadPosterImages(id, pictures);
        
        if (!uploadResult.success) {
          return {
            success: true,
            data: dataRes,
            error: `Activity updated, but poster upload failed: ${uploadResult.error}`
          };
        }
      }

      return { success: true, data: dataRes };
    } catch (error) {
      console.error('updateActivity error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },

  // Upload poster images to activity posters endpoint (one request with multiple files)
  async uploadPosterImages(activityId: string | number, pictures: File[]): Promise<ApiResponse<unknown>> {
    if (!pictures || pictures.length === 0) return { success: true, data: null };

    try {
      const token = localStorage.getItem('access_token');
      
      // get existing posters to determine which order numbers are available
      console.log('Fetching existing posters to find available order slots...');
      
      // Add a delay to ensure database has been updated
      await new Promise(resolve => setTimeout(resolve, 800));
      
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
      
      // Post each image individually
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
          
          // provide helpful context if its duplicate order error
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
        
        // Add small delay between uploads
        if (idx < pictures.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
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

  // Delete activity (returns 409 if participants exist, requiring deletion request)
  async deleteActivity(id: string | number): Promise<ApiResponse<{ detail: string; requires_admin_for_delete?: boolean }>> {
    return httpClient.delete<{ detail: string; requires_admin_for_delete?: boolean }>(
      API_ENDPOINTS.ACTIVITIES.DELETE(id)
    );
  },

  // Request deletion for activity (when participants exist)
  async requestDeletion(activityId: number, reason: string): Promise<ApiResponse<DeletionRequestEvent>> {
    return httpClient.post<DeletionRequestEvent>(
      API_ENDPOINTS.ACTIVITIES.REQUEST_DELETE(activityId),
      { reason }
    );
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

  // Get today's check-in code for an activity (organizer)
  async getCheckInCode(activityId: string | number): Promise<ApiResponse<{ id: number; code: string; valid_date: string; created_at: string }>> {
    try {
      const token = localStorage.getItem('access_token');
      const endpoint = `/api/activities/${activityId}/checkin-code/`;
      const fullUrl = `${ENV.API_BASE_URL}${endpoint}`;
      
      console.log('getCheckInCode DEBUG:', { 
        activityId, 
        endpoint, 
        fullUrl,
        hasToken: !!token,
        tokenLength: token?.length 
      });
      
      const res = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      console.log('Response status:', res.status);
      console.log('Response headers:', {
        contentType: res.headers.get('content-type'),
        contentLength: res.headers.get('content-length'),
      });

      const text = await res.text();
      console.log('Response text:', text.substring(0, 500));

      // if response is HTML (error page)
      if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
        console.error('Backend returned HTML (404 or 500):', text.substring(0, 200));
        return { success: false, error: `Endpoint not found (${res.status}). Check your backend URL.` };
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse JSON:', text);
        return { success: false, error: `Invalid JSON response: ${text.substring(0, 100)} ${parseError}` };
      }

      console.log('Parsed data:', data);

      if (!res.ok) {
        console.error('API error response:', data);
        return { success: false, error: data?.detail || data?.error || `HTTP ${res.status}` };
      }

      console.log('Check-in code fetched successfully:', data.code);
      return { success: true, data };
    } catch (error) {
      console.error('getCheckInCode exception:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },

  // Submit check-in code (student)
  async submitCheckIn(activityId: string | number, code: string): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    try {
      const token = localStorage.getItem('access_token');
      const endpoint = `/api/activities/${activityId}/checkin/`;
      const fullUrl = `${ENV.API_BASE_URL}${endpoint}`;
      
      console.log('submitCheckIn DEBUG:', { 
        activityId, 
        code,
        fullUrl,
        hasToken: !!token,
      });
      
      const res = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ code }),
      });

      console.log('Response status:', res.status);
      const text = await res.text();
      console.log('Response:', text.substring(0, 500));

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse JSON:', text);
        return { success: false, error: `Invalid JSON: ${text.substring(0, 100)} ${parseError}` };
      }

      console.log('Parsed check-in response:', data);

      if (!res.ok) {
        console.error('Check-in API error:', {
          status: res.status,
          detail: data?.detail,
          error: data?.error,
          fullData: data
        });
        return { success: false, error: data?.detail || data?.error || `HTTP ${res.status}` };
      }

      console.log('Check-in successful!', data);
      return { success: true, data };
    } catch (error) {
      console.error('submitCheckIn exception:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },

    async getCheckInList(activityId: string | number): Promise<ApiResponse<CheckInRecord[]>> {
    try {
      const token = localStorage.getItem('access_token');
      const endpoint = `/api/activities/${activityId}/checkin-list/`;
      const fullUrl = `${ENV.API_BASE_URL}${endpoint}`;
      
      console.log('getCheckInList DEBUG:', { 
        activityId, 
        endpoint, 
        fullUrl,
        hasToken: !!token,
      });
      
      const res = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      console.log('Response status:', res.status);
      console.log('Response headers:', {
        contentType: res.headers.get('content-type'),
        contentLength: res.headers.get('content-length'),
      });

      const text = await res.text();
      console.log('Response text:', text.substring(0, 500));
     if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
        console.error('Backend returned HTML (404 or 500):', text.substring(0, 200));
        return { success: false, error: `Endpoint not found (${res.status}). Check your backend URL.`, data: [] };
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse JSON:', text);
        return { success: false, error: `Invalid JSON response: ${text.substring(0, 100)} ${parseError}`, data: [] };
      }

      console.log('Parsed data:', data);

      if (!res.ok) {
        console.error('API error response:', data);
        return { success: false, error: data?.detail || data?.error || `HTTP ${res.status}`, data: [] };
      }

      // Handle both paginated and direct array responses
      let checkInList: CheckInRecord[] = [];
      
      if (Array.isArray(data)) {
        checkInList = data;
      } else if (data?.results && Array.isArray(data.results)) {
        checkInList = data.results;
      }
      console.log('Check-in list fetched successfully:', checkInList);
      return { success: true, data: checkInList };
    } catch (error) {
      console.error('getCheckInList exception:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Network error', data: [] };
    }
  },

  async getCheckInStatus(activityId: string | number): Promise<ApiResponse<CheckInRecord>> {
    return httpClient.get<CheckInRecord>(API_ENDPOINTS.ACTIVITIES.CHECK_IN_STATUS(activityId));
  },
  
  async getActivityCheckInRecords(activityId: string | number): Promise<ApiResponse<CheckInRecord[]>> {
    return httpClient.get<CheckInRecord[]>(API_ENDPOINTS.ACTIVITIES.CHECK_IN_LIST(activityId));
  },

};