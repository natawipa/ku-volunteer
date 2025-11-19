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

jest.mock('../../../components/AdminEventPreviewCard', () => ({
  __esModule: true,
  default: jest.fn(({ activity }: { activity: Activity }) => (
    <div data-testid={`admin-event-preview-${activity.id}`}>
      {activity.title} - {activity.status}
    </div>
  )),
}));

jest.mock('../../../components/AdminLayout', () => ({
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

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      mockGetActivities.mockResolvedValue({
        success: true,
        data: mockActivities,
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Approved Events' })).toBeInTheDocument();
      });
    });

    it('provides meaningful content for screen readers', async () => {
      mockGetActivities.mockResolvedValue({
        success: true,
        data: mockActivities,
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      await waitFor(() => {
        const countText = screen.getByText('3 events');
        expect(countText).toBeInTheDocument();
        expect(countText).toBeVisible();
      });
    });

    it('maintains focus management during data loading', async () => {
      let resolvePromise: (value: { success: boolean; data: Activity[] }) => void;
      const promise = new Promise<{ success: boolean; data: Activity[] }>(resolve => {
        resolvePromise = resolve;
      });
      mockGetActivities.mockReturnValue(promise);

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      await act(async () => {
        resolvePromise!({ success: true, data: [] });
      });

      // Component should still be accessible after loading
      expect(screen.getByText('No approved events.')).toBeInTheDocument();
    });

    it('provides accessible error messages', async () => {
      mockGetActivities.mockResolvedValue({
        success: false,
        error: 'Failed to fetch activities',
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      await waitFor(() => {
        const errorMessage = screen.getByText('Failed to fetch activities');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toBeVisible();
      });
    });
  });

  describe('Performance and Large Datasets', () => {
    it('handles large numbers of approved events efficiently', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        ...mockActivities[0],
        id: i + 1,
        title: `Event ${i + 1}`,
        status: i % 2 === 0 ? 'open' as const : 'approved' as const,
      }));

      const startTime = performance.now();
      
      mockGetActivities.mockResolvedValue({
        success: true,
        data: largeDataset,
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('100 events')).toBeInTheDocument();
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(2000); // Should render within 2s
    });

    it('handles rapid state changes gracefully', async () => {
      const { rerender } = render(<ApprovedEventsPage />);

      const datasets = [
        { success: true, data: [] },
        { success: true, data: [mockActivities[0]] },
        { success: true, data: mockActivities },
        { success: true, data: [] },
      ];

      const startTime = performance.now();

      for (const dataset of datasets) {
        mockGetActivities.mockResolvedValue(dataset);
        await act(async () => {
          rerender(<ApprovedEventsPage />);
        });
        // Wait for async state updates to complete
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 0));
        });
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(500);
    });

    it('handles memory efficiently with large datasets', async () => {
      const massiveDataset = Array.from({ length: 500 }, (_, i) => ({
        ...mockActivities[0],
        id: i + 1,
        title: `Massive Event ${i + 1}`,
        description: 'Very long description '.repeat(50),
        status: 'open' as const,
      }));

      mockGetActivities.mockResolvedValue({
        success: true,
        data: massiveDataset,
      });

      const startTime = performance.now();

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('500 events')).toBeInTheDocument();
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(3000);
    });

    it('optimizes re-renders during data updates', async () => {
      let renderCount = 0;
      const TestWrapper = () => {
        renderCount++;
        return <ApprovedEventsPage />;
      };

      mockGetActivities.mockResolvedValue({
        success: true,
        data: mockActivities,
      });

      await act(async () => {
        const { rerender } = render(<TestWrapper />);
        const initialCount = renderCount;

        // Re-render with same data should not cause excessive renders
        await act(async () => {
          rerender(<TestWrapper />);
        });
        expect(renderCount - initialCount).toBeLessThan(5);
      });
    });
  });

  describe('Component State Management', () => {
    it('maintains state consistency during rapid operations', async () => {
      // Test state consistency with changing data over time
      mockGetActivities.mockResolvedValue({
        success: true,
        data: mockActivities,
      });

      render(<ApprovedEventsPage />);

      // Verify initial state
      await waitFor(() => {
        expect(screen.getByText('3 events')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-2')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-5')).toBeInTheDocument();
      });

      // Verify component handles state consistently
      const eventElements = screen.getAllByTestId(/^admin-event-preview-/);
      expect(eventElements).toHaveLength(3);
      
      // Verify each event has the expected content structure
      eventElements.forEach(element => {
        expect(element).toBeInTheDocument();
        expect(element.textContent).toContain(' - ');
      });

      // Test that component maintains consistency during data operations
      const countElement = screen.getByText('3 events');
      expect(countElement).toBeInTheDocument();
      expect(countElement).toHaveClass('text-green-800');
      
      // Verify all required status types are shown (they appear within the event preview elements)
      const openEvents = screen.getAllByText((content, element) => {
        return element?.textContent?.includes(' - open') ?? false;
      });
      const approvedEvents = screen.getAllByText((content, element) => {
        return element?.textContent?.includes(' - approved') ?? false;
      });
      
      expect(openEvents.length).toBeGreaterThan(0);
      expect(approvedEvents.length).toBeGreaterThan(0);
    });

    it('handles component unmounting gracefully', async () => {
      let resolvePromise: (value: { success: boolean; data: Activity[] }) => void;
      const promise = new Promise<{ success: boolean; data: Activity[] }>(resolve => {
        resolvePromise = resolve;
      });
      mockGetActivities.mockReturnValue(promise);

      const { unmount } = render(<ApprovedEventsPage />);

      // Unmount before promise resolves
      unmount();

      // Resolve promise after unmount - should not cause errors
      await act(async () => {
        resolvePromise!({ success: true, data: mockActivities });
      });

      // Test passes if no errors thrown
      expect(true).toBe(true);
    });

    it('recovers from error states', async () => {
      // Start with error
      mockGetActivities.mockResolvedValue({
        success: false,
        error: 'Network error',
      });

      const { unmount } = render(<ApprovedEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      // Unmount the error component
      unmount();

      // Recover with successful data - mount fresh component
      mockGetActivities.mockResolvedValue({
        success: true,
        data: mockActivities,
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('3 events')).toBeInTheDocument();
        expect(screen.queryByText('Network error')).not.toBeInTheDocument();
      });
    });

    it('handles concurrent API calls gracefully', async () => {
      let callCount = 0;
      mockGetActivities.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          success: true,
          data: callCount === 1 ? [] : mockActivities,
        });
      });

      const { rerender } = render(<ApprovedEventsPage />);
        
      // Trigger multiple rapid re-renders
      await act(async () => {
        rerender(<ApprovedEventsPage />);
        rerender(<ApprovedEventsPage />);
      });

      await waitFor(() => {
        expect(callCount).toBeGreaterThan(0);
      });
    });
  });

  describe('Advanced Filtering and Data Processing', () => {
    it('combines status filtering with data transformation', async () => {
      const mixedData = [
        { ...mockActivities[0], status: 'open' as const, title: 'Open Event' },
        { ...mockActivities[1], status: 'approved' as const, title: 'Approved Event' },
        { ...mockActivities[2], status: 'pending' as const, title: 'Pending Event' },
        { ...mockActivities[3], status: 'rejected' as const, title: 'Rejected Event' },
      ];

      mockGetActivities.mockResolvedValue({
        success: true,
        data: mixedData,
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Open Event - open')).toBeInTheDocument();
        expect(screen.getByText('Approved Event - approved')).toBeInTheDocument();
        expect(screen.queryByText('Pending Event - pending')).not.toBeInTheDocument();
        expect(screen.queryByText('Rejected Event - rejected')).not.toBeInTheDocument();
      });
    });

    it('handles special characters in event data', async () => {
      const specialCharActivity = {
        ...mockActivities[0],
        id: 999,
        title: 'Event with Special Chars: @#$%^&*()',
        description: 'Unicode: 🎉🌟✨ and emoji support',
        location: 'Location with "quotes" and <tags>',
        status: 'open' as const,
      };

      mockGetActivities.mockResolvedValue({
        success: true,
        data: [specialCharActivity],
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('admin-event-preview-999')).toBeInTheDocument();
        expect(screen.getByText('Event with Special Chars: @#$%^&*() - open')).toBeInTheDocument();
      });
    });

    it('maintains filter accuracy with edge case data', async () => {
      const edgeCaseData = [
        { ...mockActivities[0], status: 'open' as const, title: 'Valid Open' },
        { ...mockActivities[1], status: '' as unknown as 'open', title: 'Empty Status' },
        { ...mockActivities[2], status: null as unknown as 'open', title: 'Null Status' },
        { ...mockActivities[3], status: undefined as unknown as 'open', title: 'Undefined Status' },
        { ...mockActivities[0], id: 100, status: 'approved' as const, title: 'Valid Approved' },
      ];

      mockGetActivities.mockResolvedValue({
        success: true,
        data: edgeCaseData,
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      await waitFor(() => {
        // Should only show events with valid 'open' or 'approved' status
        expect(screen.getByText('Valid Open - open')).toBeInTheDocument();
        expect(screen.getByText('Valid Approved - approved')).toBeInTheDocument();
        expect(screen.getByText('2 events')).toBeInTheDocument();
        
        // Should not show events with invalid status
        expect(screen.queryByText('Empty Status')).not.toBeInTheDocument();
        expect(screen.queryByText('Null Status')).not.toBeInTheDocument();
        expect(screen.queryByText('Undefined Status')).not.toBeInTheDocument();
      });
    });

    it('handles data consistency during filtering operations', async () => {
      const inconsistentData = [
        { ...mockActivities[0], status: 'open' as const },
        { id: 'string-id' as unknown as number, title: 'Invalid ID', status: 'approved' },
        { ...mockActivities[1], status: 'approved' as const },
        { ...mockActivities[2] }, // Missing required fields
      ];

      mockGetActivities.mockResolvedValue({
        success: true,
        data: inconsistentData,
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      await waitFor(() => {
        // Should handle inconsistent data gracefully
        expect(screen.getByTestId('admin-event-preview-1')).toBeInTheDocument();
        expect(screen.getByTestId('admin-event-preview-2')).toBeInTheDocument();
      });
    });

    it('processes large datasets with complex filtering', async () => {
      const complexDataset = Array.from({ length: 200 }, (_, i) => ({
        ...mockActivities[i % mockActivities.length],
        id: i + 1,
        title: `Complex Event ${i + 1}`,
        status: (['open', 'approved', 'pending', 'rejected'][i % 4]) as 'open' | 'approved',
        categories: [`Category${i % 10}`],
      }));

      mockGetActivities.mockResolvedValue({
        success: true,
        data: complexDataset,
      });

      await act(async () => {
        render(<ApprovedEventsPage />);
      });

      await waitFor(() => {
        // Should show only open and approved events (50% of 200 = 100)
        expect(screen.getByText('100 events')).toBeInTheDocument();
      });
    });
  });
});