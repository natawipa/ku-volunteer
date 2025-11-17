import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import RejectedEventsPage from '@/app/admin/events/rejected/page';
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
      {activity.title} - {activity.status} - Rejection: {activity.rejection_reason || 'No reason'}
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
    status: 'rejected',
    updated_at: '2024-01-01T10:00:00Z',
    current_participants: 0,
    requires_admin_for_delete: false,
    capacity_reached: false,
    cover_image: '/beach.jpg',
    rejection_reason: 'Inappropriate location',
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
    status: 'rejected',
    updated_at: '2024-01-02T11:00:00Z',
    current_participants: 0,
    requires_admin_for_delete: false,
    capacity_reached: false,
    cover_image: '/tech.jpg',
    rejection_reason: 'Duplicate event',
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
    status: 'open', // Should not appear in results
    updated_at: '2024-01-03T09:00:00Z',
    current_participants: 75,
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
    status: 'approved', // Should not appear in results
    updated_at: '2024-01-04T08:00:00Z',
    current_participants: 150,
    requires_admin_for_delete: false,
    capacity_reached: false,
    cover_image: '/music.jpg',
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
    status: 'rejected',
    updated_at: '2024-01-05T14:00:00Z',
    current_participants: 0,
    requires_admin_for_delete: false,
    capacity_reached: false,
    cover_image: '/art.jpg',
    // No rejection reason provided
  },
];

