import { useState, useEffect } from 'react';
import { activitiesApi } from '../../../lib/activities';
import type { Activity } from '../../../lib/types';

export function useEventData(eventId: number | null) {
  const [event, setEvent] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (eventId == null || Number.isNaN(eventId)) return;
      
      try {
        setLoading(true);
        const response = await activitiesApi.getActivity(eventId);
        
        if (response.success && response.data) {
          setEvent(response.data);
        } else {
          setError(response.error || 'Failed to fetch event details');
        }
      } catch {
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (eventId != null && !Number.isNaN(eventId)) {
      fetchEvent();
    }
  }, [eventId]);

  return { event, loading, error };
}