"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import FormFields from "./components/FormFields";
import ImageUploadSection from "./components/ImageUploadSection";
import { activitiesApi } from "../../lib/activities";
import { auth } from "../../lib/utils";
import { USER_ROLES, ENV } from "../../lib/constants";
import type { Activity } from "../../lib/types";
import HeroImage from "../components/HeroImage";
import Navbar from "../components/Navbar";
import { useModal } from "../components/Modal";

function ActivityFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showModal, hideModal } = useModal();
  
  const [activityId, setActivityId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [dateStart, setDateStart] = useState<string>("");
  const [dateEnd, setDateEnd] = useState<string>("");
  const [timeStart, setTimeStart] = useState<string>("00:00");
  const [timeEnd, setTimeEnd] = useState<string>("00:00");
  const [hour, setHour] = useState<number | "">("");
  const [maxParticipants, setMaxParticipants] = useState<number | "">("");
  const [categories, setCategories] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [cover, setCover] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [pictures, setPictures] = useState<File[]>([]);
  const [existingPosters, setExistingPosters] = useState<{ id?: number | string; url: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activityCreated, setActivityCreated] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setDebugInfo] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  
  useEffect(() => {
    const checkAuth = () => {
      try {
        const authenticated = auth.isAuthenticated();
        const role = auth.getUserRole();
        setIsAuthenticated(authenticated);
        setUserRole(role);
        
        if (!authenticated) {
          router.push('/login');
          return;
        }
        
        if (role !== USER_ROLES.ORGANIZER) {
          router.push('/');
          return;
        }
      } catch (error) {
        setDebugInfo(`Auth error: ${error}`);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const showModalRef = useRef(showModal);
  useEffect(() => {
    showModalRef.current = showModal;
  }, [showModal]);

  useEffect(() => {
    if (hasLoadedData) return;
    
    const loadActivityData = async () => {
      const editParam = searchParams.get('edit');
      const activityDataParam = searchParams.get('activityData');
      const savedActivityData = searchParams.get('savedActivityData');
      if (editParam && activityDataParam) {
        try {
          const activityData = JSON.parse(decodeURIComponent(activityDataParam)) as Activity;
          setIsEditMode(true);
          setActivityId(editParam);
          setTitle(activityData.title || "");
          setLocation(activityData.location || "");
          setDescription(activityData.description || "");
          setCategories(activityData.categories || []);
          setMaxParticipants(activityData.max_participants || "");
          setHour(activityData.hours_awarded || "");
          
          if (activityData.cover_image || activityData.cover_image_url) {
            setCoverUrl(normalizeUrl(activityData.cover_image || activityData.cover_image_url));
          }
          
          if (activityData.start_at) {
            const startDate = new Date(activityData.start_at);
            setDateStart(`${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`);
            setTimeStart(`${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`);
          }
          
          if (activityData.end_at) {
            const endDate = new Date(activityData.end_at);
            setDateEnd(`${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`);
            setTimeEnd(`${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`);
          }
          
          try {
            const posters = (activityData as unknown as { poster_images?: { id?: number; image?: string }[] })?.poster_images;
            if (Array.isArray(posters) && posters.length > 0) {
              setExistingPosters(posters.map(p => ({ id: p.id, url: normalizeUrl(p.image || '') || '' })));
            }
          } catch {
            console.warn('Failed to parse poster images');
          }
          
          setHasLoadedData(true);
        } catch {
          setTimeout(() => showModalRef.current("Error loading activity data"), 100);
        }
        return;
      }
      if (editParam && !activityDataParam) {
        try {
          const resp = await activitiesApi.getActivity(editParam);
          if (resp.success && resp.data) {
            const activityData = resp.data;
            setIsEditMode(true);
            setActivityId(editParam);
            setTitle(activityData.title || "");
            setLocation(activityData.location || "");
            setDescription(activityData.description || "");
            setCategories(activityData.categories || []);
            setMaxParticipants(activityData.max_participants || "");
            setHour(activityData.hours_awarded || "");
            if (activityData.start_at) {
              const startDate = new Date(activityData.start_at);
              setDateStart(`${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`);
              setTimeStart(`${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`);
            }
            
            if (activityData.end_at) {
              const endDate = new Date(activityData.end_at);
              setDateEnd(`${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`);
              setTimeEnd(`${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`);
            }
            
            if (activityData.cover_image || activityData.cover_image_url) {
              setCoverUrl(normalizeUrl(activityData.cover_image || activityData.cover_image_url));
            }
            
            const posterResp = await activitiesApi.getPosterImages(activityData.id!);
            if (posterResp.success && posterResp.data) {
              type PosterResp = { id?: number | string; image?: string };
              setExistingPosters((posterResp.data as PosterResp[]).map((p) => ({ id: p.id, url: normalizeUrl(p.image) as string })));
            }
          }
          setHasLoadedData(true);
        } catch {
          setTimeout(() => showModalRef.current("Unable to load activity"), 200);
        }
        return;
      }
      
      if (savedActivityData) {
        try {
          const parsedData = JSON.parse(decodeURIComponent(savedActivityData));
          setTitle(parsedData.title || "");
          setLocation(parsedData.location || "");
          setDateStart(parsedData.dateStart || "");
          setDateEnd(parsedData.dateEnd || "");
          setTimeStart(parsedData.timeStart || "00:00");
          setTimeEnd(parsedData.timeEnd || "00:00");
          setHour(parsedData.hour || "");
          setMaxParticipants(parsedData.maxParticipants || "");
          setCategories(parsedData.categories || []);
          setDescription(parsedData.description || "");
          setErrors({});
          
          const url = new URL(window.location.href);
          url.searchParams.delete('savedActivityData');
          window.history.replaceState({}, '', url.toString());
          
          setHasLoadedData(true);
        } catch (error) {
          console.error("Error restoring activity data:", error);
        }
      }
    };
    
    loadActivityData();
  }, [searchParams, hasLoadedData]);

  function normalizeUrl(url: string | null | undefined) {
    if (!url) return url ?? null;
    try {
      const parsed = new URL(url);
      return parsed.href;
    } catch {
      if (typeof url === 'string' && url.startsWith('/')) return `${ENV.API_BASE_URL.replace(/\/$/, '')}${url}`;
      return url as string;
    }
  }

  const handleDeleteClick = async () => {
    if (!activityId) {
      showModal("Cannot delete an activity that hasn't been created yet");
      return;
    }
    
    showModal("Are you sure you want to delete this activity?", {
      needDecision: true,
      icon: "trash",
      onConfirm: handleConfirmDeleteActivity,
    });
  };

  const handleConfirmDeleteActivity = async () => {
    setIsDeleting(true);
    
    try {
      const response = await activitiesApi.deleteActivity(activityId!);
      
      if (response.success) {
        showModal('Activity deleted successfully');
        setTimeout(() => router.push('/all-events'), 2000);
      } else {
        const errorMsg = response.error || '';
        const requiresAdmin = errorMsg.includes('Participants exist') || 
                            errorMsg.includes('deletion requires admin') ||
                            response.data?.requires_admin_for_delete;
        
        if (requiresAdmin) {
          setShowDeleteModal(true);
        } else {
          throw new Error(response.error || 'Failed to delete activity');
        }
      }
    } catch {
      showModal('Failed to delete activity');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeletionReason("");
  };

  const handleConfirmDelete = async () => {
    if (!deletionReason.trim()) {
      showModal("Please provide a reason for deletion");
      return;
    }

    if (!activityId) return;

    setIsDeleting(true);
    
    try {
      const deleteReqResponse = await activitiesApi.requestDeletion(parseInt(activityId), deletionReason.trim());
      
      if (deleteReqResponse.success) {
        showModal("Deletion request submitted successfully. Admin will review it.");
        setShowDeleteModal(false);
        setDeletionReason("");
        router.push(`/event-detail/${activityId}`);
      } else {
        throw new Error(deleteReqResponse.error || 'Failed to submit deletion request');
      }
    } catch {
      showModal("Failed to submit deletion request");
    } finally {
      setIsDeleting(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const now = new Date();
    
    if (!title.trim()) newErrors.title = "Title is required";
    if (!location.trim()) newErrors.location = "Location is required";
    if (!dateStart) newErrors.dateStart = "Start date is required";
    if (!dateEnd) newErrors.dateEnd = "End date is required";
    if (!timeStart) newErrors.timeStart = "Start time is required";
    if (!timeEnd) newErrors.timeEnd = "End time is required";

    if (dateStart && dateEnd && timeStart && timeEnd) {
      const startDateTime = new Date(`${dateStart}T${timeStart}`);
      const endDateTime = new Date(`${dateEnd}T${timeEnd}`);

      if (startDateTime < now) {
        newErrors.dateStart = "Start date can not be in the past";
      }

      if (endDateTime < now) {
        newErrors.dateEnd = "End date can not be in the past";
      } 

      if (endDateTime < startDateTime) {
        newErrors.dateEnd = "End date and time must be after start date and time";
      }

    } 
    if (!hour) newErrors.hour = "Hour is required";
    else if (Number(hour) < 1 || Number(hour) > 10) {
      newErrors.hour = "Hour must be between 1 and 10";
    }
    if (!maxParticipants) newErrors.maxParticipants = "Max participants required";
    else if (Number(maxParticipants) < 1) {
      newErrors.maxParticipants = "Must be at least 1";
    }
    if (categories.length === 0) newErrors.categories = "Select at least one category";
    if (!description.trim()) newErrors.description = "Description is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
  
    if (!isAuthenticated || userRole !== USER_ROLES.ORGANIZER) {
      showModal("You must be logged in as an organizer to manage activities");
      return;
    }

    if (activityCreated && !isEditMode) {
      showModal("Activity already created! Redirecting to homepage...");
      router.push('/');
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const formatLocalDateTime = (dateStr: string, timeStr: string) => {
        if (!dateStr || !timeStr) return '';
        const local = new Date(`${dateStr}T${timeStr}`);
        return local.toISOString();
      };

      const startDateTime = formatLocalDateTime(dateStart, timeStart);
      const endDateTime = formatLocalDateTime(dateEnd, timeEnd);
      const activityData = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        start_at: startDateTime,
        end_at: endDateTime,
        max_participants: Number(maxParticipants),
        hours_awarded: Number(hour),
        categories: categories,
      };

      let result;
      
      if (isEditMode && activityId) {
        result = await activitiesApi.updateActivity(parseInt(activityId), {
          ...activityData,
          cover,
          pictures,
        });
        
        if (result.success && result.data) {
          
          const successMsg = result.error 
            ? `Updated "${title}" activity! Warning: ${result.error}`
            : `Updated "${title}" activity successfully!`;
          
          router.push(`/all-events?success=${encodeURIComponent(successMsg)}`);
        } else {
          throw new Error(result.error || 'Failed to update activity');
        }
      } else {
        result = await activitiesApi.createActivity({
          ...activityData,
          cover,
          pictures,
        });
        
        if (result.success && result.data) {
          setActivityCreated(true);
          
          if (result.data.id) {
            setActivityId(result.data.id.toString());
          }
          const successMsg = result.error
            ? `Activity created! Warning: ${result.error}`
            : 'Activity created successfully!';
          
          showModal(successMsg, {
            dataTestId: "success-message",
            time: 1000
          });
          
          // Redirect immediately after showing modal
          setTimeout(() => {
            router.push(`/?success=${encodeURIComponent(successMsg)}`);
          }, 100);
        } else {
          throw new Error(result.error || 'Failed to create activity');
        }
      }
      
    } catch (error) {
      showModal(`Failed to ${isEditMode ? 'update' : 'create'} activity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExistingPoster = async (posterId: number | string) => {
    if (!activityId) {
      showModal('Cannot delete poster before activity is saved');
      return;
    }
    showModal("Are you sure you want to delete this poster image?", {
      needDecision: true,
      icon: "trash",
      onConfirm: () => handleConfirmDeletePoster(posterId),
    });
  };

  const handleConfirmDeletePoster = async (posterId: number | string) => {
    try {
      const resp = await activitiesApi.deletePosterImage(parseInt(activityId!), posterId);
      if (resp.success) {
        setExistingPosters((prev) => prev.filter((p) => String(p.id) !== String(posterId)));
        showModal('Poster deleted');
      } else {
        throw new Error(resp.error || 'Failed to delete poster');
      }
    } catch {
      showModal('Failed to delete poster');
    }
  };

  const handleCancel = () => {
    showModal("Are you sure you want to cancel? Any unsaved changes will be lost.", {
      needDecision: true,
      icon: "x",
      onConfirm: () => {
        hideModal();
        if (isEditMode && activityId) {
          router.push(`/event-detail/${activityId}`);
        } else {
          router.push('/');
        }
      },
    });
  };

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []);

  const handleLocationChange = useCallback((value: string) => {
    setLocation(value);
    clearError("location");
  }, [clearError]);

  const handleDateStartChange = useCallback((value: string) => {
    setDateStart(value);
    clearError("dateStart");
  }, [clearError]);

  const handleDateEndChange = useCallback((value: string) => {
    setDateEnd(value);
    clearError("dateEnd");
  }, [clearError]);

  const handleTimeStartChange = useCallback((value: string) => {
    setTimeStart(value);
    clearError("timeStart");
  }, [clearError]);

  const handleTimeEndChange = useCallback((value: string) => {
    setTimeEnd(value);
    clearError("timeEnd");
  }, [clearError]);

  const handleHourChange = useCallback((value: number | "") => {
    setHour(value);
    clearError("hour");
  }, [clearError]);

  const handleMaxParticipantsChange = useCallback((value: number | "") => {
    setMaxParticipants(value);
    clearError("maxParticipants");
  }, [clearError]);

  const handleCategoriesChange = useCallback((value: string[]) => {
    setCategories(value);
    clearError("categories");
  }, [clearError]);

  const handleDescriptionChange = useCallback((value: string) => {
    setDescription(value);
    clearError("description");
  }, [clearError]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('ESC pressed - forcing modal close');
        setShowDeleteModal(false);
        hideModal();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [hideModal]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || userRole !== USER_ROLES.ORGANIZER) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Access denied. Organizer role required.</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <HeroImage containerHeight="100px" mountainHeight="120px" />
      <Navbar />

        <div className="max-w-5xl mx-auto bg-white shadow space-y-2 rounded-xl p-6 py-7 mt-13">
          
          {searchParams.get('savedActivityData') && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">
                You can continue editing your activity.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <input
              type="text"
              placeholder="Input Activity Title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                clearError("title");
              }}
              data-testid="activity-title-input"
              className="text-2xl font-semibold border-b focus:outline-none w-full mr-4"
            />
            
            <button 
              onClick={handleDeleteClick}
              className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2 h-10 
                     text-sm sm:text-base text-red-600 border border-red-600 
                     rounded-lg hover:bg-red-50 focus:outline-none 
                     focus:ring-2 focus:ring-red-300 cursor-pointer shrink-0"
              disabled={isSubmitting}
            >
              <Trash2 size={16} /> 
              <span className="hidden sm:inline" data-testid="delete-activity-button">Delete Activity</span>
            </button>
          </div>
          {errors.title && <p className="text-red-600 text-sm" data-testid="title-error">{errors.title}</p>}

          <ImageUploadSection
            cover={cover}
            coverUrl={coverUrl}
            pictures={pictures}
            existingPosters={existingPosters}
            onCoverChange={(file) => {
              setCover(file);
              if (!file) setCoverUrl(null);
            }}
            onPicturesChange={setPictures}
            onDeleteExistingPoster={handleDeleteExistingPoster}
            coverError={errors.cover}
          />

          <FormFields
            location={location}
            dateStart={dateStart}
            dateEnd={dateEnd}
            timeStart={timeStart}
            timeEnd={timeEnd}
            hour={hour}
            maxParticipants={maxParticipants}
            categories={categories}
            description={description}
            onLocationChange={handleLocationChange}
            onDateStartChange={handleDateStartChange}
            onDateEndChange={handleDateEndChange}
            onTimeStartChange={handleTimeStartChange}
            onTimeEndChange={handleTimeEndChange}
            onHourChange={handleHourChange}
            onMaxParticipantsChange={handleMaxParticipantsChange}
            onCategoriesChange={handleCategoriesChange}
            onDescriptionChange={handleDescriptionChange}
            errors={errors}
          />

          <div className="flex justify-between pt-4 border-t mt-6">
            <button 
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-900 cursor-pointer px-6 py-2 rounded-lg border border-gray-300 hover:border-gray-400"
              disabled={isSubmitting}
              data-testid="cancel-create-activity-button"
            >
              Cancel
            </button>
            <button 
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
              onClick={handleSave}
              disabled={isSubmitting}
              data-testid="create-activity-button"
            >
              {isSubmitting ? 'Creating...' : (activityId ? 'Update Activity' : 'Create Activity')}
            </button>
          </div>
      </div>

      {showDeleteModal && (
        <div 
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm animate-fadeIn"
          onClick={handleCancelDelete}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 transform transition-all duration-300 ease-out scale-100 animate-slideUp border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Activity Has Participants</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  This activity has registered participants. Deletion requires admin approval. Please provide a clear reason for your deletion request.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Deletion Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl p-4 min-h-[140px] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none transition-all bg-gray-50 focus:bg-white"
                placeholder="e.g., Event canceled due to unforeseen circumstances..."
                disabled={isDeleting}
                autoFocus
                data-testid="deletion-reason-textarea"
              />
              <p className="mt-2 text-xs text-gray-500">
                {deletionReason.trim().length} characters
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-6 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting || !deletionReason.trim()}
                className="px-6 py-2.5 bg-linear-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Submitting...
                  </span>
                ) : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ActivityForm() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading activity form...</p>
        </div>
      </div>
    }>
      <ActivityFormContent />
    </Suspense>
  );
}