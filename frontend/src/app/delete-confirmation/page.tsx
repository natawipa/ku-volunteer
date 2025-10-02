"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useSearchParams } from "next/navigation";

// Define TypeScript interface
interface EventData {
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

export default function DeleteEventConfirmation() {
  const searchParams = useSearchParams();
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [eventName, setEventName] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<{
    title?: string;
    reason?: string;
  }>({});

  // Get event from URL 
  useEffect(() => {
    const eventDataParam = searchParams.get('eventData');
    if (eventDataParam) {
      try {
        const parsedData: EventData = JSON.parse(decodeURIComponent(eventDataParam));
        setEventData(parsedData);
        setEventName(parsedData.title); // Auto-fill event title
      } catch (error) {
        console.error("Error parsing event data:", error);
      }
    }
  }, [searchParams]);

  // Mock event data structure (for reference)
  const mockEventData: EventData = {
    id: "event-001",
    title: "Annual Tech Conference 2024",
    location: "Convention Center",
    dateStart: "2024-12-15",
    dateEnd: "2024-12-16",
    hour: 8,
    maxParticipants: 500,
    categories: ["กิจกรรมมหาวิทยาลัย", "ด้านพัฒนาทักษะการคิดและการเรียนรู้"],
    description: "A conference about latest technologies and innovations"
  };

  const validateForm = () => {
    const newErrors: { title?: string; reason?: string } = {};
    
    if (!eventName.trim()) {
      newErrors.title = "Please enter an event title";
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
        event: eventData || { title: eventName },
        reason: reason.trim(),
        timestamp: new Date().toISOString(),
        requestId: `del-req-${Date.now()}`
      };

      console.log("Delete Request Data:", JSON.stringify(deleteRequestData, null, 2));
      
      // ex deleteEventAPI(deleteRequestData);
      
      console.log("Deleting event:", eventName, "Reason:", reason);
      console.log("Complete event data:", eventData);
    }
  };

  const handleCancel = () => {
    console.log("Cancelled");
    window.history.back();
  };

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-b from-[#DAE9DC] to-white h-[130px]"></div>

      <Image
        src="/mountain.svg"
        alt="mountain"
        width={1920}
        height={510}
        className="absolute inset-0 top-0 w-full h-[120px] object-cover pt-11"
      />

      <div className="relative p-6">
        <header className="flex justify-between items-center mb-8">
          <Image
            src="/Logo_Staff.svg"
            alt="Small Logo"
            width={64}
            height={64}
            className="object-cover"
          />
          <nav className="flex items-center space-x-8">
            <Link href="/document" className="relative border-b-1 border-transparent hover:border-black transition-all duration-200">
              Document
            </Link>
            <Link href="/all-events" className="relative border-b-1 border-transparent hover:border-black transition-all duration-200">
              All Event
            </Link>
            <Link href="/new" className="btn bg-[#215701] text-white px-3 py-2 rounded hover:bg-[#00361C] transition-all duration-200">
              + New
            </Link>
            <Link href="/profile">
              <UserCircleIcon className="w-10 h-10 text-[#215701] hover:text-[#00361C] transition-all duration-200" />
            </Link>
          </nav>
        </header>

        {/* Delete Confirmation Form */}
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-8 mt-16">
          <h1 className="text-2xl font-semibold text-center mb-8">
            Delete Event Confirmation
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Field - Now pre-filled and read-only */}
            <div className="flex items-start gap-4">
              <label className="text-base font-medium pt-2 w-24 text-left">
                Event
              </label>
              <div className="flex-1">
                <input
                  type="text"
                  value={eventName}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 cursor-not-allowed"
                  placeholder="Event title will auto-fill"
                />
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
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-green-600 text-white px-8 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Submit Delete Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}