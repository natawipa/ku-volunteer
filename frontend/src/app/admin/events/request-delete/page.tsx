'use client';

import { useState, useMemo, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import AdminDeletionRequestCard, { DeletionRequestEvent } from '../components/AdminDeletionRequestCard';
import { activitiesApi } from '@/lib/activities';

// Combined data structure (after merging)
type MergedDeletionRequest = DeletionRequestEvent & {
  startDate?: string | null;
  endDate?: string | null;
};

export default function DeletionRequestListPage() {
  const [events, setEvents] = useState<MergedDeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSelectedCategory, setSearchSelectedCategory] = useState('All Categories');
  const [searchStartDate, setSearchStartDate] = useState('');
  const [searchEndDate, setSearchEndDate] = useState('');
  const [endAfterChecked, setEndAfterChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchRequests() {
      try {
        const reqRes = await activitiesApi.getDeletionRequests();
        if (!reqRes.success || !Array.isArray(reqRes.data)) return;

        // Fetch all activities
        const actRes = await activitiesApi.getActivities();
        const activities = Array.isArray(actRes.data) ? actRes.data : [];

        // Merge by foreign key
        const merged: MergedDeletionRequest[] = reqRes.data.map((req: DeletionRequestEvent) => {
          const act = activities.find(a => a.id === req.activity);
          return {
            ...req,
            title: act?.title || req.title || "Untitled Event",
            location: act?.location || req.location || "Unknown Location",
            startDate: act?.start_at || null,
            endDate: act?.end_at || null,
            post: act?.created_at || req.post || "",
            datestart: act?.start_at || req.datestart || "",
            dateend: act?.end_at || req.dateend || "",
            organizer: act?.organizer_name || req.organizer || "",
          };
        });

        if (mounted) setEvents(merged);
      } catch {
        setError("Failed to load data");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchRequests();
    return () => { mounted = false; };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    events.forEach(ev => ev.category.forEach((c: string) => set.add(c)));
    return ['All Categories', ...Array.from(set.values())];
  }, [events]);


  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return events.filter(ev => {
      const matchesSearch =
        !q ||
        ev.title.toLowerCase().includes(q) ||
        ev.location.toLowerCase().includes(q) ||
        ev.description?.toLowerCase().includes(q);

      const matchesCategory =
        searchSelectedCategory === 'All Categories' ||
        (Array.isArray(ev.category) &&
          ev.category.some((c: string) => {
            if (searchSelectedCategory === 'Social Impact') {
              return c.includes('Social Engagement Activities');
            }
            return c.includes(searchSelectedCategory);
          }));

      let matchesDate = true;
      const eventStart = new Date(ev.startDate || '');
      const eventEnd = new Date(ev.endDate || '');

      if (searchStartDate && searchEndDate) {
        const filterStart = new Date(searchStartDate);
        const filterEnd = new Date(searchEndDate);
        
        matchesDate = endAfterChecked
          ? eventEnd >= filterStart && eventStart <= filterEnd
          : eventEnd <= filterEnd && eventStart <= filterEnd && eventEnd >= filterStart;
      }

      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [events, searchQuery, searchSelectedCategory, searchStartDate, searchEndDate, endAfterChecked]);

  const count = filtered.length;

  return (
    <AdminLayout
      hideTitle
      title="Deletion Requests"
      searchVariant="compact"
      searchPlaceholder="Search events name, description"
      onSearchChange={setSearchQuery}
      onSearchCategoryChange={setSearchSelectedCategory}
      onSearchStartDateChange={setSearchStartDate}
      onSearchEndDateChange={setSearchEndDate}
      onEndAfterCheckedChange={setEndAfterChecked}
      initialSearchValue={searchQuery}
      searchCategoryOptions={categories}
      searchSelectedCategory={searchSelectedCategory}
      
    >
      {/* Header + quick stats */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-bold text-2xl">Deletion Requests</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="inline-flex items-center rounded-full bg-rose-500/10 text-rose-800 font-medium px-3 py-1 border border-rose-500/20">
              {count} request{count === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      {/* Loading/Error */}
      {loading && <p>Loading deletion requests...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {/* Cards */}
      <div className="space-y-6 mb-10">
        {!loading && !error && filtered.map(ev => (
          <AdminDeletionRequestCard key={ev.id} event={ev} />
        ))}
      </div>
    </AdminLayout>
  );
}
