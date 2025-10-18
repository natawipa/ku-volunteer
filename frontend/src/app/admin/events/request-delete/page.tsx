'use client';

import { useState, useMemo, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import AdminDeletionRequestCard, { DeletionRequestEvent } from '../components/AdminDeletionRequestCard';
import { apiService } from '@/lib/api';

// DeletionRequestEvent interface now imported from component file

type RequestDeleteJson = { events: DeletionRequestEvent[] };
const rawEvents = (data as RequestDeleteJson).events;

export default function DeletionRequestListPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [events, setEvents] = useState<(DeletionRequestEvent & { startDate?: string; endDate?: string })[]>([]);
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
      setLoading(true);
      setError(null);
      try {
        // Replace with your actual API call
        const result = await apiService.getDeletionRequests();
        if (!mounted) return;
        if (result.success && result.data) {
          setEvents(result.data);
        } else {
          setError(result.error || "Failed to load deletion requests");
        }
      } catch (err: unknown) {
        if (!mounted) return;
        setError("Failed to load deletion requests");
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
        // Use overlap logic for date range
        matchesDate = eventEnd >= filterStart && eventStart <= filterEnd;
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
