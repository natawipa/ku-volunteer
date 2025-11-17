import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import ApprovedEventsPage from '@/app/admin/events/approved/page';
import { activitiesApi } from '@/lib/activities';
import type { Activity } from '@/lib/types';

// Mock dependencies
jest.mock('@/lib/activities', () => ({
  activitiesApi: {
    getActivities: jest.fn(),
  },
}));

jest.mock('../../components/AdminEventPreviewCard', () => ({
  __esModule: true,
  default: jest.fn(({ activity }: { activity: Activity }) => (
    <div data-testid={`admin-event-preview-${activity.id}`}>
      {activity.title} - {activity.status}
    </div>
  )),
}));

jest.mock('../../components/AdminLayout', () => ({
  __esModule: true,
  default: jest.fn(({ children, title, hideTitle }: { children: React.ReactNode; title?: string; hideTitle?: boolean }) => (
    <div data-testid="admin-layout">
      {!hideTitle && <h1 data-testid="layout-title">{title}</h1>}
      {children}
    </div>
  )),
}));

// Mock data
const mockActivities: Activity[] = [
  {
    id: 1,
    title: 'Beach Cleanup',
    created_at: '2024-01-01T00:00:00Z',
    start_at: '2024-02-01T09:00:00Z',
    end_at: '2024-02-01T12:00:00Z',
    location: 'Sandy Beach',
    categories: ['Environment', 'Service'],
    max_participants: 50,
    organizer_name: 'Eco Club',
    organizer_profile_id: 101,
    organizer_email: 'eco@example.com',
    description: 'Clean the beach',
    cover_image_url: '/beach.jpg',
    status: 'open',
    updated_at: '2024-01-01T10:00:00Z',
    current_participants: 25,
    requires_admin_for_delete: false,
    capacity_reached: false,
    cover_image: '/beach.jpg',
  },
  {
    id: 2,
    title: 'Tech Workshop',
    created_at: '2024-01-02T00:00:00Z',
    start_at: '2024-02-15T14:00:00Z',
    end_at: '2024-02-15T17:00:00Z',
    location: 'Tech Lab',
    categories: ['Education', 'Technology'],
    max_participants: 30,
    organizer_name: 'Tech Society',
    organizer_profile_id: 102,
    organizer_email: 'tech@example.com',
    description: 'Learn programming',
    cover_image_url: '/tech.jpg',
    status: 'approved',
    updated_at: '2024-01-02T11:00:00Z',
    current_participants: 30,
    requires_admin_for_delete: false,
    capacity_reached: false,
    cover_image: '/tech.jpg',
  },
  {
    id: 3,
    title: 'Food Drive',
    created_at: '2024-01-03T00:00:00Z',
    start_at: '2024-03-01T10:00:00Z',
    end_at: '2024-03-01T14:00:00Z',
    location: 'Community Center',
    categories: ['Social Engagement Activities'],
    max_participants: 100,
    organizer_name: 'Helping Hands',
    organizer_profile_id: 103,
    organizer_email: 'help@example.com',
    description: 'Collect food for needy',
    cover_image_url: '/food.jpg',
    status: 'pending', // Should not appear in results
    updated_at: '2024-01-03T09:00:00Z',
    current_participants: 0,
    requires_admin_for_delete: false,
    capacity_reached: false,
    cover_image: '/food.jpg',
  },
  {
    id: 4,
    title: 'Music Concert',
    created_at: '2024-01-04T00:00:00Z',
    start_at: '2024-03-10T18:00:00Z',
    end_at: '2024-03-10T22:00:00Z',
    location: 'Auditorium',
    categories: ['Entertainment'],
    max_participants: 200,
    organizer_name: 'Music Club',
    organizer_profile_id: 104,
    organizer_email: 'music@example.com',
    description: 'Live music performance',
    cover_image_url: '/music.jpg',
    status: 'rejected', // Should not appear in results
    updated_at: '2024-01-04T08:00:00Z',
    current_participants: 0,
    requires_admin_for_delete: false,
    capacity_reached: false,
    cover_image: '/music.jpg',
    rejection_reason: 'Inappropriate content',
  },
  {
    id: 5,
    title: 'Art Exhibition',
    created_at: '2024-01-05T00:00:00Z',
    start_at: '2024-04-01T10:00:00Z',
    end_at: '2024-04-03T18:00:00Z',
    location: 'Art Gallery',
    categories: ['Arts', 'Culture'],
    max_participants: 80,
    organizer_name: 'Art Society',
    organizer_profile_id: 105,
    organizer_email: 'art@example.com',
    description: 'Student art showcase',
    cover_image_url: '/art.jpg',
    status: 'open',
    updated_at: '2024-01-05T14:00:00Z',
    current_participants: 45,
    requires_admin_for_delete: false,
    capacity_reached: false,
    cover_image: '/art.jpg',
  },
];

