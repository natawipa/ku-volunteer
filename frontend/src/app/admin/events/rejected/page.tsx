"use client";
import { useEffect, useState, useMemo } from 'react';
import { activitiesApi } from '../../../../lib/activities';
import type { Activity } from '../../../../lib/types';
import AdminEventPreviewCard from '../../components/AdminEventPreviewCard';
import AdminLayout from '../../components/AdminLayout';

export default function RejectedEventsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejected, setRejected] = useState<Activity[]>([]);
  const [search] = useState('');
  const [searchStartDate, ] = useState('');
  const [searchEndDate, ] = useState('');
  const [endAfterChecked, ] = useState(false);
  const [searchQuery, ] = useState('');
  const [searchSelectedCategory, ] = useState('All Categories');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await activitiesApi.getActivities();
        if (res.success) {
          if (Array.isArray(res.data)) {
            setRejected(res.data.filter(a => a && a.status === 'rejected'));
          } else if (res.data === null) {
            setRejected([]);
          } else {
            setError('Invalid data format');
          }
        } else {
          setError(res.error || 'Failed to load activities');
        }
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return rejected.filter(ev => {
      const matchesSearch =
        !q ||
        ev.title.toLowerCase().includes(q) ||
        ev.location.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q);

      const matchesCategory =
        searchSelectedCategory === 'All Categories' ||
        (Array.isArray(ev.categories) &&
          ev.categories.some(c => {
            if (searchSelectedCategory === 'Social Impact') {
              return c.includes('Social Engagement Activities');
            }
            return c.includes(searchSelectedCategory);
          }));

      let matchesDate = true;
      const eventStart = new Date(ev.start_at);
      const eventEnd = new Date(ev.end_at);

      if (searchStartDate && searchEndDate) {
        const filterStart = new Date(searchStartDate);
        const filterEnd = new Date(searchEndDate);

        matchesDate = endAfterChecked
          ? eventEnd >= filterStart && eventStart <= filterEnd
          : eventEnd <= filterEnd && eventStart <= filterEnd && eventEnd >= filterStart;
      }

      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [rejected, searchQuery, searchSelectedCategory, searchStartDate, searchEndDate, endAfterChecked]);

  const count = filtered.length;
  return (
    <AdminLayout
      hideTitle
      title="Rejected Events"
    >
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-bold text-2xl mb-1">Rejected Events</h1>
        </div>
        <span className="inline-flex items-center rounded-full bg-red-500/10 text-red-800 text-xs font-medium px-3 py-1 border border-red-500/20">
          {loading ? 'Counting…' : `${count} event${count === 1 ? '' : 's'}`}
        </span>
      </div>
      {loading && (
        <div className="flex items-center gap-3 mb-6 text-gray-600">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600" />
          Loading activities...
        </div>
      )}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6">{error}</div>}
      {!loading && !error && (
        count === 0 ? <p className="text-gray-600">No rejected events{search ? ' match your search.' : '.'}</p> : (
          <div className="space-y-6 mb-10">
            {filtered.map((a: Activity) => (
              <AdminEventPreviewCard key={a.id} activity={a} />
            ))}
          </div>
        )
      )}
    </AdminLayout>
  );
}
