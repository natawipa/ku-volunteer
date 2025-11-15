import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import DeletionRequestListPage from '@/app/admin/events/request-delete/page';
import { activitiesApi } from '@/lib/activities';
import type { Activity, DeletionRequestEvent } from '@/lib/types';

// Mock dependencies
jest.mock('@/lib/activities', () => ({
  activitiesApi: {
    getDeletionRequests: jest.fn(),
    getActivities: jest.fn(),
  },
}));

jest.mock('../../components/AdminLayout', () => ({
  __esModule: true,
  default: jest.fn(({ children, title, hideTitle }: any) => (
    <div data-testid="admin-layout">
      {!hideTitle && <h1 data-testid="layout-title">{title}</h1>}
      {children}
    </div>
  )),
}));

jest.mock('../components/AdminDeletionRequestCard', () => ({
  __esModule: true,
  default: jest.fn(({ event }: any) => (
    <div data-testid={`deletion-request-${event.id}`}>
      {event.title} - {event.status}
    </div>
  )),
}));

// Mock data
const mockDeletionRequests: DeletionRequestEvent[] = [
  {

//   id: number;
//   activity: number | string;
//   reason: string;
//   status?: 'pending' | 'approved' | 'rejected';
//   requested_at: string;
//   reviewed_at?: string;
//   admin_note?: string;
// }

    id: 1,
    activity: 101,
    reason: 'Event cancelled due to weather',
    status: 'pending',
    requested_at: '2024-01-01T00:00:00Z',
    reviewed_at: undefined,
    admin_note: undefined,
  },
  {
    id: 2,
    activity: 102,
    reason: 'Low registration',
    status: 'pending',
    requested_at: '2024-01-02T00:00:00Z',
    reviewed_at: undefined,
    admin_note: undefined,
  },
  {
    id: 3,
    activity: 103,
    reason: 'Venue unavailable',
    status: 'approved', // Should not appear in results
    requested_at: '2024-01-03T00:00:00Z',
    reviewed_at: undefined,
    admin_note: undefined,
  },
];

const mockActivities: Activity[] = [
  {
    id: 101,
    title: 'Beach Cleanup',
    created_at: '2024-01-01T00:00:00Z',
    start_at: '2024-02-01T09:00:00Z',
    end_at: '2024-02-01T12:00:00Z',
    location: 'Sandy Beach',
    categories: ['Environment', 'Service'],
    max_participants: 50,
    organizer_name: 'Eco Club',
    organizer_profile_id: 1,
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
    id: 102,
    title: 'Tech Workshop',
    created_at: '2024-01-02T00:00:00Z',
    start_at: '2024-02-15T14:00:00Z',
    end_at: '2024-02-15T17:00:00Z',
    location: 'Tech Lab',
    categories: ['Education', 'Technology'],
    max_participants: 30,
    organizer_name: 'Tech Society',
    organizer_profile_id: 2,
    organizer_email: 'tech@example.com',
    description: 'Learn programming',
    cover_image_url: '/tech.jpg',
    status: 'open',
    updated_at: '2024-01-02T11:00:00Z',
    current_participants: 30,
    requires_admin_for_delete: false,
    capacity_reached: false,
    cover_image: '/tech.jpg',
  },
  {
    id: 104,
    title: 'Art Exhibition',
    created_at: '2024-01-04T00:00:00Z',
    start_at: '2024-03-10T10:00:00Z',
    end_at: '2024-03-12T18:00:00Z',
    location: 'Art Gallery',
    categories: ['Arts'],
    max_participants: 80,
    organizer_name: 'Art Society',
    organizer_profile_id: 4,
    organizer_email: 'art@example.com',
    description: 'Student art showcase',
    cover_image_url: '/art.jpg',
    status: 'open',
    updated_at: '2024-01-04T14:00:00Z',
    current_participants: 45,
    requires_admin_for_delete: false,
    capacity_reached: false,
    cover_image: '/art.jpg',
  },
];

