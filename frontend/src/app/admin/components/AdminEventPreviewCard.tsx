"use client";
import type { Activity } from '../../../lib/types';
import { CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface AdminEventPreviewCardProps {
  activity: Activity;
  statusAccent?: string; // override color
  hrefOverride?: string; // optional custom navigation target
}

// Badge colors (compact pill)
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-200 text-yellow-900',
  rejected: 'bg-red-200 text-red-900',
  open: 'bg-green-200 text-green-900',
  approved: 'bg-green-200 text-green-900',
  full: 'bg-orange-200 text-orange-900',
  closed: 'bg-gray-300 text-gray-800'
};

// Gradient background matching the big status boxes (pre-click) and user list cards style
const gradientClasses: Record<string, string> = {
  pending: 'bg-gradient-to-r from-green-300/25 to-yellow-300/25',
  rejected: 'bg-gradient-to-r from-red-300/25 to-pink-300/25',
  open: 'bg-gradient-to-r from-blue-300/25 to-purple-300/25',
  approved: 'bg-gradient-to-r from-blue-300/25 to-purple-300/25',
  full: 'bg-gradient-to-r from-orange-300/25 to-red-200/25',
  closed: 'bg-gradient-to-r from-gray-300/25 to-gray-100/25',
  default: 'bg-gradient-to-r from-green-200/25 to-gray-200/25'
};

const formatDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('en-GB'); } catch { return iso; }
};

export default function AdminEventPreviewCard({ activity, hrefOverride }: AdminEventPreviewCardProps) {
  const statusKey = (activity.status || '').toLowerCase();
  const statusClass = statusColors[statusKey] || statusColors['open'];
  const gradient = gradientClasses[statusKey] || gradientClasses.default;
  return (
    <Link
      href={hrefOverride || `/event-detail/${activity.id}`}
      aria-label={`View details for ${activity.title}`}
      className={`group relative block overflow-hidden rounded-lg shadow-lg p-5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-600/60 hover:shadow-xl hover:-translate-y-0.5 ${gradient}`}
    >
      {/* Decorative faint calendar icon */}
      <CalendarIcon className="w-40 h-40 absolute -right-6 -bottom-6 opacity-5 text-black pointer-events-none transition-transform duration-200 group-hover:scale-105" />
      <div className="relative z-10 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-semibold text-lg leading-snug line-clamp-2" title={activity.title}>{activity.title}</h3>
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium capitalize backdrop-blur-sm/30 ${statusClass}`}>{activity.status}</span>
        </div>
        <div className="flex items-center text-sm text-gray-700 gap-2">
          <CalendarIcon className="w-4 h-4" />
          <span>{formatDate(activity.start_at)} - {formatDate(activity.end_at)}</span>
        </div>
        <div className="flex items-center text-sm text-gray-700 gap-2">
          <MapPinIcon className="w-4 h-4" />
          <span className="truncate" title={activity.location}>{activity.location}</span>
        </div>
        {activity.categories?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {activity.categories.slice(0,4).map((c,i)=>(
              <span key={i} className="bg-white/50 text-gray-700 text-[11px] px-2 py-0.5 rounded-full shadow-sm">{c}</span>
            ))}
            {activity.categories.length > 4 && (
              <span className="text-xs text-gray-600">+{activity.categories.length - 4}</span>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-700 mt-1">
          {typeof activity.current_participants === 'number' && typeof activity.max_participants === 'number' && (
            <span className="font-medium">{activity.current_participants}/{activity.max_participants} participants</span>
          )}
            {activity.hours_awarded && <span>{activity.hours_awarded} hrs</span>}
        </div>
        {activity.status === 'rejected' && activity.rejection_reason && (
          <div className="mt-2 text-xs text-red-800 bg-red-50/90 border border-red-200 rounded p-2">
            <strong>Reason:</strong> {activity.rejection_reason}
          </div>
        )}
      </div>
    </Link>
  );
}
