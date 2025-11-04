"use client";
import Link from 'next/link';
import Image from 'next/image';
import type { Activity } from '../../../lib/types';

interface AdminEventStatusCardProps {
  title: string;
  gradient: string; // tailwind gradient classes
  icon?: string; // optional background svg path
  activities: Activity[];
  linkHref?: string; // optional click-through link
  maxItems?: number;
  emptyText?: string;
  showStatusTag?: boolean;
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-GB');
  } catch {
    return iso;
  }
};

export default function AdminEventStatusCard({
  title,
  gradient,
  icon,
  activities,
  linkHref,
  maxItems = 5,
  emptyText = 'No events',
  showStatusTag = false,
}: AdminEventStatusCardProps) {
  const content = (
    <div className={`shadow-lg p-4 mb-10 rounded-lg relative overflow-hidden ${gradient} hover:scale-102 transition-transform duration-200`}>      
      {icon && (
        <Image
          src={icon}
          alt={`${title} illustration`}
          width={200}
          height={200}
          className="absolute right-0 bottom-0 opacity-50 pointer-events-none"
        />
      )}
      <h2 className="font-medium mb-2 relative z-10 text-xl">
        {title} <span className="text-gray-600">&gt;</span>
      </h2>
      <div className="space-y-3 px-2 relative z-10">
        {activities.length === 0 && (
          <p className="text-gray-500 text-sm italic">{emptyText}</p>
        )}
        {activities.slice(0, maxItems).map((a, idx) => (
          <div key={a.id} className={`border-b border-gray-300 pb-2 text-sm flex flex-col gap-0.5 ${idx === maxItems - 1 ? 'border-none' : ''}`}>
            <div className="flex justify-between items-start">
              <p className="text-gray-800 font-medium line-clamp-1" title={a.title}>{a.title}</p>
              {showStatusTag && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white/60 capitalize border border-white/80">
                  {a.status}
                </span>
              )}
            </div>
            {/* For one-day activities */}
            <p className="text-gray-500 text-xs">
              {a.start_at === a.end_at ? (
                formatDate(a.start_at)
              ) : (
                <>
                  {formatDate(a.start_at)} - {formatDate(a.end_at)}
                </>
              )}
            </p>
            {a.rejection_reason && a.status === 'rejected' && (
              <p className="text-red-600 text-xs truncate" title={a.rejection_reason}>{a.rejection_reason}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (linkHref) {
    return (
      <Link href={linkHref} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
