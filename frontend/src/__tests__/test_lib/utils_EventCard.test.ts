import {
  formatDate,
  formatPostedTime,
  getCategoryBackground,
  transformActivityToEvent,
  getMyEvents,
  getAllEvents,
  getOpeningEvents,
} from '@/app/components/EventCard/utils';

describe('EventCard utils', () => {
  describe('formatDate', () => {
    it('formats ISO date string to dd/mm/yyyy', () => {
      expect(formatDate('2025-11-13T00:00:00.000Z')).toBe('13/11/2025');
    });

    it('returns original string when invalid date', () => {
      expect(formatDate('not-a-date')).toBe('not-a-date');
    });
  });

  describe('formatPostedTime', () => {
    const realNow = Date.now;

    afterEach(() => {
      // restore
      // @ts-ignore
      Date.now = realNow;
    });

    it('returns empty string when no date provided', () => {
      expect(formatPostedTime()).toBe('');
    });

    it('returns Just now for less than 1 hour', () => {
      // freeze now
      const base = new Date('2025-11-10T12:00:00.000Z').getTime();
      // @ts-ignore
      Date.now = () => base;
      expect(formatPostedTime('2025-11-10T11:30:00.000Z')).toBe('Just now');
    });

    it('returns hours ago correctly', () => {
      const base = new Date('2025-11-10T12:00:00.000Z').getTime();
      // @ts-ignore
      Date.now = () => base;
      expect(formatPostedTime('2025-11-10T07:00:00.000Z')).toBe('5h ago');
    });

    it('returns days ago correctly', () => {
      const base = new Date('2025-11-10T12:00:00.000Z').getTime();
      // @ts-ignore
      Date.now = () => base;
      expect(formatPostedTime('2025-11-08T12:00:00.000Z')).toBe('2d ago');
    });
  });

  describe('getCategoryBackground', () => {
    it('returns known background for a category', () => {
      const res = getCategoryBackground('University Activities');
      expect(res.color).toContain('from');
      expect(res.backgroundBrain).toBe('/brain-read.svg');
    });

    it('returns default for unknown category', () => {
      const res = getCategoryBackground('NonExistent');
      expect(res.color).toBe('bg-gray-100');
      expect(res.backgroundBrain).toBe('');
    });
  });

  describe('transformActivityToEvent', () => {
    it('returns default event for falsy activity', () => {
      const e = transformActivityToEvent(null as any);
      expect(e.title).toBe('Untitled Activity');
      expect(e.imgSrc).toBe('/default-event.jpg');
    });

    it('maps fields from activity to event', () => {
      const activity = {
        id: 7,
        title: 'A',
        description: 'desc',
        organizer_name: 'Org',
        current_participants: 2,
        max_participants: 10,
        start_at: '2025-01-01T00:00:00Z',
        end_at: '2025-01-02T00:00:00Z',
        location: 'X',
        categories: ['cat'],
        cover_image_url: undefined,
        cover_image: '/c.jpg',
        status: 'open',
        created_at: '2025-01-01T00:00:00Z',
      } as any;

      const e = transformActivityToEvent(activity);
      expect(e.id).toBe(7);
      expect(e.imgSrc).toBe('/c.jpg');
      expect(e.organizer).toBe('Org');
    });
  });

  describe('getMyEvents / getAllEvents / getOpeningEvents', () => {
    const activities = [
      { id: 1, status: 'open', start_at: '2025-01-02T00:00:00Z', created_at: '2025-01-01T00:00:00Z' } as any,
      { id: 2, status: 'complete', start_at: '2024-12-01T00:00:00Z', created_at: '2024-12-01T00:00:00Z' } as any,
      { id: 3, status: 'upcoming', start_at: '2025-02-01T00:00:00Z', created_at: '2025-01-15T00:00:00Z' } as any,
    ];

    it('getMyEvents for student returns approved activities only and sorts complete last', () => {
      const userApplications = [
        { activity: 1, status: 'approved' },
        { activity: 2, status: 'approved' },
      ];

      const res = getMyEvents({ activities, userRole: 'student', isAuthenticated: true, userApplications });
      // should include both ids 1 and 2
      expect(res.map(r => r.id)).toEqual(expect.arrayContaining([1, 2]));
      // complete (id 2) should be after 1
      expect(res[0].id).toBe(1);
      expect(res[1].id).toBe(2);
    });

    it('getMyEvents for organizer returns organizer created activities sorted by posted_at desc', () => {
      const orgActivities = [
        { id: 10, organizer_profile_id: 5, created_at: '2025-01-01T00:00:00Z' } as any,
        { id: 11, organizer_profile_id: 5, created_at: '2025-02-01T00:00:00Z' } as any,
        { id: 12, organizer_profile_id: 6, created_at: '2025-03-01T00:00:00Z' } as any,
      ];

      const res = getMyEvents({ activities: orgActivities, userRole: 'organizer', isAuthenticated: true, organizerProfileId: 5 as any });
      expect(res.map(r => r.id)).toEqual([11, 10]);
    });

    it('getAllEvents returns open/upcoming when not authenticated', () => {
      const res = getAllEvents({ activities, userRole: null, isAuthenticated: false });
      expect(res.map(r => r.id).sort()).toEqual([1, 3]);
    });

    it('getOpeningEvents returns open/upcoming sorted by dateStart', () => {
      const res = getOpeningEvents(activities);
      expect(res.map(r => r.id).sort()).toEqual([1, 3]);
    });
  });
});
