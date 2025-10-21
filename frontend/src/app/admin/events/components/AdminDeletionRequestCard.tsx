"use client";
import { CalendarIcon, MapPinIcon, TrashIcon } from '@heroicons/react/24/outline';
import React from 'react';

export interface DeletionRequestEvent {
  id: number;
  title: string;
  description: string;
  category: string[];
  post: string;
  datestart: string;
  dateend: string;
  location: string;
  organizer: string;
  image: string;
  reason: string;
  capacity: number;
  additionalImages?: string[];
}

interface Props {
  event: DeletionRequestEvent;
  onReview?: (id: number) => void;
  onReject?: (id: number) => void;
}

const formatDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('en-GB'); } catch { return iso; }
};

export default function AdminDeletionRequestCard({ event }: Props) {
  return (
    <Link href={`/admin/approve/delete/${event.activity}`} className='w-full cursor-pointer'>
      <div className="relative overflow-hidden rounded-lg shadow-lg p-5 bg-gradient-to-r from-orange-300/25 to-amber-300/25 hover:scale-[1.01] transition-transform duration-200 mb-6">
        {/* Decorative faint icon */}
        <TrashIcon className="w-40 h-40 absolute -right-6 -bottom-6 opacity-5 text-black pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-semibold text-lg leading-snug line-clamp-2" title={event.title}>{event.title}</h3>
            <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-200 text-rose-900">pending</span>
          </div>
          <div className="flex items-center text-sm text-gray-700 gap-2">
            <CalendarIcon className="w-4 h-4" />
            <span>{formatDate(event.datestart)} - {formatDate(event.dateend)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-700 gap-2">
            <MapPinIcon className="w-4 h-4" />
            <span className="truncate" title={event.location}>{event.location}</span>
          </div>
          {event.category?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {event.category.slice(0,4).map((c,i)=>(
                <span key={i} className="bg-white/50 text-gray-700 text-[11px] px-2 py-0.5 rounded-full shadow-sm">{c}</span>
              ))}
              {event.category.length > 4 && (
                <span className="text-xs text-gray-600">+{event.category.length - 4}</span>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-700 mt-1">
            {typeof event.capacity === 'number' && (
              <span className="font-medium">Capacity: {event.capacity}</span>
            )}
            <span className="text-gray-500">Organizer: {event.organizer}</span>
          </div>
          <div className="mt-2 text-xs text-rose-800 bg-rose-50/90 border border-rose-200 rounded p-2">
            <strong>Deletion Reason:</strong> {event.reason}
          </div>
        </div>
      </div>
    </div>
  );
}
