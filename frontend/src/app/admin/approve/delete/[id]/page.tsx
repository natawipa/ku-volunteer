"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Header from "@/app/components/Header";
import { useRouter } from "next/navigation";
import { activitiesApi } from "@/lib/activities";
import type { Activity } from '@/lib/types';
import { ENV, API_ENDPOINTS } from "@/lib/constants";
import type { DeletionRequestEvent } from "@/app/admin/events/components/AdminDeletionRequestCard";
import Navbar from "@/app/components/Navbar";
import HeroImage from "@/app/components/HeroImage";

interface ModerationResponse { detail: string }
interface PageProps { params: Promise<{ id: string }> }

export default function Page({ params }: PageProps) {
  // Resolve promised params in effect to keep component synchronous (cannot mark client component async)
  const [eventId, setEventId] = useState<number | null>(null);
  const router = useRouter();
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
      // fetch all deletion requests
      const reqRes = await activitiesApi.getDeletionRequests();
      if (!mounted) return;

      if (!reqRes.success || !Array.isArray(reqRes.data)) {
        setError(reqRes.error || "Failed to load deletion requests");
        setLoading(false);
        return;
      }

      // find the specific deletion request by request id
      const requests = reqRes.data as DeletionRequestEvent[];
      const req = requests.find(
        (r) => Number(r.id) === Number(eventId) || Number(r.activity) === Number(eventId)
      );
      if (!req) {
        setError("Deletion request not found");
        setLoading(false);
        return;
      }

      setDeletionRequest(req);

      // fetch the related activity
      if (req.activity == null) {
        setError("Related activity not found");
        setLoading(false);
        return;
      }
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

  // Helper to ensure absolute URLs for images
    function normalizeUrl(url: string) {
      if (!url) return url;
      // If already absolute
      try {
        const parsed = new URL(url);
        return parsed.href;
      } catch {
        // Not absolute - make sure path starts with '/media/' and prefix with API base
        const base = ENV.API_BASE_URL.replace(/\/$/, '');
        let path = url.startsWith('/') ? url : `/${url}`;
        // If backend returns paths without media prefix, add it
        if (!path.startsWith('/media')) {
          path = path.startsWith('/') ? `/media${path}` : `/media/${path}`;
        }
        return `${base}${path}`;
      }
    }

  const legacyEvent = {
    id: activity?.id,
    title: activity?.title || "Untitled",
    reason: deletionRequest?.reason || "",
    post: new Date(activity?.created_at || Date.now()).toLocaleDateString('en-GB'),
    start_at: new Date(activity?.start_at || Date.now()).toLocaleDateString('en-GB'),
    end_at: new Date(activity?.end_at || Date.now()).toLocaleDateString('en-GB'),
    location: activity?.location || "Unknown",
    categories: activity?.categories || [],
    max_participants: activity?.max_participants || 0,
    organizer_name: activity?.organizer_name || "Organizer",
    description: activity?.description || "No description",
     // main image: prefer cover image, then first poster, then example
    image: (() => {
      const raw = activity.cover_image_url || activity.cover_image || null;
      if (raw && typeof raw === 'string') return normalizeUrl(raw);
      const posters = (activity as unknown as { poster_images?: { image?: string }[] })?.poster_images;
      if (Array.isArray(posters) && posters.length > 0) {
        const first = posters.find(p => typeof p.image === 'string' && p.image.length > 0);
        if (first && first.image) return normalizeUrl(first.image);
      }
      return "/default-event.jpg";
    })(),
    // gallery images: posters take precedence; if none, show no gallery
    additionalImages: (() => {
      const posters = (activity as unknown as { poster_images?: { image?: string }[] })?.poster_images;
      if (Array.isArray(posters) && posters.length > 0) {
        return posters
          .map(p => p.image)
          .filter((x): x is string => typeof x === 'string' && x.length > 0)
          .map(normalizeUrl);
      }
      return [];
    })()
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
      // Prefer reviewing the deletion request directly if we have it; fallback to activity moderation otherwise
      const reviewId = deletionRequest?.id ?? activity.id;
      const endpoint = `${ENV.API_BASE_URL}${deletionRequest ? API_ENDPOINTS.ACTIVITIES.DELETION_REQUEST_REVIEW(reviewId) : API_ENDPOINTS.ACTIVITIES.MODERATION_REVIEW(reviewId)}`;
      console.log('🌐 Moderation endpoint:', endpoint);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      console.log('🔑 Auth token exists:', !!token);
      
      // Backend for deletion request expects 'note' for reject reason
      const requestBody = deletionRequest ? { action, note: rejectReason } : { action, reason: rejectReason };
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
        if (deletionRequest && action === 'approve') {
          // Activity is deleted on the server. Navigate away.
          setActivity(null);
          setTimeout(() => router.push('/admin'), 300);
        } else if (deletionRequest && action === 'reject') {
          // Deletion request was rejected and removed on the server — navigate back to requests list
          setDeletionRequest(null);
          setActivity(null);
          setTimeout(() => router.push('/admin'), 300);
        } else {
          const refresh = await activitiesApi.getActivity(activity.id);
          if (refresh.success && refresh.data) setActivity(refresh.data);
        }
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
      <Navbar />
      <HeroImage />
      <Header showBigLogo={true}/>

        {/* Event Detail Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 mt-20 lg:mt-32">
          <h1 className="text-3xl font-bold mb-4 text-center">{legacyEvent.title}</h1>

          <Image src={legacyEvent.image} alt={legacyEvent.title} width={500} height={310} className="w-3/4 mx-auto object-cover" unoptimized />

          <div className="p-6 space-y-6">
            {/* Event Info */}
            <div className="bg-green-50 rounded-lg p-6 shadow">
              <div className="mb-4">
                <p><strong>Posted at:</strong> {legacyEvent.post}</p>
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
              {/* For one-day activities */}
              {legacyEvent.start_at === legacyEvent.end_at ? (
                <p><strong>Date:</strong> {legacyEvent.start_at}</p>
              ) : (
                <p><strong>Date:</strong> {legacyEvent.start_at} - {legacyEvent.end_at}</p>
              )}                
                <p><strong>Location:</strong> {legacyEvent.location}</p>
                <p><strong>Type:</strong> {legacyEvent.categories.join(", ")}</p>
                <p><strong>Capacity:</strong> {legacyEvent.max_participants} people</p>
                <p><strong>Organizer:</strong> {legacyEvent.organizer_name}</p>
              </div>
            </div>

            {/* Gallery */}
            {legacyEvent.additionalImages.length > 0 && (
              <div className="relative w-full">
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex space-x-4 p-2 min-w-full md:justify-center">
                    {legacyEvent.additionalImages
                      ?.filter((i): i is string => typeof i === "string")
                      .map((img: string, index: number) => (
                        <div key={index} className="flex-shrink-0">
                          <Image
                            src={img}
                            alt={`Event image ${index + 1}`}
                            width={180}
                            height={120}
                            className="rounded-lg object-cover shadow-md hover:scale-105 transition-transform cursor-pointer"
                            unoptimized
                          />
                        </div>
                      ))}
                  </div>
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
                  id="approveCheck"
                  data-testid="approve-deletion-click"
                  className="w-4 h-4"
                  checked={approveChecked}
                  onChange={() => { 
                    setApproveChecked(v => !v); 
                    if (!approveChecked) { 
                      setRejectChecked(false); 
                      setRejectReason(''); 
                    } 
                  }}
                />
                Approve Deletion
              </label>
              <label className="flex items-center gap-2 text-red-600">
                <input
                  type="checkbox"
                  id="rejectCheck"
                  data-testid="rejectCheck"
                  className="w-4 h-4"
                  checked={rejectChecked}
                  onChange={() => {
                    const newRejectChecked = !rejectChecked;
                    setRejectChecked(newRejectChecked);
                    if (newRejectChecked) {
                      setApproveChecked(false);
                    } else {
                      setRejectReason('');
                    }
                  }}
                />
                Reject Deletion
              </label>
              {rejectChecked && (
                <div className="mt-3 ml-6 animate-slideDown">
                  <textarea
                    id="reject-reason-textarea"
                    data-testid="reject-reason-textarea"
                    className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter reason for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    autoFocus
                  />
                  {!rejectReason.trim() && (
                    <p className="text-red-600 text-sm mt-1">
                      Rejection reason is required
                    </p>
                  )}
                </div>
            )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t mt-6">
              <button 
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 px-4 py-2"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading || (!approveChecked && !rejectChecked)}
                onClick={() => {
                  if (rejectChecked) {
                    moderate("reject");
                  } else if (approveChecked) {
                    moderate("approve");
                  }
                }}
                className={`px-6 py-2 rounded-lg text-white transition-all ${
                  approveChecked
                    ? "bg-green-600 hover:bg-green-700"
                    : rejectChecked
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {actionLoading ? "Submitting..." : rejectChecked ? "Reject Deletion" : approveChecked ? "Approve Deletion" : "Submit"}
              </button>
            </div>

            {message && <p className="mt-4 text-blue-600">{message}</p>}
          </div>
        </div>
      </div>
  );
}
