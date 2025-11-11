'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { activitiesApi } from "../../lib/activities";
import type { Activity, ActivityApplication } from '../../lib/types';
import { auth } from "@/lib/utils";
import { USER_ROLES } from '@/lib/constants';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import HeroImage from '../components/HeroImage';
import EventCardHorizontal from '../components/EventCard/EventCardHorizontal';
import { getMyEvents, getAllEvents, type EventFilterConfig } from '../components/EventCard/utils';
import { apiService } from '@/lib/api';

const AllEventsPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter] = useState<string>('');
  const [searchTerm] = useState('');
  const [dateStart] = useState('');
  const [dateEnd] = useState('');
  const [endAfterChecked] = useState(true);
  const [selectedStatus] = useState<string[]>([]);
  const [, setIsSearchActive] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [userApplications, setUserApplications] = useState<ActivityApplication[]>([]);
  const [organizerProfileId, setOrganizerProfileId] = useState<number | null>(null);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const authenticated = auth.isAuthenticated();
      const role = auth.getUserRole();
      setIsAuthenticated(authenticated);
      setUserRole(role);

      if (authenticated) {
        try {
          const userResult = await apiService.getCurrentUser();
          if (userResult.success && userResult.data) {
            const userData = userResult.data;
            
            if (role === USER_ROLES.ORGANIZER && userData.organizer_profile?.id) {
              setOrganizerProfileId(userData.organizer_profile.id);
            }
            
            if (role === USER_ROLES.STUDENT) {
              const applicationsResponse = await activitiesApi.getUserApplications();
              if (applicationsResponse.success && applicationsResponse.data) {
                setUserApplications(applicationsResponse.data);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    checkAuthAndFetchData();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const result = await activitiesApi.getActivities();
        if (result.success && result.data) {
          setActivities(result.data);
        } else {
          setActivities([]);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Create filter configuration
  const filterConfig: EventFilterConfig = {
    activities,
    userRole,
    isAuthenticated,
    userApplications,
    organizerProfileId
  };

  // Use getMyEvents for authenticated users, getAllEvents for unauthenticated
  const events = useMemo(() => {
    const filterConfig: EventFilterConfig = {
      activities,
      userRole,
      isAuthenticated,
      userApplications,
      organizerProfileId
    };

    if (isAuthenticated) {
      return getMyEvents(filterConfig);
    } else {
      return getAllEvents(filterConfig);
    }
  }, [activities, userRole, userApplications, organizerProfileId, isAuthenticated]);

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

  const pageTitle = isAuthenticated ? "My Events" : "All Events";

  return (
    <div className="relative pt-6 px-4">
      <HeroImage />
      <Navbar isAuthenticated={isAuthenticated} userRole={userRole} />
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
        <div className="flex flex-col gap-5 mb-10 mt-7 px-5">
          {filteredEvents.map(ev => (
            <EventCardHorizontal key={ev.id} event={ev} showShadow={true}
              showBadge={true} hoverScale={false} cardPadding="p-4" gradientBgClass="bg-white"/>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllEventsPage;