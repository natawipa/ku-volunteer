"use client";
import { useEffect, useState, useMemo } from 'react';
import { activitiesApi } from '../../../../lib/activities';
import type { Activity } from '../../../../lib/types';
import AdminEventPreviewCard from '../../components/AdminEventPreviewCard';
import AdminLayout from '../../components/AdminLayout';

export default function ApprovedEventsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approved, setApproved] = useState<Activity[]>([]);
  const [search, ] = useState('');
  const [category, ] = useState('All Categories');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await activitiesApi.getActivities();
      if (res.success && Array.isArray(res.data)) {
  setApproved(res.data.filter((a: Activity) => a.status === 'open' || a.status === 'approved'));
      } else {
        setError(res.error || 'Failed to load activities');
      }
      setLoading(false);
    };
    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    approved.forEach((a: Activity) => a.categories.forEach((c: string) => set.add(c)));
    return ['All Categories', ...Array.from(set.values())];
  }, [approved]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return approved.filter((a: Activity) => {
      const inCat = category === 'All Categories' || a.categories.includes(category);
      if (!inCat) return false;
      return (
        a.title.toLowerCase().includes(term) ||
        a.description.toLowerCase().includes(term) ||
        a.location.toLowerCase().includes(term) ||
        (a.rejection_reason?.toLowerCase().includes(term) ?? false)
      );
    });
  }, [approved, search, category]);

  const count = filtered.length;
  return (
    <AdminLayout
      hideTitle
      title="Approved Events"
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-bold text-2xl">Approved Events</h1>
        <span className="inline-flex items-center rounded-full bg-green-600/10 text-green-800 text-xs font-medium px-3 py-1 border border-green-600/20">
          {loading ? 'Counting…' : `${count} event${count === 1 ? '' : 's'}`}
        </span>
      </div>
      {loading && (
        <div className="flex items-center gap-3 text-gray-600 mb-6">
          <span className="animate-spin h-6 w-6 border-b-2 border-green-600 rounded-full" /> Loading...
        </div>
      )}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6">{error}</div>}
      {!loading && !error && (
        count === 0 ? (
          <div className="text-gray-600">No approved events{search || category !== 'All Categories' ? ' match your filters.' : '.'}</div>
        ) : (
          <div className="space-y-6 mb-10">
            {filtered.map((a: Activity) => (
              <AdminEventPreviewCard key={a.id} activity={a} />
            ))}
          </div>
        )
      )}
    </AdminLayout>
  );}
