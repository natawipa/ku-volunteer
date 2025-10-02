"use client";

import { useState, useEffect, Suspense } from "react";
import { Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useRouter, useSearchParams } from "next/navigation";

import FormFields from "./components/FormFields";
import ImageUploadSection from "./components/ImageUploadSection";
import { activitiesApi } from "../../lib/activities";
import { auth } from "../../lib/utils";

// Move the main content to a separate component
function ActivityFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activityId, setActivityId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [dateStart, setDateStart] = useState<string>("");
  const [dateEnd, setDateEnd] = useState<string>("");
  const [hour, setHour] = useState<number | "">("");
  const [maxParticipants, setMaxParticipants] = useState<number | "">("");
  const [categories, setCategories] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [cover, setCover] = useState<File | null>(null);
  const [pictures, setPictures] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activityCreated, setActivityCreated] = useState(false);

  /**
   * restore activity data when cancel delete confirmation
   */
  useEffect(() => {
    const savedActivityData = searchParams.get('savedActivityData');
    if (savedActivityData) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(savedActivityData));
        
        console.log("Restoring activity data from delete cancellation");
        
        // Restore all form data
        setTitle(parsedData.title || "");
        setLocation(parsedData.location || "");
        setDateStart(parsedData.dateStart || "");
        setDateEnd(parsedData.dateEnd || "");
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
        
      } catch (error) {
        console.error("Error restoring activity data:", error);
      }
    }
  }, [searchParams]);


  /**
   * activity data 
   */
  const activityData = {
    id: activityId || "mock-activity-id-" + Date.now(),
    title: title,
    location: location,
    dateStart: dateStart,
    dateEnd: dateEnd,
    hour: hour,
    maxParticipants: maxParticipants,
    categories: categories,
    description: description,
  };

  const handleDeleteClick = () => {
    if (!title.trim()) {
      alert("Please enter an activity title before deleting");
      return;
    }
    
    router.push(`/delete-confirmation?activityData=${encodeURIComponent(JSON.stringify(activityData))}`);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = "Title is required";
    if (!location.trim()) newErrors.location = "Location is required";
    if (!dateStart) newErrors.dateStart = "Start date is required";
    if (!dateEnd) newErrors.dateEnd = "End date is required";
    if (dateStart && dateEnd && new Date(dateStart) > new Date(dateEnd)) {
      newErrors.dateEnd = "End date must be after start date";
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
    // Removed cover image requirement since backend doesn't have it yet
    // if (!cover) newErrors.cover = "Cover image is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * REAL API save function
   */
  const handleSave = async () => {
    if (!validate()) return;
  
    if (!auth.isAuthenticated()) {
      alert("You must be logged in to create an activity");
      router.push('/login');
      return;
    }

    // Prevent duplicate submissions
    if (activityCreated) {
      alert("Activity already created! Redirecting to homepage...");
      router.push('/');
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const activityData = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        start_at: new Date(dateStart).toISOString(),
        end_at: new Date(dateEnd).toISOString(),
        max_participants: Number(maxParticipants),
        hours_awarded: Number(hour),
        categories: categories,
      };
  
      console.log('📤 Sending activity data to backend:', activityData);
  
      const result = await activitiesApi.createActivity(activityData);
      
      console.log('📥 Backend response:', result);
      
      if (result.success && result.data) {
        console.log('✅ Activity created successfully:', result.data);
        
        // Mark activity as created to prevent duplicates
        setActivityCreated(true); // UPDATE THIS LINE
        
        // FIX: Safely check for ID
        if (result.data.id) {
          setActivityId(result.data.id.toString());
        }
        // If no ID, that's okay - we still created the activity
        
        alert('Activity created successfully! It will be reviewed by admin before being published.');
        
        // Redirect to homepage
        router.push('/');
        
      } else {
        throw new Error(result.error || 'Failed to create activity');
      }
      
    } catch (error) {
      console.error('❌ Failed to create activity:', error);
      alert(`Failed to create activity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.push('/');
    }
  };

  return (
    <div className="relative">
      {/* Background styling */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#DAE9DC] to-white h-[130px]"></div>
      <Image
        src="/mountain.svg"
        alt="mountain"
        width={1920}
        height={510}
        className="absolute inset-0 top-0 w-full h-[120px] object-cover pt-11"
      />

      {/* Main content */}
      <div className="relative p-6">
        <header className="flex justify-between items-center">
          <Image
            src="/Logo_Staff.svg"
            alt="Small Logo"
            width={64}
            height={64}
            className="object-cover"
          />
          <nav className="flex items-center space-x-8">
            <Link
              href="/document"
              className="relative border-b-1 border-transparent hover:border-black transition-all duration-200"
            >
              Document
            </Link>
            <Link
              href="/all-activities"
              className="relative border-b-1 border-transparent hover:border-black transition-all duration-200"
            >
              All Activities
            </Link>
            <Link href="/profile">
              <UserCircleIcon className="w-10 h-10 text-[#215701] hover:text-[#00361C] transition-all duration-200" />
            </Link>
          </nav>
        </header>

        {/* Activity Form Container */}
        <div className="max-w-5xl mx-auto bg-white shadow space-y-2 rounded-xl p-6 py-7 mt-13">
          
          {/* Status message*/}
          {searchParams.get('savedActivityData') && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">
                ✅ Edit mode restored. You can continue editing your activity.
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
            pictures={pictures}
            onCoverChange={setCover}
            onPicturesChange={setPictures}
            coverError={errors.cover}
          />

          {/* Form Fields Section */}
          <FormFields
            // Form values
            title={title}
            location={location}
            dateStart={dateStart}
            dateEnd={dateEnd}
            hour={hour}
            maxParticipants={maxParticipants}
            categories={categories}
            description={description}
            // Form handlers
            onTitleChange={(value) => { setTitle(value); clearError("title"); }}
            onLocationChange={(value) => { setLocation(value); clearError("location"); }}
            onDateStartChange={(value) => { setDateStart(value); clearError("dateStart"); }}
            onDateEndChange={(value) => { setDateEnd(value); clearError("dateEnd"); }}
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
      </div>
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