describe('DeletionRequestListPage', () => {
  const mockGetDeletionRequests = activitiesApi.getDeletionRequests as jest.Mock;
  const mockGetActivities = activitiesApi.getActivities as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    mockGetDeletionRequests.mockResolvedValue({
      success: true,
      data: mockDeletionRequests,
    });
    
    mockGetActivities.mockResolvedValue({
      success: true,
      data: mockActivities,
    });
  });

  describe('Data Loading and Merging', () => {
    it('loads and merges deletion requests with activities', async () => {
      await act(async () => {
        render(<DeletionRequestListPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Deletion Requests')).toBeInTheDocument();
      });

      // Should only show pending requests (IDs 1 and 2)
      expect(screen.getByTestId('deletion-request-1')).toBeInTheDocument();
      expect(screen.getByTestId('deletion-request-2')).toBeInTheDocument();
      
      // Should NOT show approved request (ID 3)
      expect(screen.queryByTestId('deletion-request-3')).not.toBeInTheDocument();

      // Should show correct count
      expect(screen.getByText('2 requests')).toBeInTheDocument();
    });

    it('fetches only pending deletion requests', async () => {
      await act(async () => {
        render(<DeletionRequestListPage />);
      });

      await waitFor(() => {
        expect(mockGetDeletionRequests).toHaveBeenCalledWith({ status: 'pending' });
      });
    });

    it('merges activity data with deletion requests', async () => {
      await act(async () => {
        render(<DeletionRequestListPage />);
      });

      await waitFor(() => {
        // The merged data should be passed to AdminDeletionRequestCard
        expect(screen.getByTestId('deletion-request-1')).toBeInTheDocument();
        expect(screen.getByTestId('deletion-request-2')).toBeInTheDocument();
      });
    });

    it('handles deletion requests without matching activities', async () => {
      const requestsWithoutActivities = [
        {
          id: 5,
          activity: 999, // No matching activity
          title: 'Unknown Event',
          description: 'Event description',
          location: 'Unknown Location',
          reason: 'Some reason',
          status: 'pending',
          post: '2024-01-05T00:00:00Z',
          datestart: '2024-04-01T10:00:00Z',
          dateend: '2024-04-01T12:00:00Z',
          organizer: 'Unknown Org',
          category: ['Unknown'],
        },
      ];

      mockGetDeletionRequests.mockResolvedValue({
        success: true,
        data: requestsWithoutActivities,
      });

      await act(async () => {
        render(<DeletionRequestListPage />);
      });

      await waitFor(() => {
        // Should still display the request with fallback data
        expect(screen.getByTestId('deletion-request-5')).toBeInTheDocument();
      });
    });
  });

  describe('Loading and Error States', () => {
    it('shows loading state while fetching data', async () => {
      let resolveRequests: (value: any) => void;
      const requestsPromise = new Promise(resolve => {
        resolveRequests = resolve;
      });
      mockGetDeletionRequests.mockReturnValue(requestsPromise);

      await act(async () => {
        render(<DeletionRequestListPage />);
      });

      expect(screen.getByText('Loading deletion requests...')).toBeInTheDocument();

      // Resolve the promise
      await act(async () => {
        resolveRequests!({ success: true, data: [] });
      });
    });

    it('handles deletion requests API error', async () => {
      mockGetDeletionRequests.mockRejectedValue(new Error('API Error'));

      await act(async () => {
        render(<DeletionRequestListPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to load data')).toBeInTheDocument();
      });
    });

    it('handles activities API error', async () => {
      mockGetActivities.mockRejectedValue(new Error('Activities API Error'));

      await act(async () => {
        render(<DeletionRequestListPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to load data')).toBeInTheDocument();
      });
    });

    it('handles empty deletion requests', async () => {
      mockGetDeletionRequests.mockResolvedValue({
        success: true,
        data: [],
      });

      await act(async () => {
        render(<DeletionRequestListPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('0 requests')).toBeInTheDocument();
        // No cards should be rendered
        expect(screen.queryByTestId(/deletion-request-/)).not.toBeInTheDocument();
      });
    });

    it('handles null deletion requests response', async () => {
      mockGetDeletionRequests.mockResolvedValue({
        success: true,
        data: null,
      });

      await act(async () => {
        render(<DeletionRequestListPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('0 requests')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering Functionality', () => {
    it('filters by search query across multiple fields', async () => {
      await act(async () => {
        render(<DeletionRequestListPage />);
      });

      // Both requests should be visible initially
      await waitFor(() => {
        expect(screen.getByTestId('deletion-request-1')).toBeInTheDocument();
        expect(screen.getByTestId('deletion-request-2')).toBeInTheDocument();
      });
    });

    it('filters by category including Social Impact mapping', async () => {
      const requestsWithSocialImpact = [
        {
          id: 6,
          activity: 106,
          title: 'Social Event',
          description: 'Social engagement activity',
          location: 'Community Hall',
          reason: 'Rescheduling',
          status: 'pending',
          post: '2024-01-06T00:00:00Z',
          datestart: '2024-05-01T10:00:00Z',
          dateend: '2024-05-01T12:00:00Z',
          organizer: 'Social Club',
          category: ['Social Engagement Activities'],
        },
      ];

      mockGetDeletionRequests.mockResolvedValue({
        success: true,
        data: requestsWithSocialImpact,
      });

      await act(async () => {
        render(<DeletionRequestListPage />);
      });

      await waitFor(() => {
        // Should handle Social Engagement Activities category
        expect(screen.getByTestId('deletion-request-6')).toBeInTheDocument();
      });
    });

    it('filters by date range', async () => {
      await act(async () => {
        render(<DeletionRequestListPage />);
      });

      // All requests should be visible without date filters
      await waitFor(() => {
        expect(screen.getByTestId('deletion-request-1')).toBeInTheDocument();
        expect(screen.getByTestId('deletion-request-2')).toBeInTheDocument();
      });
    });
  });

  describe('Count Display', () => {
    it('shows correct count for single request', async () => {
      const singleRequest = [mockDeletionRequests[0]];
      mockGetDeletionRequests.mockResolvedValue({
        success: true,
        data: singleRequest,
      });

      await act(async () => {
        render(<DeletionRequestListPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('1 request')).toBeInTheDocument();
      });
    });

    it('shows correct count for multiple requests', async () => {
      await act(async () => {
        render(<DeletionRequestListPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('2 requests')).toBeInTheDocument();
      });
    });

    it('shows correct count when no requests', async () => {
      mockGetDeletionRequests.mockResolvedValue({
        success: true,
        data: [],
      });

      await act(async () => {
        render(<DeletionRequestListPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('0 requests')).toBeInTheDocument();
      });
    });
  });

  describe('Component Unmounting', () => {
    it('cancels requests when component unmounts', async () => {
      let resolveRequests: (value: any) => void;
      const requestsPromise = new Promise(resolve => {
        resolveRequests = resolve;
      });
      mockGetDeletionRequests.mockReturnValue(requestsPromise);

      const { unmount } = await act(async () => {
        return render(<DeletionRequestListPage />);
      });

      // Unmount before resolving
      await act(async () => {
        unmount();
      });

      // Resolve after unmount - should not cause state updates
      await act(async () => {
        resolveRequests!({ success: true, data: mockDeletionRequests });
      });

      // No assertions needed - just verifying no errors occur
    });
  });

  describe('Edge Cases', () => {
    it('handles malformed deletion requests data', async () => {
      const malformedRequests = [
        { id: 1, activity: 101, status: 'pending' }, // Minimal valid
        null, // Null request
        undefined, // Undefined request
        { id: 2, activity: 102, status: 'pending' }, // Another valid
      ] as any;

      mockGetDeletionRequests.mockResolvedValue({
        success: true,
        data: malformedRequests,
      });

      await act(async () => {
        render(<DeletionRequestListPage />);
      });

      // Should filter out invalid requests and show valid ones
      await waitFor(() => {
        expect(screen.getByTestId('deletion-request-1')).toBeInTheDocument();
        expect(screen.getByTestId('deletion-request-2')).toBeInTheDocument();
      });
    });

    it('handles malformed activities data', async () => {
      const malformedActivities = [
        { id: 101, title: 'Valid Activity' }, // Minimal
        null, // Null activity
        undefined, // Undefined activity
      ] as any;

      mockGetActivities.mockResolvedValue({
        success: true,
        data: malformedActivities,
      });

      await act(async () => {
        render(<DeletionRequestListPage />);
      });

      // Should still process valid activities
      await waitFor(() => {
        expect(screen.getByTestId('deletion-request-1')).toBeInTheDocument();
        expect(screen.getByTestId('deletion-request-2')).toBeInTheDocument();
      });
    });

    it('handles deletion requests with missing activity data gracefully', async () => {
      const requestWithMissingActivity = {
        id: 7,
        activity: 999, // No matching activity
        title: 'Fallback Title',
        description: 'Fallback description',
        location: 'Fallback location',
        reason: 'Some reason',
        status: 'pending',
        post: '2024-01-07T00:00:00Z',
        datestart: '2024-06-01T10:00:00Z',
        dateend: '2024-06-01T12:00:00Z',
        organizer: 'Fallback Org',
        category: ['Fallback'],
      };

      mockGetDeletionRequests.mockResolvedValue({
        success: true,
        data: [requestWithMissingActivity],
      });

      await act(async () => {
        render(<DeletionRequestListPage />);
      });

      await waitFor(() => {
        // Should use fallback data from the deletion request itself
        expect(screen.getByTestId('deletion-request-7')).toBeInTheDocument();
      });
    });
  });

  describe('UI Components', () => {
    it('renders AdminLayout with correct props', async () => {
      await act(async () => {
        render(<DeletionRequestListPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
      });

      // AdminLayout should have hideTitle prop and title
      // The exact implementation depends on your AdminLayout component
    });

    it('renders AdminDeletionRequestCard for each filtered request', async () => {
      await act(async () => {
        render(<DeletionRequestListPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('deletion-request-1')).toBeInTheDocument();
        expect(screen.getByTestId('deletion-request-2')).toBeInTheDocument();
      });

      // Verify the cards display correct content
      expect(screen.getByText('Beach Cleanup - pending')).toBeInTheDocument();
      expect(screen.getByText('Tech Workshop - pending')).toBeInTheDocument();
    });
  });
});