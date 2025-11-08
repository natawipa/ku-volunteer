"use client";

import { useState, useEffect, Suspense} from "react";
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


// Move the main content to a separate component
function ActivityFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activityId, setActivityId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [dateStart, setDateStart] = useState<string>("");
  const [dateEnd, setDateEnd] = useState<string>("");
  const [timeStart, setTimeStart] = useState<string>("00:00");
  const [timeEnd, setTimeEnd] = useState<string>("23:59");
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
  
  // Deletion modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const authenticated = auth.isAuthenticated();
        const role = auth.getUserRole();
        setIsAuthenticated(authenticated);
        setUserRole(role);
        
        console.log('New page auth check:', { authenticated, role });
        
        // Redirect if not authenticated or not organizer or admin
        if (!authenticated) {
          alert("Please log in to create an activity");
          router.push('/login');
          return;
        }
        
        if (role !== USER_ROLES.ORGANIZER && role!== USER_ROLES.ADMIN) {
          alert("Only organizers or admin can create activities");
          router.push('/');
          return;
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setDebugInfo(`Auth error: ${error}`);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    const editParam = searchParams.get('edit');
    const activityDataParam = searchParams.get('activityData');
    
    if (editParam && activityDataParam) {
      try {
        console.log('Entering edit mode for activity:', editParam);
        const activityData = JSON.parse(decodeURIComponent(activityDataParam)) as Activity;
        
        setIsEditMode(true);
        setActivityId(editParam);
        
        // Populate form with existing activity data
        setTitle(activityData.title || "");
        setLocation(activityData.location || "");
        setDescription(activityData.description || "");
        setCategories(activityData.categories || []);
        setMaxParticipants(activityData.max_participants || "");
        setHour(activityData.hours_awarded || "");
        // set existing cover image URL if available (normalize relative urls)
        if (activityData.cover_image || activityData.cover_image_url) {
          const raw = activityData.cover_image || activityData.cover_image_url;
          setCoverUrl(normalizeUrl(raw));
        } else {
          setCoverUrl(null);
        }
        
        // Format dates for input fields (YYYY-MM-DD)
        if (activityData.start_at) {
          const startDate = new Date(activityData.start_at);
          // Use UTC methods to avoid timezone conversion
          const year = startDate.getUTCFullYear();
          const month = String(startDate.getUTCMonth() + 1).padStart(2, '0');
          const day = String(startDate.getUTCDate()).padStart(2, '0');
          const hours = String(startDate.getUTCHours()).padStart(2, '0');
          const minutes = String(startDate.getUTCMinutes()).padStart(2, '0');
          
          setDateStart(`${year}-${month}-${day}`);
          setTimeStart(`${hours}:${minutes}`);
        }
        
        if (activityData.end_at) {
          const endDate = new Date(activityData.end_at);
          // Use UTC methods to avoid timezone conversion
          const year = endDate.getUTCFullYear();
          const month = String(endDate.getUTCMonth() + 1).padStart(2, '0');
          const day = String(endDate.getUTCDate()).padStart(2, '0');
          const hours = String(endDate.getUTCHours()).padStart(2, '0');
          const minutes = String(endDate.getUTCMinutes()).padStart(2, '0');
          
          setDateEnd(`${year}-${month}-${day}`);
          setTimeEnd(`${hours}:${minutes}`);
        }
        
        console.log('Activity data loaded for editing:', activityData);
        
        // Debug log to verify times
        console.log('Time debug:', {
          start_at: activityData.start_at,
          parsedStart: new Date(activityData.start_at),
          displayTimeStart: `${String(new Date(activityData.start_at).getUTCHours()).padStart(2, '0')}:${String(new Date(activityData.start_at).getUTCMinutes()).padStart(2, '0')}`,
          end_at: activityData.end_at,
          parsedEnd: new Date(activityData.end_at),
          displayTimeEnd: `${String(new Date(activityData.end_at).getUTCHours()).padStart(2, '0')}:${String(new Date(activityData.end_at).getUTCMinutes()).padStart(2, '0')}`
        });
        
        // load existing poster images if present on activityData
        try {
          const posters = (activityData as unknown as { poster_images?: { id?: number; image?: string }[] })?.poster_images;
          if (Array.isArray(posters) && posters.length > 0) {
            setExistingPosters(posters.map(p => ({ id: p.id, url: normalizeUrl(p.image || '') || '' }))); 
          } else {
            setExistingPosters([]);
          }
        } catch {
          console.warn('Failed to parse poster images from activityData');
        }
      } catch (error) {
        console.error('Error parsing activity data:', error);
        alert('Error loading activity data for editing');
      }
    }
    // If edit mode requested but no activityData param provided, fetch from API
    if (editParam && !activityDataParam) {
      (async () => {
        try {
          console.log('Fetching activity data for edit:', editParam);
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
              setDateStart(startDate.toISOString().split('T')[0]);
              setTimeStart(startDate.toTimeString().slice(0, 5));
            }
            if (activityData.end_at) {
              const endDate = new Date(activityData.end_at);
              setDateEnd(endDate.toISOString().split('T')[0]);
              setTimeEnd(endDate.toTimeString().slice(0, 5));
            }
            // set coverUrl from backend image field (normalize relative urls)
            if (activityData.cover_image || activityData.cover_image_url) {
              setCoverUrl(normalizeUrl(activityData.cover_image || activityData.cover_image_url));
            } else {
              setCoverUrl(null);
            }
            console.log('Loaded activity for edit:', activityData);
            // if posters not present in initial payload, fetch from API to be safe
            (async () => {
              try {
                if (activityData.id) {
                  const resp = await activitiesApi.getPosterImages(activityData.id);
                  if (resp.success && resp.data) {
                    type PosterResp = { id?: number | string; image?: string };
                    setExistingPosters((resp.data as PosterResp[]).map((p) => ({ id: p.id, url: normalizeUrl(p.image) as string })));
                  }
                }
              } catch {
                console.warn('Error fetching poster images for edit');
              }
            })();
          } else {
            console.warn('Failed to fetch activity for edit', resp.error);
            alert('Unable to load activity for editing');
          }
        } catch (error) {
          console.error('Error fetching activity:', error);
        }
      })();
    }
  }, [searchParams]);

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

  /**
   * restore activity data when cancel delete confirmation
   */
  useEffect(() => {
    try {
      const savedActivityData = searchParams.get('savedActivityData');
      if (savedActivityData) {
        const parsedData = JSON.parse(decodeURIComponent(savedActivityData));
        
        console.log("Restoring activity data from delete cancellation");
        
        // Restore all form data
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
        
        // Clear errors
        setErrors({});
        
        // Remove the URL parameter
        const url = new URL(window.location.href);
        url.searchParams.delete('savedActivityData');
        window.history.replaceState({}, '', url.toString());
      }
    } catch (error) {
      console.error("Error restoring activity data:", error);
    }
  }, [searchParams]);

  const handleDeleteClick = async () => {
    if (!activityId) {
      alert("Cannot delete an activity that hasn't been created yet");
      return;
    }
    
    if (!confirm('Are you sure you want to delete this activity?')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // Try to delete the activity
      const response = await activitiesApi.deleteActivity(activityId);
      
      if (response.success) {
        // Successfully deleted (no participants)
        alert('Activity deleted successfully');
        router.push('/all-events');
      } else {
        // Check if error message indicates participants exist
        const errorMsg = response.error || '';
        const requiresAdmin = errorMsg.includes('Participants exist') || 
                            errorMsg.includes('deletion requires admin') ||
                            response.data?.requires_admin_for_delete;
        
        if (requiresAdmin) {
          // Has participants - show modal for deletion request
          setShowDeleteModal(true);
        } else {
          // Other error
          throw new Error(response.error || 'Failed to delete activity');
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete activity: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
      alert('Please provide a reason for deletion');
      return;
    }

    if (!activityId) return;

    setIsDeleting(true);
    
    try {
      const deleteReqResponse = await activitiesApi.requestDeletion(parseInt(activityId), deletionReason.trim());
      
      if (deleteReqResponse.success) {
        alert('Deletion request submitted successfully. An admin will review it.');
        setShowDeleteModal(false);
        setDeletionReason("");
        router.push('/all-events');
      } else {
        throw new Error(deleteReqResponse.error || 'Failed to submit deletion request');
      }
    } catch (error) {
      console.error('Delete request error:', error);
      alert('Failed to submit deletion request: ' + (error instanceof Error ? error.message : 'Unknown error'));
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

      // Check if end date is in the past
      if (endDateTime < now) {
        newErrors.dateEnd = "End date can not be in the past";
      } 
      
      // Check if start date is in the past
      if (startDateTime < now) {
        newErrors.dateStart = "Start date can not be in the past";
      }

      // Check if end datetime is before start datetime
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
  
    if (!isAuthenticated || userRole !== USER_ROLES.ORGANIZER && userRole != USER_ROLES.ADMIN) {
      alert("You must be logged in as an organizer to manage activities");
      return;
    }

    // Prevent duplicate submissions
    if (activityCreated && !isEditMode) {
      alert("Activity already created! Redirecting to homepage...");
      router.push('/');
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const formatLocalDateTime = (dateStr: string, timeStr: string) => {
        // Create a local date and time, then convert to UTC by subtracting timezone offset
        const localDate = new Date(`${dateStr}T${timeStr}:00`);
        const offset = localDate.getTimezoneOffset() * 60000; // Convert minutes to milliseconds
        const utcDate = new Date(localDate.getTime() - offset);
        return utcDate.toISOString(); // Returns ISO string with UTC conversion
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
  
      console.log('Sending activity data to backend:', activityData);
      console.log('Mode:', isEditMode ? 'EDIT' : 'CREATE');
      console.log('Pictures to upload:', pictures.length, 'file(s)');
      console.log('Existing posters:', existingPosters.length, 'poster(s)');

      let result;
      
      if (isEditMode && activityId) {
        // Update existing activity (include files when present)
        console.log(`Updating activity ${activityId} with ${pictures.length} new poster(s)...`);
        result = await activitiesApi.updateActivity(parseInt(activityId), {
          ...activityData,
          cover,
          pictures,
        });
        console.log('Backend update response:', result);
        
        if (result.success && result.data) {
          console.log('Activity updated successfully:', result.data);
          
          // Show warning if there was a poster upload error
          if (result.error) {
            alert(`Activity updated!\n\nWarning: ${result.error}`);
          } else {
            alert('Activity updated successfully!');
          }
          
          router.push(`/event-detail/${activityId}`);
        } else {
          throw new Error(result.error || 'Failed to update activity');
        }
      } else {
        // Create new activity (include files when present)
        console.log(`Creating new activity with ${pictures.length} poster(s)...`);
        result = await activitiesApi.createActivity({
          ...activityData,
          cover,
          pictures,
        });
        console.log('Backend create response:', result);
        
        if (result.success && result.data) {
          console.log('Activity created successfully:', result.data);
          setActivityCreated(true);
          
          if (result.data.id) {
            setActivityId(result.data.id.toString());
          }
          
          // Show warning if there was a poster upload error
          if (result.error) {
            alert(`Activity created!\n\nWarning: ${result.error}`);
          } else {
            alert('Activity created successfully!');
          }
          
          router.push('/');
        } else {
          throw new Error(result.error || 'Failed to create activity');
        }
      }
      
    } catch (error) {
      console.error('Failed to save activity:', error);
      alert(`Failed to ${isEditMode ? 'update' : 'create'} activity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExistingPoster = async (posterId: number | string) => {
    if (!activityId) {
      alert('Cannot delete poster before activity is saved');
      return;
    }
    if (!confirm('Delete this poster image?')) return;
    try {
      const resp = await activitiesApi.deletePosterImage(parseInt(activityId), posterId);
      if (resp.success) {
  setExistingPosters((prev: { id?: number | string; url: string }[]) => prev.filter((p) => String(p.id) !== String(posterId)));
        alert('Poster deleted');
      } else {
        throw new Error(resp.error || 'Failed to delete poster');
      }
    } catch (error) {
      console.error('Error deleting poster:', error);
      alert('Failed to delete poster');
    }
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      if (isEditMode && activityId) {
        //back to the event detail page
        router.push(`/event-detail/${activityId}`);
      } else {
        // back to home for new activities
        router.push('/');
      }
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Show error if not authorized
  if (!isAuthenticated || userRole !== USER_ROLES.ORGANIZER && userRole !== USER_ROLES.ADMIN) {
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

      {/* Activity Form Container */}
        <div className="max-w-5xl mx-auto bg-white shadow space-y-2 rounded-xl p-6 py-7 mt-13">
          
          {/* Status message*/}
          {searchParams.get('savedActivityData') && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">
                You can continue editing your activity.
              </p>
            </div>
          )}

          {/* Header with title and delete button */}
          <div className="flex items-center justify-between mb-6">
            <input
              type="text"
              placeholder="Input Activity Title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                clearError("title");
              }}
              className="text-2xl font-semibold border-b focus:outline-none w-full mr-4"
            />
            
            <button 
              onClick={handleDeleteClick}
              className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2 h-10 
                     text-sm sm:text-base text-red-600 border border-red-600 
                     rounded-lg hover:bg-red-50 focus:outline-none 
                     focus:ring-2 focus:ring-red-300 cursor-pointer flex-shrink-0"
              disabled={isSubmitting}
            >
              <Trash2 size={16} /> 
              <span className="hidden sm:inline">Delete Activity</span>
            </button>
          </div>
          {errors.title && <p className="text-red-600 text-sm">{errors.title}</p>}

          {/* Image Upload Section - Optional for now */}
          <ImageUploadSection
            cover={cover}
            coverUrl={coverUrl}
            pictures={pictures}
            existingPosters={existingPosters}
            onCoverChange={(file) => {
              setCover(file);
              // if user cleared file, also clear coverUrl
              if (!file) setCoverUrl(null);
            }}
            onPicturesChange={setPictures}
            onDeleteExistingPoster={handleDeleteExistingPoster}
            coverError={errors.cover}
          />

          {/* Form Fields Section */}
          <FormFields
            // Form values
            title={title}
            location={location}
            dateStart={dateStart}
            dateEnd={dateEnd}
            timeStart={timeStart}
            timeEnd={timeEnd}
            hour={hour}
            maxParticipants={maxParticipants}
            categories={categories}
            description={description}
            // Form handlers
            onTitleChange={(value) => { setTitle(value); clearError("title"); }}
            onLocationChange={(value) => { setLocation(value); clearError("location"); }}
            onDateStartChange={(value) => { setDateStart(value); clearError("dateStart"); }}
            onDateEndChange={(value) => { setDateEnd(value); clearError("dateEnd"); }}
            onTimeStartChange={(value) => { setTimeStart(value); clearError("timeStart"); }}
            onTimeEndChange={(value) => { setTimeEnd(value); clearError("timeEnd"); }}
            onHourChange={(value) => { setHour(value); clearError("hour"); }}
            onMaxParticipantsChange={(value) => { setMaxParticipants(value); clearError("maxParticipants"); }}
            onCategoriesChange={(value) => { setCategories(value); clearError("categories"); }}
            onDescriptionChange={(value) => { setDescription(value); clearError("description"); }}
            // Errors
            errors={errors}
          />

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t mt-6">
            <button 
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-900 cursor-pointer px-6 py-2 rounded-lg border border-gray-300 hover:border-gray-400"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : (activityId ? 'Update Activity' : 'Create Activity')}
            </button>
          </div>
      </div>

      {/* Deletion Request Modal - Beautiful Popup */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm animate-fadeIn"
          onClick={handleCancelDelete}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 transform transition-all duration-300 ease-out scale-100 animate-slideUp border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Icon */}
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
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

            {/* Textarea */}
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
              />
              <p className="mt-2 text-xs text-gray-500">
                {deletionReason.trim().length} characters
              </p>
            </div>

            {/* Action Buttons */}
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
                className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
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