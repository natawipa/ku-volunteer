import type { DeletionRequestEvent } from '@/app/admin/events/components/AdminDeletionRequestCard';
import { httpClient } from './utils';
import { API_ENDPOINTS, ENV } from './constants';
import type { 
  Activity, 
  ApiResponse, 
  CreateApplicationRequest,
  ReviewApplicationRequest,
  ActivityApplication,
  CheckInRecord } from './types';

export interface CreateActivityData {
  title: string;
  description: string;
  location: string;
  start_at: string;
  end_at: string;
  max_participants?: number;
  hours_awarded?: number;
  categories: string[];
}

interface ActivityMetadata {
  top_levels: string[];
  compound_categories: string[];
  subcategories: Record<string, string[]>;
  categories_max: number;
}

interface ActivitiesPaginatedResponse {
  count: number;
  next?: string;
  previous?: string;
  results: Activity[];
}

interface ApplicationsPaginatedResponse {
  count: number;
  next?: string;
  previous?: string;
  results: ActivityApplication[];
}

function isPaginatedResponse(data: unknown): data is ActivitiesPaginatedResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'results' in data &&
    Array.isArray((data as ActivitiesPaginatedResponse).results)
  );
}

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

export const activitiesApi = {
  async getActivities(): Promise<ApiResponse<Activity[]>> {
    try {
      const response = await httpClient.get<ActivitiesPaginatedResponse | Activity[]>(API_ENDPOINTS.ACTIVITIES.LIST);
      
      if (response.success && response.data) {
        let activitiesData: Activity[] = [];
        
        if (isPaginatedResponse(response.data)) {
          activitiesData = response.data.results;
        } 
        else if (isActivityArray(response.data)) {
          activitiesData = response.data;
        }
        
        return {
          success: true,
          data: activitiesData
        };
      }
      
      return {
        success: response.success,
        data: [],
        error: response.error
      };
      
    } catch (error) {
      return { 
        success: false, 
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

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
          }
        }

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

        const mapped: DeletionRequestEvent[] = rawArray.map((item) => {
          const activityId = (item.activity as number | string | undefined);
          const activity = activityId !== undefined ? activityMap[activityId] : undefined;
          
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
      return { success: false, data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async getActivity(id: string | number): Promise<ApiResponse<Activity>> {
    return httpClient.get<Activity>(API_ENDPOINTS.ACTIVITIES.DETAIL(id));
  },

  async createActivity(data: CreateActivityData & { cover?: File | null; pictures?: File[] | null }): Promise<ApiResponse<Activity>> {
    const { cover, pictures, ...payload } = data;
    if (!cover && (!pictures || pictures.length === 0)) {
      return httpClient.post<Activity>(API_ENDPOINTS.ACTIVITIES.CREATE, payload);
    }

    const form = new FormData();
    const p = payload as CreateActivityData;
    
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
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      });

      const text = await res.text();

      if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
        return { 
          success: false, 
          error: `Server error ${res.status}. Backend returned HTML instead of JSON. Check server logs.` 
        };
      }

      let dataRes;
      try {
        dataRes = text ? JSON.parse(text) : null;
      } catch {
        return { 
          success: false, 
          error: `Invalid JSON response: ${text.substring(0, 200)}` 
        };
      }

      if (!res.ok) {
        return { success: false, error: dataRes?.detail || dataRes?.message || JSON.stringify(dataRes) };
      }

      if (pictures && pictures.length > 0 && dataRes.id) {
        const uploadResult = await this.uploadPosterImages(dataRes.id, pictures);
        
        if (!uploadResult.success) {
          return {
            success: true,
            data: dataRes,
            error: `Activity created, but poster upload failed: ${uploadResult.error}`
          };
        }
      }
      
      return { success: true, data: dataRes };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },

  async updateActivity(id: string | number, data: Partial<Activity> & { cover?: File | null; pictures?: File[] | null }): Promise<ApiResponse<Activity>> {
    const { cover, pictures, ...payload } = data;
    const form = new FormData();
    const p = payload as Partial<Activity>;
    if (p.title) form.append('title', String(p.title));
    if (p.description) form.append('description', String(p.description));
    if (p.location) form.append('location', String(p.location));
    
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

      const res = await fetch(`${ENV.API_BASE_URL}${API_ENDPOINTS.ACTIVITIES.UPDATE(id)}`, {
        method: 'PUT',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      });

      const text = await res.text();
      
      let dataRes = null;
      try {
        dataRes = text ? JSON.parse(text) : null;
      } catch {
        return { 
          success: false, 
          error: `Server returned invalid JSON: ${text.substring(0, 200)}` 
        };
      }

      if (!res.ok) {
        return { 
          success: false, 
          error: dataRes?.detail || dataRes?.message || `Server error ${res.status}` 
        };
      }
      if (pictures && pictures.length > 0) {
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
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },

  async uploadPosterImages(activityId: string | number, pictures: File[]): Promise<ApiResponse<unknown>> {
    if (!pictures || pictures.length === 0) return { success: true, data: null };

    try {
      const token = localStorage.getItem('access_token');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const existingPostersResp = await this.getPosterImages(activityId);
      const existingOrders = new Set<number>();
      
      if (existingPostersResp.success && existingPostersResp.data && Array.isArray(existingPostersResp.data)) {
        existingPostersResp.data.forEach((poster) => {
          if (poster.order !== undefined && poster.order !== null) {
            existingOrders.add(poster.order);
          } else {
          }
        });
      } else {
      }

      const availableOrders: number[] = [];
      for (let i = 1; i <= 4; i++) {
        if (!existingOrders.has(i)) {
          availableOrders.push(i);
        }
      }
      
      if (pictures.length > availableOrders.length) {
        const error = `Cannot upload ${pictures.length} posters. Only ${availableOrders.length} slot(s) available.`;
        return { success: false, error };
      }
      
      for (let idx = 0; idx < pictures.length; idx++) {
        const pic = pictures[idx];
        const orderToUse = availableOrders[idx];
        const singleForm = new FormData();
        singleForm.append('image', pic);
        singleForm.append('order', String(orderToUse));

        const res = await fetch(`${ENV.API_BASE_URL}${API_ENDPOINTS.ACTIVITIES.POSTERS(activityId)}`, {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: singleForm,
        });

        const text = await res.text();
        
        let dataRes = null;
        try {
          dataRes = text ? JSON.parse(text) : null;
        } catch {
          
          if (!res.ok) {
            return { 
              success: false, 
              error: `Server returned ${res.status} ${res.statusText}. Response is not valid JSON. Check server logs.` 
            };
          }
        }
        
        if (!res.ok) {
          const errorMsg = dataRes?.detail || dataRes?.message || JSON.stringify(dataRes) || `Server error ${res.status}`;
          
          if (errorMsg.includes('unique') || errorMsg.includes('duplicate') || errorMsg.includes('already exists')) {
            return { 
              success: false, 
              error: `Order conflict: Poster order ${orderToUse} already exists. This might be a timing issue. Please try again.` 
            };
          }
          
          return { success: false, error: errorMsg };
        }        
        if (idx < pictures.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },

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
      return { success: false, error: error instanceof Error ? error.message : 'Network error', data: [] };
    }
  },

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
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },

  async deleteActivity(id: string | number): Promise<ApiResponse<{ detail: string; requires_admin_for_delete?: boolean }>> {
    return httpClient.delete<{ detail: string; requires_admin_for_delete?: boolean }>(
      API_ENDPOINTS.ACTIVITIES.DELETE(id)
    );
  },

  async requestDeletion(activityId: number, reason: string): Promise<ApiResponse<DeletionRequestEvent>> {
    return httpClient.post<DeletionRequestEvent>(
      API_ENDPOINTS.ACTIVITIES.REQUEST_DELETE(activityId),
      { reason }
    );
  },

  async getActivityMetadata(): Promise<ApiResponse<ActivityMetadata>> {
    return httpClient.get<ActivityMetadata>(API_ENDPOINTS.ACTIVITIES.METADATA);
  },

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

  async getCheckInCode(activityId: string | number): Promise<ApiResponse<{ id: number; code: string; valid_date: string; created_at: string }>> {
    try {
      const token = localStorage.getItem('access_token');
      const endpoint = `/api/activities/${activityId}/checkin-code/`;
      const fullUrl = `${ENV.API_BASE_URL}${endpoint}`;
      
      const res = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const text = await res.text();

      if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
        return { success: false, error: `Endpoint not found (${res.status}). Check your backend URL.` };
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch{
        return { success: false, error: `Invalid JSON response: ${text.substring(0, 100)}` };
      }

      if (!res.ok) {
        return { success: false, error: data?.detail || data?.error || `HTTP ${res.status}` };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },

  async submitCheckIn(activityId: string | number, code: string): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    try {
      const token = localStorage.getItem('access_token');
      const endpoint = `/api/activities/${activityId}/checkin/`;
      const fullUrl = `${ENV.API_BASE_URL}${endpoint}`;
      
      const res = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ code }),
      });

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        return { success: false, error: `Invalid JSON: ${text.substring(0, 100)} ${parseError}` };
      }
      if (!res.ok) {
        return { success: false, error: data?.detail || data?.error || `HTTP ${res.status}` };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },

    async getCheckInList(activityId: string | number): Promise<ApiResponse<CheckInRecord[]>> {
    try {
      const token = localStorage.getItem('access_token');
      const endpoint = `/api/activities/${activityId}/checkin-list/`;
      const fullUrl = `${ENV.API_BASE_URL}${endpoint}`;
      
      const res = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const text = await res.text();
     if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
        return { success: false, error: `Endpoint not found (${res.status}). Check your backend URL.`, data: [] };
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return { success: false, error: `Invalid JSON response: ${text.substring(0, 100)}`, data: [] };
      }

      if (!res.ok) {
        return { success: false, error: data?.detail || data?.error || `HTTP ${res.status}`, data: [] };
      }

      let checkInList: CheckInRecord[] = [];
      
      if (Array.isArray(data)) {
        checkInList = data;
      } else if (data?.results && Array.isArray(data.results)) {
        checkInList = data.results;
      }
      return { success: true, data: checkInList };
    } catch (error) {
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