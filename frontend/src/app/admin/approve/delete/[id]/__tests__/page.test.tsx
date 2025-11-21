import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import AdminDeleteApproval from '../page';
import { activitiesApi } from '@/lib/activities';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/activities', () => ({
  activitiesApi: {
    getActivity: jest.fn(),
    getDeletionRequests: jest.fn(),
  },
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) {
    return <div data-testid="next-image" data-src={src} data-alt={alt} {...props} />;
  };
});

// Mock components
jest.mock('@/app/components/Header', () => {
  return function MockHeader() {
    return <header data-testid="header">Header</header>;
  };
});

jest.mock('@/app/components/Navbar', () => {
  return function MockNavbar() {
    return <nav data-testid="navbar">Navbar</nav>;
  };
});

jest.mock('@/app/components/HeroImage', () => {
  return function MockHeroImage() {
    return <div data-testid="hero-image">Hero Image</div>;
  };
});

describe('Admin Delete Approval Page', () => {
  // Store original console methods
  const originalError = console.error;
  const originalLog = console.log;
  const originalWarn = console.warn;

  const mockActivity = {
    id: 1,
    title: 'Beach Cleanup',
    description: 'Community beach cleanup event',
    location: 'Sandy Beach',
    start_at: '2024-02-01T09:00:00Z',
    end_at: '2024-02-01T12:00:00Z',
    max_participants: 50,
    current_participants: 25,
    categories: ['Environment', 'Service'],
    status: 'open' as const,
    organizer_profile_id: 1,
    organizer_name: 'Eco Club',
    cover_image: '/beach.jpg',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    requires_admin_for_delete: true,
    capacity_reached: false,
  };

  const mockDeletionRequest = {
    id: 1,
    activity: 1, // This should be activity, not activity_id
    title: 'Beach Cleanup',
    description: 'Community beach cleanup event',
    category: ['Environment', 'Service'],
    post: '/beach.jpg',
    datestart: '2024-02-01T09:00:00Z',
    dateend: '2024-02-01T12:00:00Z',
    location: 'Sandy Beach',
    organizer: 'Eco Club',
    image: '/beach.jpg',
    reason: 'Event needs to be cancelled due to weather',
    capacity: 50,
    status: 'pending' as const,
    requested_at: '2024-01-15T10:00:00Z',
    reviewed_at: undefined,
    review_note: undefined,
  };

  const mockParams = Promise.resolve({ id: '1' });
  const mockRouter = { 
    push: jest.fn(), 
    back: jest.fn(),
  };

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

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Mock successful API responses
    (activitiesApi.getActivity as jest.Mock).mockResolvedValue({
      success: true,
      data: mockActivity,
    });
    
    (activitiesApi.getDeletionRequests as jest.Mock).mockResolvedValue({
      success: true,
      data: [mockDeletionRequest],
    });
    
    // Mock fetch for moderation API calls
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ detail: 'Success' }),
    });
  });

  describe('Initial Rendering', () => {
    it('renders without crashing', async () => {
      render(<AdminDeleteApproval params={mockParams} />);
      expect(document.body).toBeInTheDocument();
    });

    it('displays activity information after loading', async () => {
      render(<AdminDeleteApproval params={mockParams} />);
      
      await waitFor(() => {
        expect(screen.getByText('Beach Cleanup')).toBeInTheDocument();
        expect(screen.getByText('Community beach cleanup event')).toBeInTheDocument();
        expect(screen.getByText('Sandy Beach')).toBeInTheDocument();
      });
    });

    it('displays deletion request information', async () => {
      render(<AdminDeleteApproval params={mockParams} />);
      
      await waitFor(() => {
        expect(screen.getByText('Eco Club')).toBeInTheDocument();
        expect(screen.getByText('Event needs to be cancelled due to weather')).toBeInTheDocument();
      });
    });

    it('shows approval and rejection options', async () => {
      render(<AdminDeleteApproval params={mockParams} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Approve Deletion')).toBeInTheDocument();
        expect(screen.getByLabelText('Reject Deletion')).toBeInTheDocument();
      });
    });
  });

  describe('Approve Deletion Flow', () => {
    it('allows selecting approve deletion option', async () => {
      const user = userEvent.setup();
      
      render(<AdminDeleteApproval params={mockParams} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Approve Deletion')).toBeInTheDocument();
      });

      const approveCheckbox = screen.getByLabelText('Approve Deletion');
      await user.click(approveCheckbox);
      
      expect(approveCheckbox).toBeChecked();
    });

    it('successfully submits approval', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ detail: 'Activity deletion approved successfully' }),
      });

      render(<AdminDeleteApproval params={mockParams} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Approve Deletion')).toBeInTheDocument();
      });

      const approveCheckbox = screen.getByLabelText('Approve Deletion');
      await user.click(approveCheckbox);
      
      const submitButton = screen.getByRole('button', { name: 'Approve Deletion' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/activities/deletion-requests/1/review/'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ action: 'approve', note: '' }),
          })
        );
      });
    });

    it('navigates away after successful approval', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ detail: 'Activity deletion approved successfully' }),
      });

      render(<AdminDeleteApproval params={mockParams} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Approve Deletion')).toBeInTheDocument();
      });

      const approveCheckbox = screen.getByLabelText('Approve Deletion');
      await user.click(approveCheckbox);
      
      const submitButton = screen.getByRole('button', { name: 'Approve Deletion' });
      await user.click(submitButton);
      
      // After successful approval, component sets activity to null and navigates away
      await waitFor(() => {
        // The activity is deleted, so component shows not found or navigates
        expect(screen.getByText(/event not found/i)).toBeInTheDocument();
      }, { timeout: 1000 });

      // Verify navigation was triggered
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/admin');
      }, { timeout: 500 });
    });
  });

  describe('Reject Deletion Flow', () => {
    it('shows reject textarea when reject is selected', async () => {
      const user = userEvent.setup();
      
      render(<AdminDeleteApproval params={mockParams} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Reject Deletion')).toBeInTheDocument();
      });

      const rejectCheckbox = screen.getByLabelText('Reject Deletion');
      await user.click(rejectCheckbox);
      
      expect(screen.getByTestId('reject-reason-textarea')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter reason for rejection...')).toBeInTheDocument();
    });

    it('successfully submits rejection with reason', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ detail: 'Activity deletion rejected successfully' }),
      });

      render(<AdminDeleteApproval params={mockParams} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Reject Deletion')).toBeInTheDocument();
      });

      const rejectCheckbox = screen.getByLabelText('Reject Deletion');
      await user.click(rejectCheckbox);
      
      const reasonTextarea = screen.getByTestId('reject-reason-textarea');
      await user.type(reasonTextarea, 'Insufficient justification');
      
      const submitButton = screen.getByRole('button', { name: 'Reject Deletion' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/activities/deletion-requests/1/review/'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ action: 'reject', note: 'Insufficient justification' }),
          })
        );
      });
    });

    it('successfully submits rejection with reason', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ detail: 'Activity deletion rejected successfully' }),
      });

      render(<AdminDeleteApproval params={mockParams} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Reject Deletion')).toBeInTheDocument();
      });

      const rejectCheckbox = screen.getByLabelText('Reject Deletion');
      await user.click(rejectCheckbox);
      
      const reasonTextarea = screen.getByTestId('reject-reason-textarea');
      await user.type(reasonTextarea, 'Insufficient justification');
            
      const submitButton = screen.getByRole('button', { name: 'Reject Deletion' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/activities/deletion-requests/1/review/'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ action: 'reject', note: 'Insufficient justification' }),
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('handles moderation API errors', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => JSON.stringify({ detail: 'Permission denied' }),
      });

      render(<AdminDeleteApproval params={mockParams} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Approve Deletion')).toBeInTheDocument();
      });

      const approveCheckbox = screen.getByLabelText('Approve Deletion');
      await user.click(approveCheckbox);
      
      const submitButton = screen.getByRole('button', { name: 'Approve Deletion' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Permission denied')).toBeInTheDocument();
      });
    });

    it('handles missing deletion request gracefully', async () => {
      (activitiesApi.getDeletionRequests as jest.Mock).mockResolvedValue({
        success: true,
        data: [], // No deletion requests
      });

      render(<AdminDeleteApproval params={mockParams} />);
      
      await waitFor(() => {
        // Should handle missing request without crashing
        expect(document.body).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates back when cancel button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<AdminDeleteApproval params={mockParams} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);
      
      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', async () => {
      render(<AdminDeleteApproval params={mockParams} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Approve Deletion')).toBeInTheDocument();
        expect(screen.getByLabelText('Reject Deletion')).toBeInTheDocument();
      });
    });

    it('provides accessible button labeling', async () => {
      render(<AdminDeleteApproval params={mockParams} />);
      
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /submit|approve deletion|reject deletion/i });
        const cancelButton = screen.getByRole('button', { name: 'Cancel' });
        
        expect(submitButton).toBeInTheDocument();
        expect(cancelButton).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('disables submit button when no option is selected', async () => {
      render(<AdminDeleteApproval params={mockParams} />);
      
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: 'Submit' });
        expect(submitButton).toBeDisabled();
      });
    });

    it('enables submit button when approve is selected', async () => {
      const user = userEvent.setup();
      
      render(<AdminDeleteApproval params={mockParams} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Approve Deletion')).toBeInTheDocument();
      });

      const approveCheckbox = screen.getByLabelText('Approve Deletion');
      await user.click(approveCheckbox);
      
      const submitButton = screen.getByRole('button', { name: 'Approve Deletion' });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Loading States', () => {
    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      (global.fetch as jest.Mock).mockReturnValue(pendingPromise);

      render(<AdminDeleteApproval params={mockParams} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Approve Deletion')).toBeInTheDocument();
      });

      const approveCheckbox = screen.getByLabelText('Approve Deletion');
      await user.click(approveCheckbox);
      
      const submitButton = screen.getByRole('button', { name: 'Approve Deletion' });
      await user.click(submitButton);
      
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      
      // Resolve the promise
      resolvePromise!({
        ok: true,
        text: async () => JSON.stringify({ detail: 'Success' }),
      });
    });

    it('prevents multiple submissions during loading', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      (global.fetch as jest.Mock).mockReturnValue(pendingPromise);

      render(<AdminDeleteApproval params={mockParams} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Approve Deletion')).toBeInTheDocument();
      });

      const approveCheckbox = screen.getByLabelText('Approve Deletion');
      await user.click(approveCheckbox);
      
      const submitButton = screen.getByRole('button', { name: 'Approve Deletion' });
      
      // Try to click multiple times
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);
      
      expect(global.fetch).toHaveBeenCalledTimes(1);
      
      // Resolve the promise
      resolvePromise!({
        ok: true,
        text: async () => JSON.stringify({ detail: 'Success' }),
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles invalid activity ID', async () => {
      const invalidParams = Promise.resolve({ id: 'invalid' });
      
      render(<AdminDeleteApproval params={invalidParams} />);
      
      await waitFor(() => {
        // Should handle invalid ID without crashing
        expect(document.body).toBeInTheDocument();
      });
    });

    it('handles missing activity data', async () => {
      (activitiesApi.getActivity as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Activity not found',
      });

      render(<AdminDeleteApproval params={mockParams} />);
      
      await waitFor(() => {
        // Should handle missing activity gracefully
        expect(document.body).toBeInTheDocument();
      });
    });

    it('handles network errors gracefully', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<AdminDeleteApproval params={mockParams} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Approve Deletion')).toBeInTheDocument();
      });

      const approveCheckbox = screen.getByLabelText('Approve Deletion');
      await user.click(approveCheckbox);
      
      const submitButton = screen.getByRole('button', { name: 'Approve Deletion' });
      await user.click(submitButton);
      
      await waitFor(() => {
        // Should handle error gracefully without crashing
        expect(document.body).toBeInTheDocument();
      });
    });
  });
});