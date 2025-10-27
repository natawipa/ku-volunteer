"use client";
import { PlusIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { activitiesApi } from '@/lib/activities';
import type { Activity } from '@/lib/types';
import { API_ENDPOINTS, ENV } from '@/lib/constants';

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

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveChecked, setApproveChecked] = useState(false);
  const [rejectChecked, setRejectChecked] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Fetch activity when eventId resolved
  useEffect(() => {
    if (eventId == null || Number.isNaN(eventId)) return;
    let cancelled = false;
    (async () => {
      const res = await activitiesApi.getActivity(eventId);
      if (cancelled) return;
      if (res.success && res.data) {
        setActivity(res.data);
      } else {
        setError(res.error || 'Failed to load activity');
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [eventId]);

  if (eventId == null) {
    return <p className="text-center mt-10 text-gray-600">Resolving activity...</p>;
  }
  if (loading) return <p className="text-center mt-10 text-gray-600">Loading activity...</p>;
  if (!activity) return <p className="text-center mt-10">{error || 'Event not found'}</p>;

  // Helper to normalize image URLs
  function normalizeUrl(url: string) {
      if (!url) return '/default-event.jpg';
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

  const status = activity.status || 'pending';
  const legacyEvent = {
    id: activity.id,
    title: activity.title,
    post: new Date(activity.created_at || Date.now()).toLocaleDateString('en-GB'),
    datestart: new Date(activity.start_at || Date.now()).toLocaleDateString('en-GB'),
    dateend: new Date(activity.end_at || Date.now()).toLocaleDateString('en-GB'),
    location: activity.location || 'Unknown',
    category: activity.categories || [],
    capacity: activity.max_participants || 0,
    organizer: activity.organizer_name || 'Organizer',
    description: activity.description || 'No description',
    reason: activity.rejection_reason || '',
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

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[#DAE9DC] to-white h-[220px]"></div>
      <Image src="/mountain.svg" alt="mountain" width={920} height={410} className="w-full h-[200px] absolute inset-0 top-0 object-cover" />
      <div className="relative p-6"> 
        <header className="flex justify-between items-center sticky top-0 z-10 mb-6 bg-[#DAE9DC]/10">
          <Image src="/logo-kasetsart.svg" alt="Small Logo" width={64} height={64} className="object-cover" />
          <nav className="flex items-center space-x-8">
            <Link href="/document" className="relative border-b-1 border-transparent hover:border-black transition-all duration-200">Document</Link>
            <Link href="/all-events" className="relative border-b-1 border-transparent hover:border-black transition-all duration-200">All Event</Link>
            <Link href="/new-event" className="btn bg-[#215701] text-white px-2 py-2 rounded hover:bg-[#00361C] transition-all duration-200">
              <div className="flex items-center"><PlusIcon className="w-4 h-4 mr-2" /><span className="mr-1">New</span></div>
            </Link>
            <Link href="/profile"><UserCircleIcon className="w-10 h-10 text-[#215701] hover:text-[#00361C] transition-all duration-200" /></Link>
          </nav>
        </header>

        {message && <div className="max-w-4xl mx-auto mb-4 bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded">{message}</div>}
        {error && <div className="max-w-4xl mx-auto mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded">{error}</div>}

        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 mt-20 lg:mt-32">
          <h1 className="text-3xl font-bold mb-4 text-center">{legacyEvent.title}</h1>
          <Image src={legacyEvent.image} alt={legacyEvent.title} width={500} height={310} className="w-3/4 mx-auto object-cover" unoptimized onLoadingComplete={(result) => console.debug('Loaded main image:', legacyEvent.image, result)} />
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="bg-green-50 rounded-lg p-6 shadow">
              <div className="mb-4">
                <p><strong>Post at:</strong> {legacyEvent.post}</p>
              </div>
              <div className="grid lg:grid-cols-2 md:grid-cols-2 gap-4">
                <p><strong>Date:</strong> {legacyEvent.datestart} - {legacyEvent.dateend}</p>
                <p><strong>Location:</strong> {legacyEvent.location}</p>
                <p><strong>Type:</strong> {legacyEvent.category.join(', ')}</p>
                <p><strong>Capacity:</strong> {legacyEvent.capacity} คน</p>
                <p><strong>Organizer:</strong> {legacyEvent.organizer}</p>
                <p><strong>Status:</strong> {status}</p>
              </div>
            </div>
            <div className="relative w-full">
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex space-x-4 p-2 min-w-full md:justify-center">
                  {legacyEvent.additionalImages?.map((img: string, index: number) => {
                    const resolved = normalizeUrl(img || '/default-event.jpg');
                    return (
                      <div key={index} className="flex-shrink-0">
                        <Image
                          src={resolved}
                          alt={`Event image ${index + 1}`}
                          width={180}
                          height={120}
                          className="rounded-lg object-cover shadow-md hover:scale-105 transition-transform cursor-pointer"
                          unoptimized
                          onLoadingComplete={(res) => console.debug(`Loaded gallery image ${index + 1}:`, resolved, res)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <h2 className="text-lg font-semibold mb-2">Event Description</h2>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-700">{legacyEvent.description}</p>
            </div>
            <div className="flex gap-2 mt-4">
              <input
                type="checkbox"
                id="approveCheck"
                className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                checked={approveChecked}
                onChange={() => { setApproveChecked(v => !v); if (!approveChecked) { setRejectChecked(false); setRejectReason(''); } }}
                disabled={status !== 'pending' || actionLoading}
              />
              <label htmlFor="approveCheck" className="text-sm text-green-600">Approve Creation</label>
            </div>
            <div className="mt-4 flex gap-2">
              <input
                type="checkbox"
                id="rejectCheck"
                className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                checked={rejectChecked}
                onChange={() => { 
                  if (!rejectChecked) {
                    setShowRejectModal(true);
                    setApproveChecked(false);
                  } else {
                    setRejectChecked(false);
                    setRejectReason('');
                  }
                }}
                disabled={status !== 'pending' || actionLoading}
              />
              <label htmlFor="rejectCheck" className="text-sm text-red-600">Reject Creation</label>
            </div>
          </div>
          <div className="flex justify-between pt-4 border-t mt-6">
            <button
              className="text-gray-600 hover:text-gray-900 cursor-pointer disabled:opacity-40"
              disabled={actionLoading}
              onClick={() => { setApproveChecked(false); setRejectChecked(false); setRejectReason(''); setMessage(null); }}
            >
              Reset
            </button>
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={actionLoading || (status === 'pending' && !approveChecked && !rejectChecked)}
              onClick={() => {
                if (approveChecked) moderate('approve'); else if (rejectChecked) moderate('reject');
              }}
            >
              {actionLoading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Rejection Reason</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this activity creation.
            </p>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              placeholder="Enter rejection reason..."
              rows={4}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  if (rejectReason.trim()) {
                    setRejectChecked(true);
                    setShowRejectModal(false);
                  } else {
                    setMessage('Please enter a rejection reason.');
                  }
                }}
                disabled={!rejectReason.trim()}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}