'use client';

import React, { useState, useEffect, useMemo } from 'react';
import EventLayout from '../components/AllEventLayout';
import PublicEventHorizontalCard, { PublicEventCardData } from '../components/PublicEventHorizontalCard';

interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  location: string;
  organizer: string;
  image_url?: string;
  participants_count: number;
  max_participants: number;
}

const AllEventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulate API call for now - replace with actual API call
    const fetchEvents = async () => {
      setLoading(true);
      // Mock data for demonstration
      const mockEvents: Event[] = [
        {
          id: '1',
          title: 'Community Garden Project',
          description: 'Help build a sustainable community garden in the local park',
          category: 'Environmental',
          date: '2024-02-15',
          location: 'Central Park, Bangkok',
          organizer: 'Green Earth Foundation',
          participants_count: 15,
          max_participants: 30,
        },
        {
          id: '2',
          title: 'Education Support Program',
          description: 'Tutor underprivileged children in mathematics and science',
          category: 'Education',
          date: '2024-02-20',
          location: 'Community Center, Nonthaburi',
          organizer: 'Learning for All',
          participants_count: 8,
          max_participants: 20,
        },
        {
          id: '3',
          title: 'Beach Cleanup Initiative',
          description: 'Join us in cleaning up the beautiful beaches of Pattaya',
          category: 'Environmental',
          date: '2024-02-25',
          location: 'Pattaya Beach, Chonburi',
          organizer: 'Ocean Guardians',
          participants_count: 25,
          max_participants: 50,
        },
      ];
      
      setTimeout(() => {
        setEvents(mockEvents);
        setLoading(false);
      }, 1000);
    };

    fetchEvents();
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesFilter = filter === 'all' || event.category.toLowerCase() === filter.toLowerCase();
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const categoryOptions = useMemo(() => {
    const base = ['all', 'Environmental', 'Education', 'Health', 'Social'];
    return ['All Categories', ...base.filter(c => c !== 'all')];
  }, []);

  return (
    <EventLayout
      title="All Events"
      hideTitle={false}
      searchVariant="compact"
      searchPlaceholder="Search events..."
      onSearchChange={setSearchTerm}
      initialSearchValue={searchTerm}
      searchCategoryOptions={categoryOptions}
      searchSelectedCategory={filter === 'all' ? 'All Categories' : filter}
      onSearchCategoryChange={(val) => setFilter(val === 'All Categories' ? 'all' : val)}
      searchShowDate={false}
    >
      {/* Events Section */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-600">Loading events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or filter settings.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5 mb-10">
          {filteredEvents.map(ev => (
            <PublicEventHorizontalCard key={ev.id} event={ev as PublicEventCardData} />
          ))}
        </div>
      )}
    </EventLayout>
  );
};

export default AllEventsPage;