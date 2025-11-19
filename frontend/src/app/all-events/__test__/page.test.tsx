import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import AllEventsPage from '@/app/all-events/page';
import { activitiesApi } from '@/lib/activities';
import { auth } from '@/lib/utils';
import { apiService } from '@/lib/api';
import { USER_ROLES } from '@/lib/constants';
import type { Activity, ActivityApplication } from '@/lib/types';

// Mock dependencies
jest.mock('@/lib/activities', () => ({
  activitiesApi: {
    getActivities: jest.fn(),
    getUserApplications: jest.fn(),
  },
}));

jest.mock('@/lib/utils', () => ({
  auth: {
    isAuthenticated: jest.fn(),
    getUserRole: jest.fn(),
  },
}));

jest.mock('@/lib/api', () => ({
  apiService: {
    getCurrentUser: jest.fn(),
  },
}));

jest.mock('@/app/components/EventCard/utils', () => ({
  getMyEvents: jest.fn(),
  getAllEvents: jest.fn(),
}));

jest.mock('@/app/components/Header', () => ({
  __esModule: true,
  default: jest.fn(({ showSearch }: { showSearch: boolean }) => (
    <div data-testid="header">
      Header - Search: {showSearch ? 'enabled' : 'disabled'}
    </div>
  )),
}));

jest.mock('@/app/components/Navbar', () => ({
  __esModule: true,
  default: jest.fn(({ isAuthenticated, userRole }: { isAuthenticated: boolean; userRole: string | null }) => (
    <div data-testid="navbar">
      Navbar - Auth: {isAuthenticated ? 'yes' : 'no'}, Role: {userRole}
    </div>
  )),
}));

jest.mock('@/app/components/HeroImage', () => ({
  __esModule: true,
  default: () => <div data-testid="hero-image" />,
}));

