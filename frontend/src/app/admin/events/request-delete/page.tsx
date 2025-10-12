'use client';

import { useState, useMemo, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import AdminDeletionRequestCard, { DeletionRequestEvent } from '../components/AdminDeletionRequestCard';
import { activitiesApi } from '@/lib/activities';

export default function DeletionRequestListPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [events, setEvents] = useState<DeletionRequestEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const merged = reqRes.data.map((req: any) => {
          const act = activities.find(a => a.id === req.activity);
          return {
            ...req,
            title: act?.title || req.title || "Untitled Event",
            location: act?.location || req.location || "Unknown Location",
            startDate: act?.start_at || null,
            endDate: act?.end_at || null,
          };
        });

        if (mounted) setEvents(merged);
      } catch (err) {
        setError("Failed to load data");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchRequests();
    return () => { mounted = false; };
  }, []);


  const categories = useMemo(() => {
    if (!Array.isArray(events)) return ['All Categories'];
    const set = new Set<string>();
    events.forEach(ev => {
      ev.category?.forEach?.((c: string) => set.add(c));
    });
    return ['All Categories', ...Array.from(set)];
  }, [events]);


  const filtered = Array.isArray(events)
    ? events.filter(ev => {
        const term = search.toLowerCase();
        const isAll = category === 'All Categories' || category === 'all';
        const matchesCat = isAll || ev.category?.includes?.(category);

        const title = ev.title?.toLowerCase?.() || '';
        const desc = ev.description?.toLowerCase?.() || '';
        const reason = ev.reason?.toLowerCase?.() || '';

        const matchesSearch =
          title.includes(term) ||
          desc.includes(term) ||
          reason.includes(term);

        return matchesCat && matchesSearch;
      })
    : [];

  const count = filtered.length;

  return (
    <AdminLayout
      hideTitle
      title="Deletion Requests"
      searchVariant="compact"
      searchPlaceholder="Search events name, description"
      onSearchChange={(value: string) => setSearch(value)}
      initialSearchValue={search}
      // searchCategoryOptions={categories}
      searchSelectedCategory={category}
      onSearchCategoryChange={setCategory}
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
      <div className="space-y-6 mb-20">
        {!loading && !error && filtered.map(ev => (
          <AdminDeletionRequestCard key={ev.id} event={ev} />
        ))}
      </div>
    </AdminLayout>
  );
}
