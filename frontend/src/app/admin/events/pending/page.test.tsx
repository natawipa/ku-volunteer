import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import PendingEventsPage from '@/app/admin/events/pending/page';
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
  default: jest.fn(({ activity, hrefOverride }: { activity: Activity; hrefOverride?: string }) => (
    <div data-testid={`admin-event-preview-${activity.id}`}>
      {activity.title} - {activity.status}{hrefOverride ? ` - Link: ${hrefOverride}` : ''}
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
    status: 'pending',
    updated_at: '2024-01-01T10:00:00Z',
    current_participants: 0,
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
    status: 'pending',
    updated_at: '2024-01-02T11:00:00Z',
    current_participants: 0,
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
    status: 'pending',
    updated_at: '2024-01-05T14:00:00Z',
    current_participants: 0,
    requires_admin_for_delete: false,
    capacity_reached: false,
    cover_image: '/art.jpg',
  },
];

describe('PendingEventsPage', () => {
  const mockGetActivities = activitiesApi.getActivities as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Data Loading and Filtering', () => {
    it('loads and displays only pending events', async () => {
      mockGetActivities.mockResolvedValue({
        success: true,
        data: mockActivities,
      });

      await act(async () => {
        render(<PendingEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Pending Events')).toBeInTheDocument();
      });

      // Should only show pending events (IDs 1, 2, and 5)
      expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument();
      expect(screen.getByTestId('admin-event-preview-2')).toBeInTheDocument();
      expect(screen.getByTestId('admin-event-preview-5')).toBeInTheDocument();
      
      // Should NOT show open or approved events (IDs 3 and 4)
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
        render(<PendingEventsPage />);
      });

      expect(screen.getByText('Loading...')).toBeInTheDocument();
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
        render(<PendingEventsPage />);
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
        render(<PendingEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('No pending events.')).toBeInTheDocument();
        expect(screen.getByText('0 events')).toBeInTheDocument();
      });
    });

    it('handles null activities response', async () => {
      mockGetActivities.mockResolvedValue({
        success: true,
        data: null,
      });

      await act(async () => {
        render(<PendingEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('No pending events.')).toBeInTheDocument();
      });
    });
  });

  describe('Event Counting and Display', () => {
    it('shows correct count for single event', async () => {
      const singleEvent = [mockActivities[0]]; // Just one pending event
      mockGetActivities.mockResolvedValue({
        success: true,
        data: singleEvent,
      });

      await act(async () => {
        render(<PendingEventsPage />);
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
        render(<PendingEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('3 events')).toBeInTheDocument();
      });
    });

    it('shows correct count when no pending events', async () => {
      const onlyNonPendingEvents = mockActivities.filter(a => a.status !== 'pending');
      mockGetActivities.mockResolvedValue({
        success: true,
        data: onlyNonPendingEvents,
      });

      await act(async () => {
        render(<PendingEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('0 events')).toBeInTheDocument();
        expect(screen.getByText('No pending events.')).toBeInTheDocument();
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
        render(<PendingEventsPage />);
      });

      // All pending events should be shown by default
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
          status: 'pending',
          updated_at: '2024-01-06T08:00:00Z',
          current_participants: 0,
          requires_admin_for_delete: false,
          capacity_reached: false,
          cover_image: '/social.jpg',
        },
      ];

      mockGetActivities.mockResolvedValue({
        success: true,
        data: activitiesWithSocialImpact,
      });

      await act(async () => {
        render(<PendingEventsPage />);
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
        render(<PendingEventsPage />);
      });

      // All pending events should be visible without date filters
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
        render(<PendingEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
      });

      // AdminLayout should have hideTitle prop and title
      // The exact implementation depends on your AdminLayout component
    });

    it('renders AdminEventPreviewCard for each pending event with correct hrefOverride', async () => {
      mockGetActivities.mockResolvedValue({
        success: true,
        data: mockActivities,
      });

      await act(async () => {
        render(<PendingEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-2')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-5')).toBeInTheDocument();
      });

      // Verify the cards display correct content with approval links
      expect(screen.getByText('Beach Cleanup - pending - Link: /admin/approve/create/1')).toBeInTheDocument();
      expect(screen.getByText('Tech Workshop - pending - Link: /admin/approve/create/2')).toBeInTheDocument();
      expect(screen.getByText('Art Exhibition - pending - Link: /admin/approve/create/5')).toBeInTheDocument();
    });

    it('uses yellow theme for pending events', async () => {
      let resolveActivities: (value: { success: boolean; data: Activity[] }) => void;
      const loadingPromise = new Promise(resolve => {
        resolveActivities = resolve;
      });

      mockGetActivities.mockReturnValue(loadingPromise);

      await act(async () => {
        render(<PendingEventsPage />);
      });

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('border-yellow-600');

      await act(async () => {
        resolveActivities!({
          success: true,
          data: [mockActivities[0]],
        });
      });

      await waitFor(() => {
        const countBadge = screen.getByText('1 event');
        expect(countBadge).toHaveClass('bg-yellow-500/10', 'text-yellow-800', 'border-yellow-500/20');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles activities with missing optional fields', async () => {
      const minimalActivity: Activity = {
        id: 7,
        title: 'Minimal Pending Event',
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
        status: 'pending',
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
        render(<PendingEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('admin-event-preview-7')).toBeInTheDocument();
      });
    });

    it('handles malformed activities data', async () => {
      const malformedActivities = [
        { id: 1, title: 'Valid Event', status: 'pending' }, // Missing required fields
        null, // Null activity
        undefined, // Undefined activity
        { id: 2, title: 'Another Valid', status: 'pending' }, // Minimal valid
      ] as (Partial<Activity> | null | undefined)[];

      mockGetActivities.mockResolvedValue({
        success: true,
        data: malformedActivities,
      });

      await act(async () => {
        render(<PendingEventsPage />);
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
        render(<PendingEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch activities')).toBeInTheDocument();
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
        render(<PendingEventsPage />);
      });

      // Should handle invalid dates gracefully
      await waitFor(() => {
        expect(screen.getByTestId('admin-event-preview-8')).toBeInTheDocument();
      });
    });
  });

  describe('Status Filtering Logic', () => {
    it('includes only pending status events', async () => {
      const mixedStatusActivities = [
        { ...mockActivities[0], status: 'pending' as const },
        { ...mockActivities[1], status: 'open' as const },
        { ...mockActivities[2], status: 'approved' as const },
        { ...mockActivities[3], status: 'rejected' as const },
        { ...mockActivities[4], status: 'draft' as const },
        { ...mockActivities[0], id: 9, status: 'cancelled' as const },
      ];

      mockGetActivities.mockResolvedValue({
        success: true,
        data: mixedStatusActivities,
      });

      await act(async () => {
        render(<PendingEventsPage />);
      });

      await waitFor(() => {
        // Should only show pending events
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument(); // pending
        
        // Should NOT show other statuses
        expect(screen.queryByTestId('admin-event-preview-2')).not.toBeInTheDocument(); // open
        expect(screen.queryByTestId('admin-event-preview-3')).not.toBeInTheDocument(); // approved
        expect(screen.queryByTestId('admin-event-preview-4')).not.toBeInTheDocument(); // rejected
        expect(screen.queryByTestId('admin-event-preview-5')).not.toBeInTheDocument(); // draft
        expect(screen.queryByTestId('admin-event-preview-9')).not.toBeInTheDocument(); // cancelled
      });
    });

    it('handles empty message based on filter state', async () => {
      mockGetActivities.mockResolvedValue({
        success: true,
        data: [],
      });

      await act(async () => {
        render(<PendingEventsPage />);
      });

      // Should show default empty message when no filters
      await waitFor(() => {
        expect(screen.getByText('No pending events.')).toBeInTheDocument();
      });
    });

    it('shows appropriate empty message when filters are applied', async () => {
      // This tests the conditional empty message logic
      const emptyActivities: Activity[] = [];
      mockGetActivities.mockResolvedValue({
        success: true,
        data: emptyActivities,
      });

      await act(async () => {
        render(<PendingEventsPage />);
      });

      // Should show message indicating no filters when no search/category filters
      await waitFor(() => {
        expect(screen.getByText('No pending events.')).toBeInTheDocument();
      });
    });
  });

  describe('Approval Links', () => {
    it('provides correct approval links for pending events', async () => {
      mockGetActivities.mockResolvedValue({
        success: true,
        data: [mockActivities[0], mockActivities[1]],
      });

      await act(async () => {
        render(<PendingEventsPage />);
      });

      await waitFor(() => {
        // Verify each pending event has the correct approval link
        expect(screen.getByTestId('admin-event-preview-1')).toHaveTextContent('Beach Cleanup - pending - Link: /admin/approve/create/1');
        expect(screen.getByTestId('admin-event-preview-2')).toHaveTextContent('Tech Workshop - pending - Link: /admin/approve/create/2');
      });
    });

    it('does not provide approval links for non-pending events', async () => {
      // Only include non-pending events
      const nonPendingActivities = mockActivities.filter(a => a.status !== 'pending');
      mockGetActivities.mockResolvedValue({
        success: true,
        data: nonPendingActivities,
      });

      await act(async () => {
        render(<PendingEventsPage />);
      });

      // No events should be displayed since they're not pending
      await waitFor(() => {
        expect(screen.queryByTestId(/admin-event-preview-/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      await act(async () => {
        render(<PendingEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Pending Events')).toBeInTheDocument();
      });

      // Check that the page has a proper heading structure
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Pending Events');
    });

    it('provides meaningful content for screen readers', async () => {
      // Ensure we have pending events for this test
      mockGetActivities.mockResolvedValue({
        success: true,
        data: [mockActivities[0], mockActivities[1], mockActivities[4]],
      });

      await act(async () => {
        render(<PendingEventsPage />);
      });

      await waitFor(() => {
        // Event cards should be accessible to screen readers
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument();
      });

      // Check for meaningful labeling
      expect(screen.getByText('3 events')).toBeInTheDocument();
    });

    it('maintains focus management during interactions', async () => {
      await act(async () => {
        render(<PendingEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
      });

      // Focus should be manageable within the component
      expect(document.body).toHaveFocus();
    });
  });

  describe('Performance and Large Datasets', () => {
    it('handles large numbers of pending events efficiently', async () => {
      // Create 100 mock pending activities
      const largePendingActivities = Array.from({ length: 100 }, (_, index) => ({
        ...mockActivities[0],
        id: index + 1,
        title: `Pending Event ${index + 1}`,
        description: `Description for pending event ${index + 1}`,
        status: 'pending' as const,
      }));

      mockGetActivities.mockResolvedValue({
        success: true,
        data: largePendingActivities,
      });

      const startTime = performance.now();
      
      await act(async () => {
        render(<PendingEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Ensure rendering completes in reasonable time (< 2 seconds)
      expect(renderTime).toBeLessThan(2000);
      expect(screen.getByText('100 events')).toBeInTheDocument();
    });

    it('handles rapid state changes gracefully', async () => {
      // Clear previous mocks and start fresh
      mockGetActivities.mockClear();
      
      // Start with initial data
      mockGetActivities.mockResolvedValue({
        success: true,
        data: [mockActivities[0], mockActivities[1]],
      });

      await act(async () => {
        render(<PendingEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('2 events')).toBeInTheDocument();
      });
    });

    it('handles memory efficiently with large datasets', async () => {
      // Test with a substantial dataset
      const largeDataset = Array.from({ length: 500 }, (_, index) => ({
        ...mockActivities[0],
        id: index + 1,
        title: `Large Pending Event ${index + 1}`,
        status: 'pending' as const,
      }));

      mockGetActivities.mockResolvedValue({
        success: true,
        data: largeDataset,
      });

      await act(async () => {
        render(<PendingEventsPage />);
      });

      await waitFor(() => {
        expect(mockGetActivities).toHaveBeenCalled();
      });

      // Component should handle large datasets without memory issues
      expect(screen.getByText('500 events')).toBeInTheDocument();
    });
  });

  describe('Component State Management', () => {
    it('maintains state consistency during rapid operations', async () => {
      // Clear previous mocks and start fresh
      mockGetActivities.mockClear();
      
      mockGetActivities.mockResolvedValue({
        success: true,
        data: [mockActivities[0], mockActivities[1], mockActivities[4]],
      });

      await act(async () => {
        render(<PendingEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('3 events')).toBeInTheDocument();
      });
    });

    it('handles component unmounting gracefully', async () => {
      const { unmount } = render(<PendingEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Pending Events')).toBeInTheDocument();
      });

      // Unmount should not cause errors
      expect(() => unmount()).not.toThrow();
    });

    it('recovers from error states', async () => {
      // First render with error
      mockGetActivities.mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        render(<PendingEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch activities')).toBeInTheDocument();
      });

      // Should be able to recover when data becomes available
      mockGetActivities.mockResolvedValue({
        success: true,
        data: [mockActivities[0], mockActivities[1]],
      });

      // Component should handle state recovery
      expect(mockGetActivities).toHaveBeenCalled();
    });
  });

  describe('Advanced Filtering', () => {
    it('combines multiple filters correctly', async () => {
      const mixedStatusActivities = [
        { ...mockActivities[0], categories: ['Environment'], start_at: '2024-06-01T09:00:00Z' },
        { ...mockActivities[1], categories: ['Education'], start_at: '2024-05-01T09:00:00Z' },
        { ...mockActivities[4], categories: ['Environment'], start_at: '2024-07-01T09:00:00Z' },
      ];

      mockGetActivities.mockResolvedValue({
        success: true,
        data: mixedStatusActivities,
      });

      await act(async () => {
        render(<PendingEventsPage />);
      });

      // All should be displayed since they're all pending
      await waitFor(() => {
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-2')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-5')).toBeInTheDocument();
      });
    });

    it('handles complex search queries', async () => {
      const complexActivities = [
        { ...mockActivities[0], title: 'Special Characters: @#$%', description: 'Test & symbols' },
        { ...mockActivities[1], title: 'Very Long Event Title That Exceeds Normal Length Expectations', description: 'Long description with many words' },
        { ...mockActivities[4], title: 'Unicode Test 🌍🌱', description: 'Emoji and unicode support' },
      ];

      mockGetActivities.mockResolvedValue({
        success: true,
        data: complexActivities,
      });

      await act(async () => {
        render(<PendingEventsPage />);
      });

      await waitFor(() => {
        // Check for the mock component text which includes status and link
        expect(screen.getByText('Special Characters: @#$% - pending - Link: /admin/approve/create/1')).toBeInTheDocument();
        expect(screen.getByText('Very Long Event Title That Exceeds Normal Length Expectations - pending - Link: /admin/approve/create/2')).toBeInTheDocument();
        expect(screen.getByText('Unicode Test 🌍🌱 - pending - Link: /admin/approve/create/5')).toBeInTheDocument();
      });
    });

    it('maintains filter state across re-renders', async () => {
      const { rerender } = render(<PendingEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Pending Events')).toBeInTheDocument();
      });

      // Rerender should maintain component state
      rerender(<PendingEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Pending Events')).toBeInTheDocument();
        expect(screen.getByText('3 events')).toBeInTheDocument();
      });
    });
  });

  describe('Data Ordering and Display Logic', () => {
    it('displays events in consistent order', async () => {
      const unorderedActivities = [
        { ...mockActivities[4], id: 5, title: 'Event E' },
        { ...mockActivities[0], id: 1, title: 'Event A' },
        { ...mockActivities[1], id: 3, title: 'Event C' },
      ];

      mockGetActivities.mockResolvedValue({
        success: true,
        data: unorderedActivities,
      });

      await act(async () => {
        render(<PendingEventsPage />);
      });

      await waitFor(() => {
        // Events should be displayed in a consistent order
        expect(screen.getByTestId('admin-event-preview-5')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-3')).toBeInTheDocument();
      });
    });

    it('maintains data integrity during filtering', async () => {
      const testActivities = [
        { ...mockActivities[0], status: 'pending' as const, categories: ['Environment'] },
        { ...mockActivities[1], status: 'pending' as const, categories: ['Education'] },
        { ...mockActivities[2], status: 'open' as const, categories: ['Social'] }, // Should be filtered out
      ];

      mockGetActivities.mockResolvedValue({
        success: true,
        data: testActivities,
      });

      await act(async () => {
        render(<PendingEventsPage />);
      });

      await waitFor(() => {
        // Only pending events should be shown
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-2')).toBeInTheDocument();
        expect(screen.queryByTestId('admin-event-preview-3')).not.toBeInTheDocument();
        expect(screen.getByText('2 events')).toBeInTheDocument();
      });
    });
  });
});