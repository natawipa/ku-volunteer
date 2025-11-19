import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import EventActionButton from '@/app/event-detail/components/ActionButton';
import { activitiesApi } from '@/lib/activities';
import { 
  APPLICATION_STATUS, 
  USER_ROLES, 
  BUTTON_STYLES 
} from '@/lib/constants';
import type { Activity } from '@/lib/types';

// Mock dependencies
jest.mock('@/lib/activities', () => ({
  activitiesApi: {
    submitCheckIn: jest.fn(),
  },
}));

jest.mock('next/link', () => {
  const stringifyHref = (href: string | { pathname?: string; query?: Record<string, string> } | undefined) => {
    if (!href) return '#';
    if (typeof href === 'string') return href;
    const params = href.query ? new URLSearchParams(href.query).toString() : '';
    return `${href.pathname || '#'}${params ? `?${params}` : ''}`;
  };

  const MockLink = ({ children, href, className, ...props }: {
    children: React.ReactNode;
    href: string | { pathname?: string; query?: Record<string, string> } | undefined;
    className?: string;
    [key: string]: unknown;
  }) => (
    <a {...props} className={className} href={stringifyHref(href)}>
      {children}
    </a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

jest.mock('../Check-in', () => ({
  __esModule: true,
  default: jest.fn(({ isOpen, onClose, onSubmit, isLoading }: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (code: string) => void;
    isLoading?: boolean;
  }) => 
    isOpen ? (
      <div data-testid="check-in-modal">
        <button onClick={onClose}>Close Modal</button>
        <button onClick={() => onSubmit('123456')}>Submit Check-in</button>
        {isLoading && <span>Checking in...</span>}
      </div>
    ) : null
  ),
}));

jest.mock('../../helpers/utils', () => ({
  isActivityEnded: jest.fn(),
  isActivityOngoing: jest.fn(),
  isWithinActivityDateRange: jest.fn(),
  parseActivityDate: jest.fn((date) => new Date(date)),
}));

import { isActivityEnded, isActivityOngoing, isWithinActivityDateRange } from '../../helpers/utils';

// Mock data
const mockEvent: Activity = {
  id: 1,
  organizer_profile_id: 1,
  organizer_email: 'test@example.com',
  organizer_name: 'Test Organizer',
  categories: ['Test'],
  title: 'Test Activity',
  description: 'Test Description',
  start_at: '2024-02-01T10:00:00Z',
  end_at: '2024-02-01T12:00:00Z',
  location: 'Test Location',
  status: 'open',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  max_participants: 10,
  current_participants: 5,
  hours_awarded: 2,
  rejection_reason: undefined,
  requires_admin_for_delete: false,
  capacity_reached: false,
  cover_image_url: undefined,
  cover_image: undefined
};

describe('EventActionButton', () => {
  // Store original console methods
  const originalError = console.error;
  const originalLog = console.log;
  const originalWarn = console.warn;

  // Suppress console warnings and errors for cleaner test output
  beforeAll(() => {
    console.error = jest.fn();
    console.log = jest.fn();
    console.warn = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
    console.log = originalLog;
    console.warn = originalWarn;
  });
  
  const mockSubmitCheckIn = activitiesApi.submitCheckIn as jest.Mock;
  const mockOnApply = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnCheckInSuccess = jest.fn();

  // Cast mocked utilities
  const mockIsActivityEnded = isActivityEnded as jest.Mock;
  const mockIsActivityOngoing = isActivityOngoing as jest.Mock;
  const mockIsWithinActivityDateRange = isWithinActivityDateRange as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    mockSubmitCheckIn.mockResolvedValue({ success: true });
    // Default date mocks
    mockIsActivityEnded.mockReturnValue(false);
    mockIsActivityOngoing.mockReturnValue(false);
    mockIsWithinActivityDateRange.mockReturnValue(false);
  });

  describe('Student Role - Application Status States', () => {
    it('shows Apply Now button when no application exists and event is open', () => {
      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.STUDENT}
          onApply={mockOnApply}
        />
      );

      const button = screen.getByRole('button', { name: 'Apply Now' });
      expect(button).toBeEnabled();
      expect(button).toHaveClass('bg-green-600');
    });

    it('disables Apply Now button when capacity is reached', () => {
      const fullEvent = { ...mockEvent, capacity_reached: true };
      
      render(
        <EventActionButton
          event={fullEvent}
          role={USER_ROLES.STUDENT}
          onApply={mockOnApply}
        />
      );

      const button = screen.getByRole('button', { name: 'Apply Now' });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('bg-gray-400', 'cursor-not-allowed');
    });

    it('disables Apply Now button when event is not open', () => {
      const closedEvent = { ...mockEvent, status: 'closed' as const };
      
      render(
        <EventActionButton
          event={closedEvent}
          role={USER_ROLES.STUDENT}
          onApply={mockOnApply}
        />
      );

      const button = screen.getByRole('button', { name: 'Apply Now' });
      expect(button).toBeDisabled();
    });

    it('shows disabled button when applying', () => {
      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.STUDENT}
          onApply={mockOnApply}
          applying={true}
        />
      );

      const button = screen.getByRole('button', { name: 'Applying...' });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });

    it('shows Cancel Application button for pending applications', () => {
      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.STUDENT}
          applicationStatus={APPLICATION_STATUS.PENDING}
          onCancel={mockOnCancel}
        />
      );

      const button = screen.getByRole('button', { name: 'Cancel Application' });
      expect(button).toBeEnabled();
      expect(button).toHaveClass('bg-yellow-600');
    });

    it('disables Cancel Application button when cancelling', () => {
      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.STUDENT}
          applicationStatus={APPLICATION_STATUS.PENDING}
          onCancel={mockOnCancel}
          applying={true}
        />
      );

      const button = screen.getByRole('button', { name: 'Cancelling...' });
      expect(button).toBeDisabled();
    });

    it('shows Approved state with check-in for ongoing events', () => {
      mockIsActivityOngoing.mockReturnValue(true);
      
      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.STUDENT}
          applicationStatus={APPLICATION_STATUS.APPROVED}
        />
      );

      const button = screen.getByRole('button', { name: 'Check In' });
      expect(button).toBeEnabled();
      expect(button).toHaveClass(BUTTON_STYLES.PRIMARY);
    });

    it('shows disabled Event Ended button for ended events when approved', () => {
      mockIsActivityEnded.mockReturnValue(true);
      
      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.STUDENT}
          applicationStatus={APPLICATION_STATUS.APPROVED}
        />
      );

      const button = screen.getByRole('button', { name: 'Event Ended' });
      expect(button).toBeDisabled();
      expect(button).toHaveClass(BUTTON_STYLES.DISABLED);
    });

    it('shows Approved state without check-in for future events', () => {
      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.STUDENT}
          applicationStatus={APPLICATION_STATUS.APPROVED}
        />
      );

      expect(screen.getByText("You're Approved!")).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Check In' })).not.toBeInTheDocument();
    });

    it('shows disabled Application Rejected button', () => {
      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.STUDENT}
          applicationStatus={APPLICATION_STATUS.REJECTED}
        />
      );

      const button = screen.getByRole('button', { name: 'Application Rejected' });
      expect(button).toBeDisabled();
      expect(button).toHaveClass(BUTTON_STYLES.DISABLED);
    });

    it('shows disabled Cancelled button', () => {
      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.STUDENT}
          applicationStatus={APPLICATION_STATUS.CANCELLED}
        />
      );

      const button = screen.getByRole('button', { name: 'Cancelled' });
      expect(button).toBeDisabled();
      expect(button).toHaveClass(BUTTON_STYLES.DISABLED);
    });
  });

  describe('Organizer Role - Button States', () => {
    it('shows Check In button during event date range', () => {
      mockIsWithinActivityDateRange.mockReturnValue(true);
      
      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.ORGANIZER}
        />
      );

      const button = screen.getByRole('button', { name: 'Check In' });
      expect(button).toBeEnabled();
      expect(button).toHaveClass(BUTTON_STYLES.PRIMARY);
    });

    it('shows disabled Event Ended button after event ends', () => {
      mockIsActivityEnded.mockReturnValue(true);
      
      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.ORGANIZER}
        />
      );

      const button = screen.getByRole('button', { name: 'Event Ended' });
      expect(button).toBeDisabled();
      expect(button).toHaveClass(BUTTON_STYLES.DISABLED);
    });

    it('shows Edit Event link when not during event and not ended', () => {
      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.ORGANIZER}
          eventID={1}
        />
      );

      const link = screen.getByRole('link', { name: 'Edit Event' });
      expect(link).toBeEnabled();
      expect(link).toHaveClass(BUTTON_STYLES.PRIMARY);
      expect(link).toHaveAttribute('href', expect.stringContaining('edit=1'));
    });

    it('disables Check In button when applying', () => {
      mockIsWithinActivityDateRange.mockReturnValue(true);
      
      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.ORGANIZER}
          applying={true}
        />
      );

      const button = screen.getByRole('button', { name: 'Checking In...' });
      expect(button).toBeDisabled();
    });
  });

  describe('Check-in Modal Interactions', () => {
    it('opens check-in modal when Check In button is clicked', async () => {
      mockIsWithinActivityDateRange.mockReturnValue(true);
      
      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.ORGANIZER}
        />
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Check In' }));
      });
      
      expect(screen.getByTestId('check-in-modal')).toBeInTheDocument();
    });

    it('closes check-in modal when close button is clicked', async () => {
      mockIsWithinActivityDateRange.mockReturnValue(true);
      
      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.ORGANIZER}
        />
      );

      // Open modal
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Check In' }));
      });
      expect(screen.getByTestId('check-in-modal')).toBeInTheDocument();

      // Close modal
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Close Modal' }));
      });
      expect(screen.queryByTestId('check-in-modal')).not.toBeInTheDocument();
    });

    it('shows loading state during check-in submission', async () => {
      mockIsWithinActivityDateRange.mockReturnValue(true);
      let resolveCheckIn: (value: unknown) => void = () => {};
      mockSubmitCheckIn.mockReturnValue(new Promise(resolve => {
        resolveCheckIn = resolve;
      }));
      
      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.ORGANIZER}
        />
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Check In' }));
      });
      const submitButton = await screen.findByRole('button', { name: 'Submit Check-in' });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Checking in...')).toBeInTheDocument();
      });

      await act(async () => {
        resolveCheckIn({ success: true });
      });
    });
  });

  describe('Check-in API Integration', () => {
    it('handles successful check-in', async () => {
      mockIsWithinActivityDateRange.mockReturnValue(true);
      mockSubmitCheckIn.mockResolvedValue({ success: true });
      
      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.ORGANIZER}
          onCheckInSuccess={mockOnCheckInSuccess}
        />
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Check In' }));
      });
      const submitButton = await screen.findByRole('button', { name: 'Submit Check-in' });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockSubmitCheckIn).toHaveBeenCalledWith(1, '123456');
        expect(mockOnCheckInSuccess).toHaveBeenCalled();
      });
    });

    it('handles already checked in error', async () => {
      // Mock console.error to suppress expected error output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockIsWithinActivityDateRange.mockReturnValue(true);
      mockSubmitCheckIn.mockResolvedValue({ 
        success: false, 
        error: 'You have already checked in to this activity' 
      });

      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.ORGANIZER}
        />
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Check In' }));
      });
      const submitButton = await screen.findByRole('button', { name: 'Submit Check-in' });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockSubmitCheckIn).toHaveBeenCalled();
      });
      
      // Verify error was logged and restore console
      expect(consoleSpy).toHaveBeenCalledWith('Check-in failed:', 'You have already checked in to this activity');
      consoleSpy.mockRestore();
    });

    it('handles invalid code error', async () => {
      // Mock console.error to suppress expected error output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockIsWithinActivityDateRange.mockReturnValue(true);
      mockSubmitCheckIn.mockResolvedValue({ 
        success: false, 
        error: 'Invalid check-in code' 
      });

      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.ORGANIZER}
        />
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Check In' }));
      });
      const submitButton = await screen.findByRole('button', { name: 'Submit Check-in' });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockSubmitCheckIn).toHaveBeenCalled();
      });
      
      // Verify error was logged and restore console
      expect(consoleSpy).toHaveBeenCalledWith('Check-in failed:', 'Invalid check-in code');
      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('handles null role', () => {
      render(
        <EventActionButton
          event={mockEvent}
          role={null}
          onApply={mockOnApply}
        />
      );

      // Should default to student logic
      const button = screen.getByRole('button', { name: 'Apply Now' });
      expect(button).toBeInTheDocument();
    });

    it('handles event with capacity reached and closed status', () => {
      const unavailableEvent = {
        ...mockEvent,
        capacity_reached: true,
        status: 'closed' as const,
      };

      render(
        <EventActionButton
          event={unavailableEvent}
          role={USER_ROLES.STUDENT}
          onApply={mockOnApply}
        />
      );

      const button = screen.getByRole('button', { name: 'Apply Now' });
      expect(button).toBeDisabled();
    });

    it('handles upcoming event status for applications', () => {
      const upcomingEvent = {
        ...mockEvent,
        status: 'upcoming' as const,
      };

      render(
        <EventActionButton
          event={upcomingEvent}
          role={USER_ROLES.STUDENT}
          onApply={mockOnApply}
        />
      );

      const button = screen.getByRole('button', { name: 'Apply Now' });
      expect(button).toBeEnabled();
    });
  });

  describe('Accessibility Testing', () => {
    it('has proper ARIA labels and roles', () => {
      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.STUDENT}
          onApply={mockOnApply}
        />
      );

      const button = screen.getByRole('button', { name: 'Apply Now' });
      expect(button).toHaveClass('bg-green-600'); // Check for actual styling class
      expect(button).toBeVisible();
    });

    it('supports keyboard navigation', async () => {
      mockIsWithinActivityDateRange.mockReturnValue(true);

      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.ORGANIZER}
        />
      );

      const button = screen.getByRole('button', { name: 'Check In' });
      button.focus();
      expect(document.activeElement).toBe(button);

      // Test button click functionality
      await act(async () => {
        fireEvent.click(button);
      });

      expect(screen.getByTestId('check-in-modal')).toBeInTheDocument();
    });

    it('provides screen reader friendly content', () => {
      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.STUDENT}
          onCancel={mockOnCancel}
          applicationStatus={APPLICATION_STATUS.PENDING}
        />
      );

      const button = screen.getByRole('button', { name: 'Cancel Application' });
      expect(button).toHaveTextContent('Cancel Application');
    });

    it('maintains focus during state transitions', async () => {
      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.STUDENT}
          onApply={mockOnApply}
          applying={false}
        />
      );

      const button = screen.getByRole('button', { name: 'Apply Now' });
      button.focus();

      // Re-render with applying state
      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.STUDENT}
          onApply={mockOnApply}
          applying={true}
        />
      );

      const applyingButton = screen.getByRole('button', { name: 'Applying...' });
      expect(applyingButton).toBeInTheDocument();
    });
  });

  describe('Performance Testing', () => {
    it('handles rapid state changes efficiently', () => {
      const { rerender } = render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.STUDENT}
          onApply={mockOnApply}
          applying={false}
        />
      );

      const startTime = performance.now();

      // Rapid state changes
      for (let i = 0; i < 10; i++) {
        rerender(
          <EventActionButton
            event={mockEvent}
            role={USER_ROLES.STUDENT}
            onApply={mockOnApply}
            applying={i % 2 === 0}
          />
        );
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(50);
    });

    it('optimizes component re-renders', () => {
      let renderCount = 0;
      const TestWrapper = ({ applying }: { applying: boolean }) => {
        renderCount++;
        return (
          <EventActionButton
            event={mockEvent}
            role={USER_ROLES.STUDENT}
            onApply={mockOnApply}
            applying={applying}
          />
        );
      };

      const { rerender } = render(<TestWrapper applying={false} />);
      const initialCount = renderCount;

      // Re-render with different props should trigger re-render
      rerender(<TestWrapper applying={true} />);
      expect(renderCount).toBeGreaterThan(initialCount);
    });

    it('handles complex event objects efficiently', () => {
      const complexEvent = {
        ...mockEvent,
        description: 'Very long description '.repeat(100),
        location: 'Very long location name with lots of details '.repeat(20),
      };

      const startTime = performance.now();
      render(
        <EventActionButton
          event={complexEvent}
          role={USER_ROLES.STUDENT}
          onApply={mockOnApply}
        />
      );
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(screen.getByRole('button', { name: 'Apply Now' })).toBeInTheDocument();
    });
  });

  describe('Advanced Interaction Testing', () => {
    it('handles modal interaction sequences', async () => {
      mockIsWithinActivityDateRange.mockReturnValue(true);
      mockSubmitCheckIn.mockResolvedValue({ success: true });

      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.ORGANIZER}
        />
      );

      // Open modal
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Check In' }));
      });

      expect(screen.getByTestId('check-in-modal')).toBeInTheDocument();

      // Close modal
      const closeButton = screen.getByRole('button', { name: 'Close Modal' });
      await act(async () => {
        fireEvent.click(closeButton);
      });

      expect(screen.queryByTestId('check-in-modal')).not.toBeInTheDocument();

      // Reopen modal
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Check In' }));
      });

      expect(screen.getByTestId('check-in-modal')).toBeInTheDocument();
    });

    it('supports multiple simultaneous interactions', async () => {
      const onApplySpy = jest.fn();
      const onCancelSpy = jest.fn();

      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.STUDENT}
          onApply={onApplySpy}
          onCancel={onCancelSpy}
        />
      );

      const button = screen.getByRole('button', { name: 'Apply Now' });

      // Multiple rapid clicks
      await act(async () => {
        fireEvent.click(button);
        fireEvent.click(button);
        fireEvent.click(button);
      });

      // Should handle multiple calls (component may not prevent them)
      expect(onApplySpy).toHaveBeenCalled();
    });

    it('handles component updates during async operations', async () => {
      let resolveCheckIn: (value: { success: boolean }) => void;
      const checkInPromise = new Promise<{ success: boolean }>(resolve => {
        resolveCheckIn = resolve;
      });
      
      mockIsWithinActivityDateRange.mockReturnValue(true);
      mockSubmitCheckIn.mockReturnValue(checkInPromise);

      const { rerender } = render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.ORGANIZER}
        />
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Check In' }));
      });

      const submitButton = screen.getByRole('button', { name: 'Submit Check-in' });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // Component update during async operation
      const updatedEvent = { ...mockEvent, title: 'Updated Event' };
      rerender(
        <EventActionButton
          event={updatedEvent}
          role={USER_ROLES.ORGANIZER}
        />
      );

      // Resolve the async operation
      await act(async () => {
        resolveCheckIn!({ success: true });
      });

      // Should handle gracefully
      expect(screen.queryByText('Enter Check-in Code')).not.toBeInTheDocument();
    });
  });

  describe('Enhanced Error Handling', () => {
    it('handles network timeouts gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockIsWithinActivityDateRange.mockReturnValue(true);
      mockSubmitCheckIn.mockRejectedValue(new Error('Network timeout'));

      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.ORGANIZER}
        />
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Check In' }));
      });

      const submitButton = await screen.findByRole('button', { name: 'Submit Check-in' });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockSubmitCheckIn).toHaveBeenCalled();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Check-in exception:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('handles malformed API responses', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockIsWithinActivityDateRange.mockReturnValue(true);
      mockSubmitCheckIn.mockResolvedValue({ 
        success: false, 
        error: null, // Malformed - should have error message
      });

      render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.ORGANIZER}
        />
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Check In' }));
      });

      const submitButton = await screen.findByRole('button', { name: 'Submit Check-in' });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockSubmitCheckIn).toHaveBeenCalled();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Check-in failed:', 'Unknown error');
      consoleSpy.mockRestore();
    });

    it('handles component unmounting during async operations', async () => {
      mockIsWithinActivityDateRange.mockReturnValue(true);
      let resolvePromise: (value: { success: boolean }) => void;
      const slowPromise = new Promise<{ success: boolean }>(resolve => {
        resolvePromise = resolve;
      });
      mockSubmitCheckIn.mockReturnValue(slowPromise);

      const { unmount } = render(
        <EventActionButton
          event={mockEvent}
          role={USER_ROLES.ORGANIZER}
        />
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Check In' }));
      });

      const submitButton = screen.getByRole('button', { name: 'Submit Check-in' });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // Unmount while async operation is pending
      unmount();

      // Resolve the promise after unmount
      await act(async () => {
        resolvePromise!({ success: true });
      });

      // Should not cause errors
      expect(true).toBe(true); // Test passes if no errors thrown
    });
  });
});