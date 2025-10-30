'use client';

import React, { useState, useEffect, useMemo } from 'react';
import EventLayout from '../components/AllEventLayout';
import PublicEventHorizontalCard, { PublicEventCardData } from '../components/PublicEventHorizontalCard';
import { activitiesApi } from "../../lib/activities";
import type { Activity } from "../../lib/types";

interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  dateStart: string; // ISO date string
  dateEnd: string; // ISO date string
  location: string;
  organizer: string;
  image_url?: string;
  participants_count: number;
  max_participants: number;
  status: string;
}

const AllEventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, ] = useState<string>('');
  const [searchTerm, ] = useState('');
  const [dateStart, ] = useState('');
  const [dateEnd, ] = useState('');
  const [endAfterChecked, ] = useState(true);
  const [selectedStatus, ] = useState<string[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const result = await activitiesApi.getActivities();
        if (result.success && result.data) {
          // Map Activity to Event type
          const mappedEvents: Event[] = result.data.map((activity: Activity) => ({
            id: activity.id.toString(),
            title: activity.title,
            description: activity.description,
            category: activity.categories?.[0] || '',
            dateStart: (activity.start_at || '').split('T')[0],
            dateEnd: (activity.end_at || '').split('T')[0],
            location: activity.location,
            organizer: activity.organizer_name || activity.organizer_email || '',
            imgSrc: activity.cover_image_url ?? activity.cover_image ?? "/default-event.jpg",
            participants_count: activity.current_participants,
            max_participants: activity.max_participants || 0,
            status: activity.status || 'unknown',
          }));
          setEvents(mappedEvents);
        } else {
          setEvents([]);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Category filter logic
      const selectedCategories = Array.isArray(filter) ? filter : filter ? [filter] : [];
      const eventCategories = Array.isArray(event.category) ? event.category : [event.category];
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes('All Categories') ||
        eventCategories.some(c => {
          if (selectedCategories.includes('Social Impact')) {
            return c.includes('Social Engagement Activities');
          }
          return selectedCategories.some(sel => c && c === sel);
        });

      // Search term filter
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        term === '' ||
        event.title.toLowerCase().includes(term) ||
        event.description.toLowerCase().includes(term);

      // Date filter
      let matchesDate = true;
      const eventStart = new Date(event.dateStart);
      const eventEnd = new Date(event.dateEnd);

      if (dateStart && dateEnd) {
        const filterStart = new Date(dateStart);
        const filterEnd = new Date(dateEnd);

        // Start date must be within the selected range
        const startInRange = eventStart >= filterStart && eventStart <= filterEnd;

        // End date can be after selected range if checkbox is true
        const endInRange = endAfterChecked
          ? eventEnd >= filterStart // allow any event that starts within or ends after range
          : eventEnd <= filterEnd;

        matchesDate = startInRange && endInRange;
      }

      const matchesStatus = selectedStatus.length === 0 || 
                     selectedStatus.some(status => 
                       status.toLowerCase() === event.status.toLowerCase()
                     );

      return matchesCategory && matchesSearch && matchesDate && matchesStatus;
    });
}, [events, filter, searchTerm, dateStart, dateEnd, endAfterChecked, selectedStatus]);

  return (
    <EventLayout
      title="All Events"
      hideTitle={false}
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