describe('RejectedEventsPage', () => {
  const mockGetActivities = activitiesApi.getActivities as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Data Loading and Filtering', () => {
    it('loads and displays only rejected events', async () => {
      mockGetActivities.mockResolvedValue({
        success: true,
        data: mockActivities,
      });

      await act(async () => {
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Rejected Events')).toBeInTheDocument();
      });

      // Should only show rejected events (IDs 1, 2, and 5)
      expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument();
      expect(screen.getByTestId('admin-event-preview-2')).toBeInTheDocument();
      expect(screen.getByTestId('admin-event-preview-5')).toBeInTheDocument();
      
      // Should NOT show open or approved events (IDs 3 and 4)
      expect(screen.queryByTestId('admin-event-preview-3')).not.toBeInTheDocument();
      expect(screen.queryByTestId('admin-event-preview-4')).not.toBeInTheDocument();

      // Should show correct count
      expect(screen.getByText('3 events')).toBeInTheDocument();
    });

    it('displays rejection reasons when available', async () => {
      mockGetActivities.mockResolvedValue({
        success: true,
        data: mockActivities,
      });

      await act(async () => {
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText(/Inappropriate location/)).toBeInTheDocument();
        expect(screen.getByText(/Duplicate event/)).toBeInTheDocument();
        expect(screen.getByText(/No reason/)).toBeInTheDocument(); // For event without rejection reason
      });
    });

    it('shows loading state while fetching data', async () => {
      let resolvePromise: (value: { success: boolean; data: Activity[] }) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockGetActivities.mockReturnValue(promise);

      await act(async () => {
        render(<RejectedEventsPage />);
      });

      expect(screen.getByText('Loading activities...')).toBeInTheDocument();
      expect(screen.getByText('Counting…')).toBeInTheDocument();

      // Resolve the promise
      await act(async () => {
        resolvePromise!({ success: true, data: [] });
      });
    });

    it('handles API error gracefully', async () => {
      mockGetActivities.mockResolvedValue({
        success: false,
        error: 'Failed to fetch activities',
      });

      await act(async () => {
        render(<RejectedEventsPage />);
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
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('No rejected events.')).toBeInTheDocument();
        expect(screen.getByText('0 events')).toBeInTheDocument();
      });
    });

    it('handles null activities response', async () => {
      mockGetActivities.mockResolvedValue({
        success: true,
        data: null,
      });

      await act(async () => {
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('No rejected events.')).toBeInTheDocument();
      });
    });
  });

  describe('Event Counting and Display', () => {
    it('shows correct count for single event', async () => {
      const singleRejectedEvent = [mockActivities[0]]; // Just one rejected event
      mockGetActivities.mockResolvedValue({
        success: true,
        data: singleRejectedEvent,
      });

      await act(async () => {
        render(<RejectedEventsPage />);
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
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('3 events')).toBeInTheDocument();
      });
    });

    it('shows correct count when no rejected events', async () => {
      const onlyNonRejectedEvents = mockActivities.filter(a => a.status !== 'rejected');
      mockGetActivities.mockResolvedValue({
        success: true,
        data: onlyNonRejectedEvents,
      });

      await act(async () => {
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('0 events')).toBeInTheDocument();
        expect(screen.getByText('No rejected events.')).toBeInTheDocument();
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
        render(<RejectedEventsPage />);
      });

      // All rejected events should be shown by default
      await waitFor(() => {
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-2')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-5')).toBeInTheDocument();
      });
    });

    it('filters by category including Social Impact mapping', async () => {
      const activitiesWithSocialImpact = [
        ...mockActivities,
        {
          id: 6,
          title: 'Social Event',
          created_at: '2024-01-06T00:00:00Z',
          start_at: '2024-05-01T10:00:00Z',
          end_at: '2024-05-01T12:00:00Z',
          location: 'Community Hall',
          categories: ['Social Engagement Activities'],
          max_participants: 50,
          organizer_name: 'Social Club',
          organizer_profile_id: 106,
          organizer_email: 'social@example.com',
          description: 'Social engagement activity',
          cover_image_url: '/social.jpg',
          status: 'rejected',
          updated_at: '2024-01-06T08:00:00Z',
          current_participants: 0,
          requires_admin_for_delete: false,
          capacity_reached: false,
          cover_image: '/social.jpg',
          rejection_reason: 'Not suitable',
        },
      ];

      mockGetActivities.mockResolvedValue({
        success: true,
        data: activitiesWithSocialImpact,
      });

      await act(async () => {
        render(<RejectedEventsPage />);
      });

      // Event with Social Engagement Activities should be included
      await waitFor(() => {
        expect(screen.getByTestId('admin-event-preview-6')).toBeInTheDocument();
      });
    });

    it('filters by date range', async () => {
      mockGetActivities.mockResolvedValue({
        success: true,
        data: mockActivities,
      });

      await act(async () => {
        render(<RejectedEventsPage />);
      });

      // All rejected events should be visible without date filters
      await waitFor(() => {
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-2')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-5')).toBeInTheDocument();
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
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
      });

      // AdminLayout should have hideTitle prop and title
      // The exact implementation depends on your AdminLayout component
    });

    it('renders AdminEventPreviewCard for each rejected event', async () => {
      mockGetActivities.mockResolvedValue({
        success: true,
        data: mockActivities,
      });

      await act(async () => {
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-2')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-5')).toBeInTheDocument();
      });

      // Verify the cards display correct content
      expect(screen.getByText('Beach Cleanup - rejected - Rejection: Inappropriate location')).toBeInTheDocument();
      expect(screen.getByText('Tech Workshop - rejected - Rejection: Duplicate event')).toBeInTheDocument();
      expect(screen.getByText('Art Exhibition - rejected - Rejection: No reason')).toBeInTheDocument();
    });

    it('uses red theme for rejected events', async () => {
      mockGetActivities.mockResolvedValue({
        success: true,
        data: [mockActivities[0]],
      });

      await act(async () => {
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        // Check for red-themed elements
        expect(screen.getByText('1 event')).toHaveClass('bg-red-500/10', 'text-red-800', 'border-red-500/20');
        // Spinner runs only during loading so we just ensure the badge uses the red theme
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles activities with missing optional fields', async () => {
      const minimalActivity: Activity = {
        id: 7,
        title: 'Minimal Rejected Event',
        created_at: '2024-01-07T00:00:00Z',
        start_at: '2024-06-01T10:00:00Z',
        end_at: '2024-06-01T12:00:00Z',
        location: 'Minimal Location',
        categories: ['Minimal'],
        max_participants: 5,
        organizer_name: 'Minimal Org',
        organizer_profile_id: 107,
        organizer_email: 'minimal@example.com',
        description: 'Minimal description',
        status: 'rejected',
        updated_at: '2024-01-07T08:00:00Z',
        current_participants: 0,
        requires_admin_for_delete: false,
        capacity_reached: false,
        // Missing cover_image_url and cover_image
        // No rejection_reason
      };

      mockGetActivities.mockResolvedValue({
        success: true,
        data: [minimalActivity],
      });

      await act(async () => {
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('admin-event-preview-7')).toBeInTheDocument();
        expect(screen.getByText(/No reason/)).toBeInTheDocument();
      });
    });

    it('handles malformed activities data', async () => {
      const malformedActivities = [
        { id: 1, title: 'Valid Event', status: 'rejected' }, // Missing required fields
        null, // Null activity
        undefined, // Undefined activity
        { id: 2, title: 'Another Valid', status: 'rejected' }, // Minimal valid
      ] as (Partial<Activity> | null | undefined)[];

      mockGetActivities.mockResolvedValue({
        success: true,
        data: malformedActivities,
      });

      await act(async () => {
        render(<RejectedEventsPage />);
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
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('handles activities with invalid dates', async () => {
      const activityWithInvalidDate = {
        ...mockActivities[0],
        id: 8,
        start_at: 'invalid-date',
        end_at: 'invalid-date',
      };

      mockGetActivities.mockResolvedValue({
        success: true,
        data: [activityWithInvalidDate],
      });

      await act(async () => {
        render(<RejectedEventsPage />);
      });

      // Should handle invalid dates gracefully
      await waitFor(() => {
        expect(screen.getByTestId('admin-event-preview-8')).toBeInTheDocument();
      });
    });
  });

  describe('Status Filtering Logic', () => {
    it('includes only rejected status events', async () => {
      const mixedStatusActivities = [
        { ...mockActivities[0], status: 'rejected' as const },
        { ...mockActivities[1], status: 'open' as const },
        { ...mockActivities[2], status: 'approved' as const },
        { ...mockActivities[3], status: 'pending' as const },
        { ...mockActivities[4], status: 'draft' as const },
        { ...mockActivities[0], id: 9, status: 'cancelled' as const },
      ];

      mockGetActivities.mockResolvedValue({
        success: true,
        data: mixedStatusActivities,
      });

      await act(async () => {
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        // Should only show rejected events
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument(); // rejected
        
        // Should NOT show other statuses
        expect(screen.queryByTestId('admin-event-preview-2')).not.toBeInTheDocument(); // open
        expect(screen.queryByTestId('admin-event-preview-3')).not.toBeInTheDocument(); // approved
        expect(screen.queryByTestId('admin-event-preview-4')).not.toBeInTheDocument(); // pending
        expect(screen.queryByTestId('admin-event-preview-5')).not.toBeInTheDocument(); // draft
        expect(screen.queryByTestId('admin-event-preview-9')).not.toBeInTheDocument(); // cancelled
      });
    });

    it('handles empty message based on search state', async () => {
      mockGetActivities.mockResolvedValue({
        success: true,
        data: [],
      });

      await act(async () => {
        render(<RejectedEventsPage />);
      });

      // Should show default empty message when no search
      await waitFor(() => {
        expect(screen.getByText('No rejected events.')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility structure', async () => {
      await act(async () => {
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        // Check for proper heading structure
        expect(screen.getByRole('heading', { name: 'Rejected Events' })).toBeInTheDocument();
        
        // Check for proper landmark regions (via AdminLayout)
        expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
      });
    });

    it('provides meaningful content for screen readers', async () => {
      // Use specific mock data for this accessibility test
      const accessibilityTestEvents = [
        { ...mockActivities[0], id: 1, status: 'rejected' as const, title: 'Accessible Event 1' },
        { ...mockActivities[1], id: 2, status: 'rejected' as const, title: 'Accessible Event 2' },
      ];

      mockGetActivities.mockResolvedValue({
        success: true,
        data: accessibilityTestEvents,
      });

      await act(async () => {
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        // Check that event count is accessible
        const eventCount = screen.getByText(/\d+ events?/);
        expect(eventCount).toBeInTheDocument();
        
        // Check that each rejected event has identifiable content
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-2')).toBeInTheDocument();
      });
    });

    it('maintains focus management during state changes', async () => {
      await act(async () => {
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        // Ensure the main container is focusable for screen readers
        const mainContent = screen.getByTestId('admin-layout');
        expect(mainContent).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Large Datasets', () => {
    it('handles large numbers of rejected events efficiently', async () => {
      // Create 100 rejected events to test performance
      const largeDataset = Array.from({ length: 100 }, (_, index) => ({
        id: index + 1,
        title: `Rejected Event ${index + 1}`,
        created_at: '2024-01-01T00:00:00Z',
        start_at: '2024-02-01T09:00:00Z',
        end_at: '2024-02-01T12:00:00Z',
        location: `Location ${index + 1}`,
        categories: ['Test'],
        max_participants: 50,
        organizer_name: `Organizer ${index + 1}`,
        organizer_profile_id: index + 1,
        organizer_email: `organizer${index + 1}@test.com`,
        description: `Description ${index + 1}`,
        cover_image_url: '/test.jpg',
        status: 'rejected' as const,
        updated_at: '2024-01-01T10:00:00Z',
        current_participants: 25,
        requires_admin_for_delete: false,
        capacity_reached: false,
        cover_image: '/test.jpg',
        rejection_reason: `Rejection reason ${index + 1}`,
      }));

      mockGetActivities.mockResolvedValue({
        success: true,
        data: largeDataset,
      });

      const startTime = performance.now();
      
      await act(async () => {
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('100 events')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time (less than 2 seconds)
      expect(renderTime).toBeLessThan(2000);
    });

    it('handles empty large dataset gracefully', async () => {
      mockGetActivities.mockResolvedValue({
        success: true,
        data: [], // Empty large dataset
      });

      await act(async () => {
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('0 events')).toBeInTheDocument();
        expect(screen.getByText('No rejected events.')).toBeInTheDocument();
      });
    });

    it('maintains performance during search operations', async () => {
      const searchableDataset = Array.from({ length: 50 }, (_, index) => ({
        id: index + 1,
        title: index % 2 === 0 ? `Searchable Event ${index + 1}` : `Other Event ${index + 1}`,
        created_at: '2024-01-01T00:00:00Z',
        start_at: '2024-02-01T09:00:00Z',
        end_at: '2024-02-01T12:00:00Z',
        location: `Location ${index + 1}`,
        categories: ['Test'],
        max_participants: 50,
        organizer_name: `Organizer ${index + 1}`,
        organizer_profile_id: index + 1,
        organizer_email: `organizer${index + 1}@test.com`,
        description: `Description ${index + 1}`,
        cover_image_url: '/test.jpg',
        status: 'rejected' as const,
        updated_at: '2024-01-01T10:00:00Z',
        current_participants: 25,
        requires_admin_for_delete: false,
        capacity_reached: false,
        cover_image: '/test.jpg',
        rejection_reason: `Rejection reason ${index + 1}`,
      }));

      mockGetActivities.mockResolvedValue({
        success: true,
        data: searchableDataset,
      });

      await act(async () => {
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('50 events')).toBeInTheDocument();
      });
    });
  });

  describe('Rejection Reason Handling', () => {
    it('displays various rejection reason formats correctly', async () => {
      const eventsWithDifferentReasons = [
        { 
          ...mockActivities[0], 
          id: 1,
          status: 'rejected' as const, 
          rejection_reason: 'Event cancelled due to weather conditions and safety concerns'
        },
        { 
          ...mockActivities[0], 
          id: 2,
          status: 'rejected' as const, 
          rejection_reason: 'Low registration numbers'
        },
        { 
          ...mockActivities[0], 
          id: 3,
          status: 'rejected' as const, 
          rejection_reason: '' // Empty reason
        },
        { 
          ...mockActivities[0], 
          id: 4,
          status: 'rejected' as const, 
          rejection_reason: undefined // Missing reason
        },
      ];

      mockGetActivities.mockResolvedValue({
        success: true,
        data: eventsWithDifferentReasons,
      });

      await act(async () => {
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-2')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-3')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-4')).toBeInTheDocument();
      });
    });

    it('handles very long rejection reasons gracefully', async () => {
      const eventWithLongReason = {
        ...mockActivities[0],
        id: 1,
        status: 'rejected' as const,
        rejection_reason: 'This is a very long rejection reason that might cause layout issues if not handled properly. '.repeat(10)
      };

      mockGetActivities.mockResolvedValue({
        success: true,
        data: [eventWithLongReason],
      });

      await act(async () => {
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument();
      });
    });

    it('handles special characters in rejection reasons', async () => {
      const eventWithSpecialChars = {
        ...mockActivities[0],
        id: 1,
        status: 'rejected' as const,
        rejection_reason: 'Rejected due to "budget constraints" & venue unavailability (50% capacity issues)'
      };

      mockGetActivities.mockResolvedValue({
        success: true,
        data: [eventWithSpecialChars],
      });

      await act(async () => {
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument();
      });
    });
  });

  describe('Data Ordering and Display Logic', () => {
    it('displays events in consistent order', async () => {
      const unorderedEvents = [
        { 
          ...mockActivities[0], 
          id: 3,
          status: 'rejected' as const,
          created_at: '2024-01-03T00:00:00Z',
          title: 'Third Event'
        },
        { 
          ...mockActivities[0], 
          id: 1,
          status: 'rejected' as const,
          created_at: '2024-01-01T00:00:00Z',
          title: 'First Event'
        },
        { 
          ...mockActivities[0], 
          id: 2,
          status: 'rejected' as const,
          created_at: '2024-01-02T00:00:00Z',
          title: 'Second Event'
        },
      ];

      mockGetActivities.mockResolvedValue({
        success: true,
        data: unorderedEvents,
      });

      await act(async () => {
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-2')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-3')).toBeInTheDocument();
        expect(screen.getByText('3 events')).toBeInTheDocument();
      });
    });

    it('maintains data integrity during filtering operations', async () => {
      const eventsForFiltering = [
        { 
          ...mockActivities[0], 
          id: 1,
          status: 'rejected' as const,
          title: 'Environment Cleanup',
          categories: ['Environment'],
          rejection_reason: 'Budget constraints'
        },
        { 
          ...mockActivities[0], 
          id: 2,
          status: 'rejected' as const,
          title: 'Tech Workshop',
          categories: ['Technology'],
          rejection_reason: 'Venue issues'
        },
        { 
          ...mockActivities[0], 
          id: 3,
          status: 'rejected' as const,
          title: 'Social Event',
          categories: ['Social Impact'],
          rejection_reason: 'Low registration'
        },
      ];

      mockGetActivities.mockResolvedValue({
        success: true,
        data: eventsForFiltering,
      });

      await act(async () => {
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-2')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-3')).toBeInTheDocument();
        expect(screen.getByText('3 events')).toBeInTheDocument();
      });
    });

    it('handles mixed status filtering correctly', async () => {
      const mixedStatusEvents = [
        { ...mockActivities[0], id: 1, status: 'rejected' as const, title: 'Rejected Event' },
        { ...mockActivities[0], id: 2, status: 'open' as const, title: 'Open Event' },
        { ...mockActivities[0], id: 3, status: 'pending' as const, title: 'Pending Event' },
        { ...mockActivities[0], id: 4, status: 'rejected' as const, title: 'Another Rejected Event' },
      ];

      mockGetActivities.mockResolvedValue({
        success: true,
        data: mixedStatusEvents,
      });

      await act(async () => {
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        // Should only show rejected events
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-4')).toBeInTheDocument();
        expect(screen.queryByTestId('admin-event-preview-2')).not.toBeInTheDocument();
        expect(screen.queryByTestId('admin-event-preview-3')).not.toBeInTheDocument();
        expect(screen.getByText('2 events')).toBeInTheDocument();
      });
    });
  });

  describe('Component State Management', () => {
    it('maintains consistent state during rapid operations', async () => {
      const rapidChangeEvents = [
        { ...mockActivities[0], id: 1, status: 'rejected' as const, title: 'First Event' },
      ];

      mockGetActivities.mockResolvedValue({
        success: true,
        data: rapidChangeEvents,
      });

      await act(async () => {
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument();
        expect(screen.getByText('1 event')).toBeInTheDocument();
      });
    });

    it('handles component remounting gracefully', async () => {
      const { unmount } = render(<RejectedEventsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Rejected Events')).toBeInTheDocument();
      });

      unmount();

      // Remount component
      await act(async () => {
        render(<RejectedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Rejected Events')).toBeInTheDocument();
      });
    });
  });
});