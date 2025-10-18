"use client";
import { useEffect, useState, useMemo } from 'react';
import { activitiesApi } from '../../../../lib/activities';
import type { Activity } from '../../../../lib/types';
import AdminEventPreviewCard from '../../components/AdminEventPreviewCard';
import AdminLayout from '../../components/AdminLayout';

export default function PendingEventsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Activity[]>([]);
  const [search] = useState('');
  const [category] = useState('All Categories');
  const [searchStartDate, setSearchStartDate] = useState('');
  const [searchEndDate, setSearchEndDate] = useState('');
  const [endAfterChecked, setEndAfterChecked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSelectedCategory, setSearchSelectedCategory] = useState('All Categories');

  // ...existing code...

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await activitiesApi.getActivities();
      if (res.success && Array.isArray(res.data)) {
        setPending(res.data.filter(a => a.status === 'pending'));
      } else {
        setError(res.error || 'Failed to load activities');
      }
      setLoading(false);
    };
    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    pending.forEach(a => a.categories.forEach(c => set.add(c)));
    return ['All Categories', ...Array.from(set.values())];
  }, [pending]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return pending.filter(ev => {
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
  }, [pending, searchQuery, searchSelectedCategory, searchStartDate, searchEndDate, endAfterChecked]);

  const count = filtered.length;
  return (
    <AdminLayout
      hideTitle
      title="Pending Events"
      searchVariant="compact"
      searchPlaceholder="Search pending events..."
      onSearchChange={setSearchQuery}
      onSearchCategoryChange={setSearchSelectedCategory}
      onSearchStartDateChange={setSearchStartDate}
      onSearchEndDateChange={setSearchEndDate}
      onEndAfterCheckedChange={setEndAfterChecked}
      initialSearchValue={searchQuery}
      searchCategoryOptions={categories}
      searchSelectedCategory={searchSelectedCategory}
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-bold text-2xl mb-1">Pending Events</h1>
        <span className="inline-flex items-center rounded-full bg-yellow-500/10 text-yellow-800 text-xs font-medium px-3 py-1 border border-yellow-500/20">
          {loading ? 'Counting…' : `${count} event${count === 1 ? '' : 's'}`}
        </span>
      </div>
      {loading && <div className="flex items-center gap-3 text-gray-600 mb-6"><span className="animate-spin h-6 w-6 border-b-2 border-yellow-600 rounded-full" /> Loading...</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6">{error}</div>}
      {!loading && !error && (
  count === 0 ? <p className="text-gray-600">No pending events{search || category !== 'All Categories' ? ' match your filters.' : '.'}</p> : (
          <div className="space-y-6 mb-10">
            {filtered.map((a: Activity) => (
              <AdminEventPreviewCard key={a.id} activity={a} hrefOverride={`/admin/approve/create/${a.id}`} />
            ))}
          </div>
        )
      )}
    </AdminLayout>
  );
}