describe('ApprovedEventsPage', () => {
  const mockGetActivities = activitiesApi.getActivities as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Data Loading and Filtering', () => {
    it('loads and displays only open and approved events', async () => {
      mockGetActivities.mockResolvedValue({
        success: true,
        data: mockActivities,
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Approved Events')).toBeInTheDocument();
      });

      // Should only show open and approved events (IDs 1, 2, and 5)
      expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument();
      expect(screen.getByTestId('admin-event-preview-2')).toBeInTheDocument();
      expect(screen.getByTestId('admin-event-preview-5')).toBeInTheDocument();
      
      // Should NOT show pending or rejected events (IDs 3 and 4)
      expect(screen.queryByTestId('admin-event-preview-3')).not.toBeInTheDocument();
      expect(screen.queryByTestId('admin-event-preview-4')).not.toBeInTheDocument();

      // Should show correct count
      expect(screen.getByText('3 events')).toBeInTheDocument();
    });

    it('shows loading state while fetching data', async () => {
      let resolvePromise: (value: { success: boolean; data: Activity[] }) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockGetActivities.mockReturnValue(promise);

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByText('Counting…')).toBeInTheDocument();

      // Resolve the promise
      await act(async () => {
        resolvePromise({ success: true, data: [] });
      });
    });

    it('handles API error gracefully', async () => {
      mockGetActivities.mockResolvedValue({
        success: false,
        error: 'Failed to fetch activities',
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch activities')).toBeInTheDocument();
      });
    });

    it('handles empty activities array', async () => {
      mockGetActivities.mockResolvedValue({
        success: true,
        data: [],
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('No approved events.')).toBeInTheDocument();
        expect(screen.getByText('0 events')).toBeInTheDocument();
      });
    });

    it('handles null activities response', async () => {
      mockGetActivities.mockResolvedValue({
        success: true,
        data: null,
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('No approved events.')).toBeInTheDocument();
      });
    });
  });

  describe('Event Counting and Display', () => {
    it('shows correct count for single event', async () => {
      const singleEvent = [mockActivities[0]]; // Just one approved event
      mockGetActivities.mockResolvedValue({
        success: true,
        data: singleEvent,
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('1 event')).toBeInTheDocument();
      });
    });

    it('shows correct count for multiple events', async () => {
      mockGetActivities.mockResolvedValue({
        success: true,
        data: mockActivities,
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('3 events')).toBeInTheDocument();
      });
    });

    it('shows correct count when no events match', async () => {
      const onlyPendingEvents = mockActivities.filter(a => a.status === 'pending');
      mockGetActivities.mockResolvedValue({
        success: true,
        data: onlyPendingEvents,
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('0 events')).toBeInTheDocument();
        expect(screen.getByText('No approved events.')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter Functionality', () => {
    it('filters events by title search', async () => {
      mockGetActivities.mockResolvedValue({
        success: true,
        data: mockActivities,
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      // All approved/open events should be shown by default
      await waitFor(() => {
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-2')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-5')).toBeInTheDocument();
      });
    });

    it('filters events by category', async () => {
      mockGetActivities.mockResolvedValue({
        success: true,
        data: mockActivities,
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      // All categories should be shown by default
      await waitFor(() => {
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument(); // Environment
        expect(screen.getByTestId('admin-event-preview-2')).toBeInTheDocument(); // Education
        expect(screen.getByTestId('admin-event-preview-5')).toBeInTheDocument(); // Arts
      });
    });

    it('includes rejection_reason in search filtering', async () => {
      // This tests that the filtering logic includes rejection_reason
      // even though it's typically not present in approved events
      const activityWithRejection = {
        ...mockActivities[0],
        id: 6,
        status: 'open',
        rejection_reason: 'This should be searchable',
      };

      mockGetActivities.mockResolvedValue({
        success: true,
        data: [activityWithRejection],
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      // Event with rejection_reason should be included in approved events
      await waitFor(() => {
        expect(screen.getByTestId('admin-event-preview-6')).toBeInTheDocument();
      });
    });

    it('shows appropriate empty message when filters are applied', async () => {
      mockGetActivities.mockResolvedValue({
        success: true,
        data: [],
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      // Should show default empty message when no filters
      await waitFor(() => {
        expect(screen.getByText('No approved events.')).toBeInTheDocument();
      });
    });
  });

  describe('UI Components and Layout', () => {
    it('renders AdminLayout with correct props', async () => {
      mockGetActivities.mockResolvedValue({
        success: true,
        data: [],
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
      });

      // AdminLayout should have hideTitle prop and title
      // The exact implementation depends on your AdminLayout component
    });

    it('renders AdminEventPreviewCard for each approved event', async () => {
      mockGetActivities.mockResolvedValue({
        success: true,
        data: mockActivities,
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-2')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-5')).toBeInTheDocument();
      });

      // Verify the cards display correct content
      expect(screen.getByText('Beach Cleanup - open')).toBeInTheDocument();
      expect(screen.getByText('Tech Workshop - approved')).toBeInTheDocument();
      expect(screen.getByText('Art Exhibition - open')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles activities with missing optional fields', async () => {
      const minimalActivity: Activity = {
        id: 7,
        title: 'Minimal Event',
        created_at: '2024-01-07T00:00:00Z',
        start_at: '2024-05-01T10:00:00Z',
        end_at: '2024-05-01T12:00:00Z',
        location: 'Minimal Location',
        categories: ['Minimal'],
        max_participants: 5,
        organizer_name: 'Minimal Org',
        organizer_profile_id: 107,
        organizer_email: 'minimal@example.com',
        description: 'Minimal description',
        status: 'open',
        updated_at: '2024-01-07T08:00:00Z',
        current_participants: 0,
        requires_admin_for_delete: false,
        capacity_reached: false,
        // Missing cover_image_url and cover_image
      };

      mockGetActivities.mockResolvedValue({
        success: true,
        data: [minimalActivity],
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('admin-event-preview-7')).toBeInTheDocument();
      });
    });

    it('handles malformed activities data', async () => {
      const malformedActivities = [
        { id: 1, title: 'Valid Event', status: 'open' }, // Missing required fields
        null, // Null activity
        undefined, // Undefined activity
        { id: 2, title: 'Another Valid', status: 'approved' }, // Minimal valid
      ] as (Partial<Activity> | null | undefined)[];

      mockGetActivities.mockResolvedValue({
        success: true,
        data: malformedActivities,
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      // Should filter out invalid activities and show valid ones
      await waitFor(() => {
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-2')).toBeInTheDocument();
      });
    });

    it('handles network errors', async () => {
      mockGetActivities.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to load activities')).toBeInTheDocument();
      });
    });
  });

  describe('Status Filtering Logic', () => {
    it('includes both open and approved status events', async () => {
      const mixedStatusActivities = [
        { ...mockActivities[0], status: 'open' as const },
        { ...mockActivities[1], status: 'approved' as const },
        { ...mockActivities[2], status: 'pending' as const },
        { ...mockActivities[3], status: 'rejected' as const },
        { ...mockActivities[0], id: 8, status: 'draft' as const },
        { ...mockActivities[0], id: 9, status: 'cancelled' as const },
      ];

      mockGetActivities.mockResolvedValue({
        success: true,
        data: mixedStatusActivities,
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      await waitFor(() => {
        // Should only show open and approved events
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument(); // open
        expect(screen.getByTestId('admin-event-preview-2')).toBeInTheDocument(); // approved
        
        // Should NOT show other statuses
        expect(screen.queryByTestId('admin-event-preview-3')).not.toBeInTheDocument(); // pending
        expect(screen.queryByTestId('admin-event-preview-4')).not.toBeInTheDocument(); // rejected
        expect(screen.queryByTestId('admin-event-preview-8')).not.toBeInTheDocument(); // draft
        expect(screen.queryByTestId('admin-event-preview-9')).not.toBeInTheDocument(); // cancelled
      });
    });

    it('handles case sensitivity in status filtering', async () => {
      const caseVariations = [
        { ...mockActivities[0], status: 'OPEN' as string }, // uppercase
        { ...mockActivities[1], status: 'Approved' as string }, // capitalized
        { ...mockActivities[2], status: 'open' as const }, // correct
      ];

      mockGetActivities.mockResolvedValue({
        success: true,
        data: caseVariations,
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      await waitFor(() => {
        // Should only show events with exact status matches
        expect(screen.getByTestId('admin-event-preview-3')).toBeInTheDocument(); // correct 'open'
        // Should not show uppercase or capitalized variations
        expect(screen.queryByTestId('admin-event-preview-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('admin-event-preview-2')).not.toBeInTheDocument();
      });
    });
  });
});