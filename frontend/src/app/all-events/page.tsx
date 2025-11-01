'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { activitiesApi } from "../../lib/activities";
import type { Activity } from '../../lib/types';
import { auth } from "@/lib/utils";
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import HeroImage from '../components/HeroImage';
import EventCardHorizontal from '../components/EventCard/EventCardHorizontal';
import { EventCardData, transformActivityToEvent } from '../components/EventCard/utils';

const AllEventsPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]); 
  const [events, setEvents] = useState<EventCardData[]>([]);
  const [UserRole, setUserRole] = useState<string | null>(null);
  const [IsAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, ] = useState<string>('');
  const [searchTerm, ] = useState('');
  const [dateStart, ] = useState('');
  const [dateEnd, ] = useState('');
  const [endAfterChecked, ] = useState(true);
  const [selectedStatus, ] = useState<string[]>([]);
  const [, setIsSearchActive] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const result = await activitiesApi.getActivities();
        if (result.success && result.data) {
          // Map Activity to Event type
          setActivities(result.data);
          const mappedEvents = result.data.map(transformActivityToEvent);
          setEvents(mappedEvents);
        } else {
          setActivities([]);
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

  useEffect(() => {
    setIsAuthenticated(auth.isAuthenticated());
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
                       status.toLowerCase() === (event.status || "unknown").toLowerCase()
                     );

      return matchesCategory && matchesSearch && matchesDate && matchesStatus;
    });
}, [events, filter, searchTerm, dateStart, dateEnd, endAfterChecked, selectedStatus]);

  const pageTitle = IsAuthenticated ? "My Events" : "All Events";

  return (
    <div className="relative pt-6 px-4">
      <HeroImage />
      <Navbar />
      <div className="relative">
        <Header showBigLogo={true} showSearch={true} activities={activities} setIsSearchActive={setIsSearchActive} searchInputRef={searchInputRef}/>
      </div>
      <h1 className="text-3xl font-bold align-center mt-7">{pageTitle}</h1>
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
        <div className="flex flex-col gap-5 mb-10 mt-7">
          {filteredEvents.map(ev => (
            <EventCardHorizontal key={ev.id} event={ev} showShadow={true}
              showBadge={true} hoverScale={true}cardPadding="p-4" />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllEventsPage;