"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Header from "../components/Header";
import { useSearchParams, useRouter } from "next/navigation";
import HeroImage from "../components/HeroImage";
import Navbar from "../components/Navbar";

interface ActivityData { 
  id: string;
  title: string;
  location?: string;
  dateStart?: string;
  dateEnd?: string;
  hour?: number | "";
  maxParticipants?: number | "";
  categories?: string[];
  description?: string;
}

function DeleteConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [activityData, setActivityData] = useState<ActivityData | null>(null); // Changed from eventData
  const [activityName, setActivityName] = useState(""); // Changed from eventName
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<{
    title?: string;
    reason?: string;
  }>({});

  useEffect(() => {
    const activityDataParam = searchParams.get('activityData'); // CHANGED THIS LINE
    if (activityDataParam) {
      try {
        const parsedData: ActivityData = JSON.parse(decodeURIComponent(activityDataParam));
        setActivityData(parsedData);
        setActivityName(parsedData.title); // Auto-fill activity title
        console.log("Received activity data:", parsedData); // Debug log
      } catch (error) {
        console.error("Error parsing activity data:", error);
      }
    } else {
      console.log("No activityData found in URL"); // Debug log
    }
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: { title?: string; reason?: string } = {};
    
    if (!activityName.trim()) { 
      newErrors.title = "Please enter an activity title";
    }
    
    if (!reason.trim()) {
      newErrors.reason = "Please enter a reason for delete confirmation";
    } else if (reason.trim().length < 10) {
      newErrors.reason = "Reason must be at least 10 characters long";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const deleteRequestData = {
        activity: activityData || { title: activityName }, 
        reason: reason.trim(),
        timestamp: new Date().toISOString(),
        requestId: `del-req-${Date.now()}`
      };

      console.log("Delete Request Data:", JSON.stringify(deleteRequestData, null, 2));
      
      alert("Delete request submitted! (Check console for data)");
      // router.push('/');
    }
  };

  const handleCancel = () => {
    console.log("Cancelling delete - preserving activity data");
    
    if (activityData) {
      // Return to edit with  activity data 
      router.push(`/new?savedActivityData=${encodeURIComponent(JSON.stringify(activityData))}`);
    } else {
      window.history.back();
    }
  };

  return (

      <div className="relative pt-6 px-4">
          {/* Header */}
          <HeroImage />
          <Navbar />
          <div className="relative">
            <Header showBigLogo={true} />
          </div>
        
        {/* Delete Confirmation Form */}
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-8 mt-16">
          <h1 className="text-2xl font-semibold text-center mb-8">
            Delete Activity Confirmation
          </h1>

          {/* Activity preview */}
          {activityData && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-2">Activity to be deleted:</h3>
              <p className="text-sm text-yellow-700">
                <strong>{activityData.title}</strong>
                {activityData.location && ` • ${activityData.location}`}
                {activityData.dateStart && ` • ${activityData.dateStart}`}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Activity Field */}
            <div className="flex items-start gap-4">
              <label className="text-base font-medium pt-2 w-24 text-left">
                Activity
              </label>
              <div className="flex-1">
                <input
                  type="text"
                  value={activityName}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 cursor-not-allowed"
                  placeholder="Activity title will auto-fill"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This activity will be permanently deleted
                </p>
              </div>
            </div>

            {/* Reason Field */}
            <div className="flex items-start gap-4">
              <label className="text-base font-medium pt-2 w-24 text-left">
                Reason
              </label>
              <div className="flex-1">
                <textarea
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (errors.reason) {
                      setErrors({ ...errors, reason: undefined });
                    }
                  }}
                  rows={8}
                  className={`w-full border ${
                    errors.reason ? "border-red-500" : "border-gray-300"
                  } rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${
                    errors.reason ? "focus:ring-red-500" : "focus:ring-green-500"
                  } focus:border-transparent resize-none`}
                  placeholder="Enter reason for deletion (minimum 10 characters)"
                />
                {errors.reason && (
                  <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
                )}
                <div className={`text-sm mt-1 ${
                  reason.length > 0 && reason.length < 10 ? 'text-red-500' : 
                  reason.length >= 10 ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {reason.length}/10 characters minimum
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-between items-center pt-8 border-t border-gray-200 mt-8">
              <button
                type="button"
                onClick={handleCancel}
                className="text-gray-600 hover:text-gray-900 font-medium px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ← Cancel & Keep Editing
              </button>
              <button
                type="submit"
                className="bg-red-600 text-white px-8 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Confirm Delete
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}

export default function DeleteActivityConfirmation() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    }>
      <DeleteConfirmationContent />
    </Suspense>
  );
}