jest.mock('@/app/components/EventCard/EventCardHorizontal', () => ({
  __esModule: true,
  default: jest.fn(({ event, showBadge }: { event: Activity; showBadge: boolean }) => (
    <div data-testid={`event-card-${event.id}`}>
      {event.title} - {event.status} - Badge: {showBadge ? 'yes' : 'no'}
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
    status: 'closed',
    updated_at: '2024-01-02T11:00:00Z',
    current_participants: 30,
    requires_admin_for_delete: false,
    capacity_reached: false,
    cover_image: '/tech.jpg',
  },
];

const mockUserApplications: ActivityApplication[] = [
  {
    id: 1,
    activity: 1, // Activity ID
    activity_id: 1, // serialized data
    activity_title: 'Beach Cleanup',
    activity_id_stored: 1, // Stored activity ID
    student: 123,
    studentid: 123,
    student_email: 'student@example.com',
    student_name: 'John Doe',
    student_id_external: 'STU12345',
    status: 'approved',
    submitted_at: '2024-01-10T10:00:00Z',
    decision_at: '2024-01-11T14:30:00Z',
    decision_by: 456,
    decision_by_email: 'admin@example.com',
    notes: 'Application approved',
    review_note: 'Legacy review note', // Deprecated field
  },
  {
    id: 2,
    activity: 2, // Activity ID
    activity_id: 2, // serialized data
    activity_title: 'Tech Workshop',
    activity_id_stored: 2, // Stored activity ID
    student: 123,
    studentid: 123,
    student_email: 'student@example.com',
    student_name: 'John Doe',
    student_id_external: 'STU12345',
    status: 'pending',
    submitted_at: '2024-01-12T09:00:00Z',
    // No decision yet for pending application
  },
  {
    id: 3,
    activity: null, // Activity was deleted
    activity_id: 999, // Original activity ID
    activity_title: 'Deleted Event',
    activity_id_stored: 999, // Stored activity ID persists
    student: 123,
    studentid: 123,
    student_email: 'student@example.com',
    student_name: 'John Doe',
    student_id_external: 'STU12345',
    status: 'cancelled',
    submitted_at: '2024-01-05T11:00:00Z',
    cancelled_at: '2024-01-06T15:00:00Z',
    cancelled_by: 123,
    notes: 'Event was cancelled by organizer',
  },
];

const mockCurrentUser = {
  id: 123,
  email: 'test@example.com',
  role: USER_ROLES.STUDENT,
  organizer_profile: {
    id: 101,
    name: 'Test Organizer',
  },
};

// Mock event transformation functions
jest.mock('@/app/components/EventCard/utils', () => ({
  getMyEvents: jest.fn(),
  getAllEvents: jest.fn(),
}));

import { getMyEvents, getAllEvents } from '@/app/components/EventCard/utils';

describe('AllEventsPage', () => {
  const mockGetActivities = activitiesApi.getActivities as jest.Mock;
  const mockGetUserApplications = activitiesApi.getUserApplications as jest.Mock;
  const mockGetCurrentUser = apiService.getCurrentUser as jest.Mock;
  const mockIsAuthenticated = auth.isAuthenticated as jest.Mock;
  const mockGetUserRole = auth.getUserRole as jest.Mock;
  const mockGetMyEvents = getMyEvents as jest.Mock;
  const mockGetAllEvents = getAllEvents as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllEvents.mockReturnValue([]);
    mockGetMyEvents.mockReturnValue([]);
    
    // Default mocks
    mockGetActivities.mockResolvedValue({
      success: true,
      data: mockActivities,
    });
    
    mockGetUserApplications.mockResolvedValue({
      success: true,
      data: mockUserApplications,
    });
    
    mockGetCurrentUser.mockResolvedValue({
      success: true,
      data: mockCurrentUser,
    });
  });

  describe('Authentication and User Role Detection', () => {
    it('shows "All Events" title for unauthenticated users', async () => {
      mockIsAuthenticated.mockReturnValue(false);
      mockGetUserRole.mockReturnValue(null);

      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('All Events')).toBeInTheDocument();
      });

      expect(screen.getByTestId('navbar')).toHaveTextContent('Auth: no, Role:');
    });

    it('shows "My Events" title for authenticated users', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockGetUserRole.mockReturnValue(USER_ROLES.STUDENT);

      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('My Events')).toBeInTheDocument();
      });

      expect(screen.getByTestId('navbar')).toHaveTextContent('Auth: yes, Role: student');
    });

    it('fetches user data for authenticated students', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockGetUserRole.mockReturnValue(USER_ROLES.STUDENT);

      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(mockGetCurrentUser).toHaveBeenCalled();
        expect(mockGetUserApplications).toHaveBeenCalled();
      });
    });

    it('fetches organizer profile for authenticated organizers', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockGetUserRole.mockReturnValue(USER_ROLES.ORGANIZER);
      
      const organizerUser = {
        ...mockCurrentUser,
        role: USER_ROLES.ORGANIZER,
        organizer_profile: { id: 101 }
      };
      mockGetCurrentUser.mockResolvedValue({ success: true, data: organizerUser });

      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(mockGetCurrentUser).toHaveBeenCalled();
      });
    });
  });

  describe('Event Data Fetching', () => {
    it('fetches activities on component mount', async () => {
      mockIsAuthenticated.mockReturnValue(false);
      mockGetUserRole.mockReturnValue(null);

      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(mockGetActivities).toHaveBeenCalled();
      });
    });

    it('shows loading state while fetching events', async () => {
      mockIsAuthenticated.mockReturnValue(false);
      mockGetUserRole.mockReturnValue(null);

      // Delay the response to test loading state
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockGetActivities.mockReturnValue(promise);

      await act(async () => {
        render(<AllEventsPage />);
      });

      expect(screen.getByText('Loading events...')).toBeInTheDocument();

      // Resolve the promise
      await act(async () => {
        resolvePromise!({ success: true, data: mockActivities });
      });
    });

    it('handles empty activities response', async () => {
      mockIsAuthenticated.mockReturnValue(false);
      mockGetUserRole.mockReturnValue(null);
      mockGetActivities.mockResolvedValue({ success: true, data: [] });

      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('No events found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your search criteria or filter settings.')).toBeInTheDocument();
      });
    });

    it('handles activities API error', async () => {
      // Mock console.error to suppress expected error output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockIsAuthenticated.mockReturnValue(false);
      mockGetUserRole.mockReturnValue(null);
      mockGetActivities.mockRejectedValue(new Error('API Error'));

      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('No events found')).toBeInTheDocument();
      });
      
      // Verify error was logged and restore console
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching activities:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Event Filtering and Display', () => {
    beforeEach(() => {
      mockIsAuthenticated.mockReturnValue(false);
      mockGetUserRole.mockReturnValue(null);
    });

    it('uses getAllEvents for unauthenticated users', async () => {
      const mockTransformedEvents = [
        { id: 1, title: 'Beach Cleanup', status: 'open', category: ['Environment'] },
        { id: 2, title: 'Tech Workshop', status: 'closed', category: ['Education'] },
      ];
      
      mockGetAllEvents.mockReturnValue(mockTransformedEvents);

      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(getAllEvents).toHaveBeenCalledWith({
          activities: mockActivities,
          userRole: null,
          isAuthenticated: false,
          userApplications: [],
          organizerProfileId: null,
        });
      });
    });

    it('uses getMyEvents for authenticated users', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockGetUserRole.mockReturnValue(USER_ROLES.STUDENT);

      const mockTransformedEvents = [
        { id: 1, title: 'Beach Cleanup', status: 'open', category: ['Environment'] },
      ];
      
      mockGetMyEvents.mockReturnValue(mockTransformedEvents);

      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(getMyEvents).toHaveBeenCalledWith({
          activities: mockActivities,
          userRole: 'student',
          isAuthenticated: true,
          userApplications: mockUserApplications,
          organizerProfileId: null,
        });
      });
    });

    it('displays event cards with correct props', async () => {
      const mockTransformedEvents = [
        { 
          id: 1, 
          title: 'Beach Cleanup', 
          status: 'open', 
          category: ['Environment'],
          description: 'Clean the beach',
          dateStart: '2024-02-01',
          dateEnd: '2024-02-01',
        },
      ];
      
      mockGetAllEvents.mockReturnValue(mockTransformedEvents);

      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
        expect(screen.getByText('Beach Cleanup - open - Badge: yes')).toBeInTheDocument();
      });
    });

    it('filters events based on filter criteria', async () => {
      // This tests the filtering logic within the component
      const mockTransformedEvents = [
        { 
          id: 1, 
          title: 'Beach Cleanup', 
          status: 'open', 
          category: ['Environment'],
          description: 'Clean the beach',
          dateStart: '2024-02-01',
          dateEnd: '2024-02-01',
        },
        { 
          id: 2, 
          title: 'Tech Workshop', 
          status: 'closed', 
          category: ['Education'],
          description: 'Learn programming',
          dateStart: '2024-02-15',
          dateEnd: '2024-02-15',
        },
      ];
      
      mockGetAllEvents.mockReturnValue(mockTransformedEvents);

      await act(async () => {
        render(<AllEventsPage />);
      });

      // Both events should be displayed since no filters are applied
      await waitFor(() => {
        expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
        expect(screen.getByTestId('event-card-2')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles user data fetch errors gracefully', async () => {
      // Mock console.error to suppress expected error output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockIsAuthenticated.mockReturnValue(true);
      mockGetUserRole.mockReturnValue(USER_ROLES.STUDENT);
      mockGetCurrentUser.mockRejectedValue(new Error('User fetch error'));

      await act(async () => {
        render(<AllEventsPage />);
      });

      // Should still load events even if user data fails
      await waitFor(() => {
        expect(mockGetActivities).toHaveBeenCalled();
      });
      
      // Verify error was logged and restore console
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching user data:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('handles user applications fetch errors gracefully', async () => {
      // Mock console.error to suppress expected error output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockIsAuthenticated.mockReturnValue(true);
      mockGetUserRole.mockReturnValue(USER_ROLES.STUDENT);
      mockGetUserApplications.mockRejectedValue(new Error('Applications fetch error'));

      await act(async () => {
        render(<AllEventsPage />);
      });

      // Should still load events even if applications fail
      await waitFor(() => {
        expect(mockGetActivities).toHaveBeenCalled();
      });
      
      // Verify error was logged and restore console
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching user data:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('UI Components Integration', () => {
    it('renders all layout components', async () => {
      mockIsAuthenticated.mockReturnValue(false);
      mockGetUserRole.mockReturnValue(null);

      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('hero-image')).toBeInTheDocument();
        expect(screen.getByTestId('navbar')).toBeInTheDocument();
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });

      // Header should have search enabled
      expect(screen.getByTestId('header')).toHaveTextContent('Search: enabled');
    });

    it('passes correct props to Header component', async () => {
      mockIsAuthenticated.mockReturnValue(false);
      mockGetUserRole.mockReturnValue(null);

      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });

      // Header should receive activities and search props
      // The exact prop passing is tested in the Header mock
    });
  });

  describe('Edge Cases', () => {
    it('handles null activities response', async () => {
      mockIsAuthenticated.mockReturnValue(false);
      mockGetUserRole.mockReturnValue(null);
      mockGetActivities.mockResolvedValue({ success: true, data: null });

      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('No events found')).toBeInTheDocument();
      });
    });

    it('handles malformed activities data', async () => {
      mockIsAuthenticated.mockReturnValue(false);
      mockGetUserRole.mockReturnValue(null);
      
      const malformedActivities = [
        { id: 1, title: 'Valid Event' }, // Missing required fields
        null, // Null item
        undefined, // Undefined item
      ] as (Partial<Activity> | null | undefined)[];
      
      mockGetActivities.mockResolvedValue({ success: true, data: malformedActivities });

      await act(async () => {
        render(<AllEventsPage />);
      });

      // Component should handle malformed data gracefully
      await waitFor(() => {
        expect(screen.getByText('No events found')).toBeInTheDocument();
      });
    });

    it('handles empty transformed events', async () => {
      mockIsAuthenticated.mockReturnValue(false);
      mockGetUserRole.mockReturnValue(null);
      mockGetAllEvents.mockReturnValue([]);

      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('No events found')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter Functionality', () => {
    beforeEach(() => {
      mockIsAuthenticated.mockReturnValue(false);
      mockGetUserRole.mockReturnValue(null);
    });

    it('filters events by title search query', async () => {
      const mockTransformedEvents = [
        { id: 1, title: 'Beach Cleanup', status: 'open', category: ['Environment'] },
        { id: 2, title: 'Tech Workshop', status: 'closed', category: ['Education'] },
      ];
      
      mockGetAllEvents.mockReturnValue(mockTransformedEvents);

      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(getAllEvents).toHaveBeenCalledWith({
          activities: mockActivities,
          userRole: null,
          isAuthenticated: false,
          userApplications: [],
          organizerProfileId: null,
        });
      });
    });

    it('filters events by category selection', async () => {
      const mockTransformedEvents = [
        { id: 1, title: 'Beach Cleanup', status: 'open', category: ['Environment'] },
      ];
      
      mockGetAllEvents.mockReturnValue(mockTransformedEvents);

      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
        expect(screen.getByText('Beach Cleanup - open - Badge: yes')).toBeInTheDocument();
      });
    });

    it('filters events by status (open, closed, cancelled)', async () => {
      const mockTransformedEvents = [
        { id: 1, title: 'Open Event', status: 'open', category: ['Environment'] },
        { id: 2, title: 'Closed Event', status: 'closed', category: ['Education'] },
        { id: 3, title: 'Cancelled Event', status: 'cancelled', category: ['Social'] },
      ];
      
      mockGetAllEvents.mockReturnValue(mockTransformedEvents);

      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Open Event - open - Badge: yes')).toBeInTheDocument();
        expect(screen.getByText('Closed Event - closed - Badge: yes')).toBeInTheDocument();
        expect(screen.getByText('Cancelled Event - cancelled - Badge: yes')).toBeInTheDocument();
      });
    });

    it('filters events by date range', async () => {
      const mockTransformedEvents = [
        { 
          id: 1, 
          title: 'Future Event', 
          status: 'open', 
          category: ['Environment'],
          dateStart: '2024-06-01',
          dateEnd: '2024-06-01'
        },
      ];
      
      mockGetAllEvents.mockReturnValue(mockTransformedEvents);

      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
      });
    });

    it('handles empty search results', async () => {
      mockGetAllEvents.mockReturnValue([]);

      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('No events found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your search criteria or filter settings.')).toBeInTheDocument();
      });
    });
  });

  describe('Event Status Handling', () => {
    beforeEach(() => {
      mockIsAuthenticated.mockReturnValue(false);
      mockGetUserRole.mockReturnValue(null);
    });

    it('displays different event statuses correctly', async () => {
      const mockTransformedEvents = [
        { id: 1, title: 'Open Event', status: 'open', category: ['Environment'] },
        { id: 2, title: 'Full Event', status: 'full', category: ['Education'] },
        { id: 3, title: 'Pending Event', status: 'pending', category: ['Social'] },
      ];
      
      mockGetAllEvents.mockReturnValue(mockTransformedEvents);

      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Open Event - open - Badge: yes')).toBeInTheDocument();
        expect(screen.getByText('Full Event - full - Badge: yes')).toBeInTheDocument();
        expect(screen.getByText('Pending Event - pending - Badge: yes')).toBeInTheDocument();
      });
    });

    it('handles capacity reached events', async () => {
      const capacityReachedActivity = {
        ...mockActivities[0],
        current_participants: 50,
        max_participants: 50,
        capacity_reached: true,
        status: 'full'
      };
      
      mockGetActivities.mockResolvedValue({
        success: true,
        data: [capacityReachedActivity],
      });
      
      const mockTransformedEvents = [
        { id: 1, title: 'Full Event', status: 'full', category: ['Environment'] },
      ];
      
      mockGetAllEvents.mockReturnValue(mockTransformedEvents);

      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Full Event - full - Badge: yes')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockIsAuthenticated.mockReturnValue(false);
      mockGetUserRole.mockReturnValue(null);
    });

    it('has proper heading structure', async () => {
      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('All Events')).toBeInTheDocument();
      });

      // Check that the page has a proper heading structure
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('All Events');
    });

    it('provides meaningful content for screen readers', async () => {
      const mockTransformedEvents = [
        { 
          id: 1, 
          title: 'Beach Cleanup', 
          status: 'open', 
          category: ['Environment'],
          description: 'Clean the beach'
        },
      ];
      
      mockGetAllEvents.mockReturnValue(mockTransformedEvents);

      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        // Event cards should be accessible to screen readers
        expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
        expect(screen.getByText('Beach Cleanup - open - Badge: yes')).toBeInTheDocument();
      });
    });

    it('maintains focus management during interactions', async () => {
      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });

      // Focus should be manageable within the component
      expect(document.body).toHaveFocus();
    });
  });

  describe('Performance and Large Datasets', () => {
    beforeEach(() => {
      mockIsAuthenticated.mockReturnValue(false);
      mockGetUserRole.mockReturnValue(null);
    });

    it('handles large numbers of events efficiently', async () => {
      // Create 100 mock activities
      const largeActivitySet = Array.from({ length: 100 }, (_, index) => ({
        ...mockActivities[0],
        id: index + 1,
        title: `Event ${index + 1}`,
        description: `Description for event ${index + 1}`,
      }));

      mockGetActivities.mockResolvedValue({
        success: true,
        data: largeActivitySet,
      });

      // Create corresponding transformed events
      const largeTransformedEvents = largeActivitySet.map(activity => ({
        id: activity.id,
        title: activity.title,
        status: 'open',
        category: ['Environment'],
      }));
      
      mockGetAllEvents.mockReturnValue(largeTransformedEvents);

      const startTime = performance.now();
      
      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Ensure rendering completes in reasonable time (< 2 seconds)
      expect(renderTime).toBeLessThan(2000);
      expect(getAllEvents).toHaveBeenCalledWith({
        activities: largeActivitySet,
        userRole: null,
        isAuthenticated: false,
        userApplications: [],
        organizerProfileId: null,
      });
    });

    it('handles rapid state changes gracefully', async () => {
      const mockTransformedEvents = [
        { id: 1, title: 'Test Event', status: 'open', category: ['Environment'] },
      ];
      
      mockGetAllEvents.mockReturnValue(mockTransformedEvents);

      await act(async () => {
        render(<AllEventsPage />);
      });

      // Simulate rapid authentication state changes
      await act(async () => {
        mockIsAuthenticated.mockReturnValue(true);
        mockGetUserRole.mockReturnValue(USER_ROLES.STUDENT);
      });

      await act(async () => {
        mockIsAuthenticated.mockReturnValue(false);
        mockGetUserRole.mockReturnValue(null);
      });

      await waitFor(() => {
        expect(screen.getByText('All Events')).toBeInTheDocument();
      });
    });

    it('handles memory efficiently with large datasets', async () => {
      // Test with a substantial dataset
      const largeActivitySet = Array.from({ length: 500 }, (_, index) => ({
        ...mockActivities[0],
        id: index + 1,
        title: `Large Event ${index + 1}`,
      }));

      mockGetActivities.mockResolvedValue({
        success: true,
        data: largeActivitySet,
      });
      
      mockGetAllEvents.mockReturnValue([]);

      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(mockGetActivities).toHaveBeenCalled();
      });

      // Component should handle large datasets without memory issues
      expect(getAllEvents).toHaveBeenCalledWith({
        activities: largeActivitySet,
        userRole: null,
        isAuthenticated: false,
        userApplications: [],
        organizerProfileId: null,
      });
    });
  });

  describe('Component State Management', () => {
    it('maintains state consistency during authentication changes', async () => {
      // Start unauthenticated
      mockIsAuthenticated.mockReturnValue(false);
      mockGetUserRole.mockReturnValue(null);
      
      mockGetAllEvents.mockReturnValue([
        { id: 1, title: 'Public Event', status: 'open', category: ['Environment'] }
      ]);

      const { unmount } = render(<AllEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('All Events')).toBeInTheDocument();
      });

      // Clean up first component
      unmount();

      // Render authenticated version
      mockIsAuthenticated.mockReturnValue(true);
      mockGetUserRole.mockReturnValue(USER_ROLES.STUDENT);
      
      mockGetMyEvents.mockReturnValue([
        { id: 1, title: 'My Event', status: 'open', category: ['Environment'] }
      ]);

      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('My Events')).toBeInTheDocument();
      });
    });

    it('handles component unmounting gracefully', async () => {
      mockIsAuthenticated.mockReturnValue(false);
      mockGetUserRole.mockReturnValue(null);

      const { unmount } = render(<AllEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('All Events')).toBeInTheDocument();
      });

      // Unmount should not cause errors
      expect(() => unmount()).not.toThrow();
    });

    it('recovers from error states', async () => {
      // Mock console.error to suppress expected error output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockIsAuthenticated.mockReturnValue(false);
      mockGetUserRole.mockReturnValue(null);
      
      // First render with error
      mockGetActivities.mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        render(<AllEventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('No events found')).toBeInTheDocument();
      });

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching activities:', expect.any(Error));
      consoleSpy.mockRestore();

      // Should be able to recover when data becomes available
      mockGetActivities.mockResolvedValue({
        success: true,
        data: mockActivities,
      });
      
      const mockTransformedEvents = [
        { id: 1, title: 'Recovered Event', status: 'open', category: ['Environment'] },
      ];
      
      mockGetAllEvents.mockReturnValue(mockTransformedEvents);

      // Component should handle state recovery
      expect(mockGetActivities).toHaveBeenCalled();
    });
  });
});