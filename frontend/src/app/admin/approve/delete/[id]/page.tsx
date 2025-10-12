"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { PlusIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import { activitiesApi } from "@/lib/activities";
import type { Activity } from '@/lib/types';
import { ENV, API_ENDPOINTS } from "@/lib/constants";
import type { DeletionRequestEvent } from "@/app/admin/events/components/AdminDeletionRequestCard";

interface ModerationResponse { detail: string }
interface PageProps { params: Promise<{ id: string }> }

export default function Page({ params }: PageProps) {
  // Resolve promised params in effect to keep component synchronous (cannot mark client component async)
  const [eventId, setEventId] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    Promise.resolve(params).then(p => { if (active) setEventId(parseInt(p.id, 10)); });
    return () => { active = false; };
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveChecked, setApproveChecked] = useState(false);
  const [rejectChecked, setRejectChecked] = useState(false);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [deletionRequest, setDeletionRequest] = useState<DeletionRequestEvent | null>(null);

  // Fetch activity when eventId resolved
  useEffect(() => {
  if (eventId == null) return;
  let mounted = true;

  const fetchRequests = async () => {
    try {
      // 1️⃣ Fetch all deletion requests
      const reqRes = await activitiesApi.getDeletionRequests();
      if (!mounted) return;

      if (!reqRes.success || !Array.isArray(reqRes.data)) {
        setError(reqRes.error || "Failed to load deletion requests");
        setLoading(false);
        return;
      }

      // 2️⃣ Find the specific deletion request
      const req = reqRes.data.find(r => r.id === eventId);
      if (!req) {
        setError("Deletion request not found");
        setLoading(false);
        return;
      }

      setDeletionRequest(req);

      // 3️⃣ Fetch the related activity by its foreign key
      const actRes = await activitiesApi.getActivity(req.activity);
      if (actRes.success && actRes.data) {
        setActivity(actRes.data);
      } else {
        setError("Related activity not found");
      }

    } catch {
      setError("Failed to load data");
    } finally {
      if (mounted) setLoading(false);
    }
  };

  fetchRequests();

  return () => { mounted = false; };
}, [eventId]);


  if (eventId == null) {
    return <p className="text-center mt-10 text-gray-600">Resolving activity...</p>;
  }
  if (loading) return <p className="text-center mt-10 text-gray-600">Loading activity...</p>;
  if (!activity) return <p className="text-center mt-10">{error || 'Event not found'}</p>;

  const legacyEvent = {
    id: activity?.id,
    title: activity?.title || "Untitled",
    reason: deletionRequest?.reason || "",
    image: activity?.cover_image_url || "/titleExample.jpg",
    post: new Date(activity?.created_at || Date.now()).toLocaleDateString('en-GB'),
    start_at: new Date(activity?.start_at || Date.now()).toLocaleDateString('en-GB'),
    end_at: new Date(activity?.end_at || Date.now()).toLocaleDateString('en-GB'),
    location: activity?.location || "Unknown",
    categories: activity?.categories || [],
    max_participants: activity?.max_participants || 0,
    organizer_name: activity?.organizer_name || "Organizer",
    additionalImages: ["/titleExample.jpg", "/titleExample2.jpg"],
    description: activity?.description || "No description"
  };

  const moderate = async (action: 'approve' | 'reject') => {
    if (!activity) return;
    if (action === 'reject' && !rejectReason.trim()) {
      setMessage('Please provide a rejection reason.');
      return;
    }
    
    console.log('🔄 Starting moderation:', { action, activityId: activity.id, reason: rejectReason });
    setActionLoading(true);
    setMessage(null);
    
    try {
      const endpoint = `${ENV.API_BASE_URL}${API_ENDPOINTS.ACTIVITIES.MODERATION_REVIEW(activity.id)}`;
      console.log('🌐 Moderation endpoint:', endpoint);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      console.log('🔑 Auth token exists:', !!token);
      
      const requestBody = { action, reason: rejectReason };
      console.log('📤 Request payload:', requestBody);
      
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('📡 Response status:', resp.status);
      console.log('📡 Response ok:', resp.ok);
      
      const responseText = await resp.text();
      console.log('📄 Raw response:', responseText);
      
      let data: ModerationResponse;
      try {
        data = responseText ? JSON.parse(responseText) : { detail: 'Empty response' };
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        setMessage('Invalid response from server');
        return;
      }
      
      if (!resp.ok) {
        console.error('❌ Moderation failed:', data);
        setMessage(data.detail || `Moderation failed (${resp.status})`);
      } else {
        console.log('✅ Moderation successful:', data);
        setMessage(data.detail);
        const refresh = await activitiesApi.getActivity(activity.id);
        if (refresh.success && refresh.data) setActivity(refresh.data);
        setApproveChecked(false); setRejectChecked(false); setRejectReason('');
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      setMessage(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // --- UI ---
  return (
    <div className="relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#DAE9DC] to-white h-[220px]"></div>

      {/* Mountain background */}
      <Image
        src="/mountain.svg"
        alt="mountain"
        width={920}
        height={410}
        className="w-full h-[200px] absolute inset-0 top-0 object-cover"
      />

      <div className="relative p-6">
        {/* Header */}
        <header className="flex justify-between items-center sticky top-0 z-10 mb-6 bg-[#DAE9DC]/10">
          <Image src="/Logo_Kasetsart.svg" alt="Small Logo" width={64} height={64} />
          <nav className="flex items-center space-x-8">
            <Link href="/document">Document</Link>
            <Link href="/all-events">All Event</Link>
            <Link href="/new" className="btn bg-[#215701] text-white px-2 py-2 rounded hover:bg-[#00361C]">
              <div className="flex items-center">
                <PlusIcon className="w-4 h-4 mr-2" />
                <span>New</span>
              </div>
            </Link>
            <Link href="/profile">
              <UserCircleIcon className="w-10 h-10 text-[#215701] hover:text-[#00361C]" />
            </Link>
          </nav>
        </header>

        {/* Event Detail Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 mt-20 lg:mt-32">
          <h1 className="text-3xl font-bold mb-4 text-center">{legacyEvent.title}</h1>

          <Image src={legacyEvent.image} alt={legacyEvent.title} width={500} height={310} className="w-3/4 mx-auto object-cover" />

          <div className="p-6 space-y-6">
            {/* Event Info */}
            <div className="bg-green-50 rounded-lg p-6 shadow">
              <div className="mb-4">
                <p><strong>Posted at:</strong> {legacyEvent.post}</p>
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <p><strong>Date:</strong> {legacyEvent.start_at} - {legacyEvent.end_at}</p>
                <p><strong>Location:</strong> {legacyEvent.location}</p>
                <p><strong>Type:</strong> {legacyEvent.categories.join(", ")}</p>
                <p><strong>Capacity:</strong> {legacyEvent.max_participants} people</p>
                <p><strong>Organizer:</strong> {legacyEvent.organizer_name}</p>
              </div>
            </div>

            {/* Gallery */}
            {legacyEvent.additionalImages.length > 0 && (
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex space-x-4 p-2 md:justify-center">
                  {legacyEvent.additionalImages.map((img: string, index: number) => (
                    <Image
                      key={index}
                      src={img}
                      alt={`Event image ${index + 1}`}
                      width={180}
                      height={120}
                      className="rounded-lg object-cover shadow-md hover:scale-105 transition-transform"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <h2 className="text-lg font-semibold">Event Description</h2>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-700">{legacyEvent.description}</p>
            </div>

            {/* Deletion Reason */}
            <h2 className="text-lg font-semibold">Reason for Deletion</h2>
            <div className="bg-red-50 rounded-lg shadow p-4 min-h-[200px]">
              <p className="text-gray-700">{legacyEvent.reason}</p>
            </div>

            {/* Moderation Controls */}
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-green-600">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={approveChecked}
                  onChange={() => {
                    setApproveChecked(true);
                    setRejectChecked(false);
                  }}
                />
                Approve Deletion
              </label>
              <label className="flex items-center gap-2 text-red-600">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={rejectChecked}
                  onChange={() => {
                    setRejectChecked(true);
                    setApproveChecked(false);
                  }}
                />
                Reject Deletion
              </label>
              {rejectChecked && (
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500"
                  placeholder="Add reason for rejection..."
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t mt-6">
              <button className="text-gray-600 hover:text-gray-900">Cancel</button>
              <button
                disabled={actionLoading}
                onClick={() =>
                  moderate(approveChecked ? "approve" : rejectChecked ? "reject" : "approve")
                }
                className={`px-6 py-2 rounded-lg text-white ${
                  approveChecked
                    ? "bg-green-600 hover:bg-green-700"
                    : rejectChecked
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {actionLoading ? "Submitting..." : "Submit"}
              </button>
            </div>

            {message && <p className="mt-4 text-blue-600">{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
