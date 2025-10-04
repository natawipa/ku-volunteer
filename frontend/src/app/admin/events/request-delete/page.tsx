'use client';

import { useState, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import data from '../../../requestDelete.json';
import AdminDeletionRequestCard, { DeletionRequestEvent } from '../components/AdminDeletionRequestCard';

// DeletionRequestEvent interface now imported from component file

type RequestDeleteJson = { events: DeletionRequestEvent[] };
const rawEvents = (data as RequestDeleteJson).events;

export default function DeletionRequestListPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');

  const categories = useMemo(() => {
    const set = new Set<string>();
    rawEvents.forEach(ev => ev.category.forEach(c => set.add(c)));
    // Ensure the first option is the canonical sentinel used across admin pages.
    // Previously this was mistakenly 'all' (lowercase) which broke the match-all logic.
    return ['All Categories', ...Array.from(set.values())];
  }, []);

  const filtered = rawEvents.filter(ev => {
    const term = search.toLowerCase();
    // Accept both legacy 'all' (if it ever sneaks in) and the canonical 'All Categories'
    const isAll = category === 'All Categories' || category === 'all';
    const matchesCat = isAll || ev.category.includes(category);
    const matchesSearch = (
      ev.title.toLowerCase().includes(term) ||
      ev.description.toLowerCase().includes(term) ||
      ev.reason.toLowerCase().includes(term)
    );
    return matchesCat && matchesSearch;
  });

  const count = filtered.length;

  return (
    <AdminLayout
      hideTitle
      title="Deletion Requests"
      searchVariant="compact"
      searchPlaceholder="Search events name, description"
      onSearchChange={(value: string) => setSearch(value)}
      initialSearchValue={search}
      searchCategoryOptions={categories}
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

      {/* Cards (stacked gradient like rejected event cards) */}
      <div className="space-y-6 mb-10">
        {filtered.map(ev => (
          <AdminDeletionRequestCard key={ev.id} event={ev} />
        ))}
      </div>
    </AdminLayout>
  );
}
