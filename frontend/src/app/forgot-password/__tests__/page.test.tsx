import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordPage from '../page';
import { apiService } from '../../../lib/api';

// Mock dependencies
jest.mock('../../../lib/api', () => ({
  apiService: {
    forgotPassword: jest.fn(),
  },
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock the Card component
jest.mock('../../(auth)/components/Card', () => ({
  __esModule: true,
  default: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="card">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

describe('Forgot Password Page', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders forgot password form correctly', () => {
      render(<ForgotPasswordPage />);
      
      expect(screen.getByRole('heading', { name: /forgot password/i })).toBeInTheDocument();
      expect(screen.getByText(/enter your email address and we'll send you a link/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
    });

    it('has accessible form elements', () => {
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('placeholder', 'Enter your email address');
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('renders background decorative elements', () => {
      render(<ForgotPasswordPage />);
      
      // Check for elements with background image classes
      const container = document.body;
      expect(container.innerHTML).toContain('logokaset.png');
      expect(container.innerHTML).toContain('wavewave.png');
    });
  });

  describe('Form Validation', () => {
    it('shows error when email is empty', async () => {
      render(<ForgotPasswordPage />);
      
      // Find the form and submit it directly
      const form = screen.getByRole('button', { name: /send reset link/i }).closest('form');
      fireEvent.submit(form!);
      
      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('shows error when email is only whitespace', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, '   ');
      
      const form = screen.getByRole('button', { name: /send reset link/i }).closest('form');
      fireEvent.submit(form!);
      
      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('clears error when user starts typing', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);
      
      // First trigger an error by submitting empty form
      const form = screen.getByRole('button', { name: /send reset link/i }).closest('form');
      fireEvent.submit(form!);
      
      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
      
      // Then start typing to clear the error
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 't');
      
      await waitFor(() => {
        expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('calls apiService.forgotPassword with correct email when form is submitted', async () => {
      const user = userEvent.setup();
      (apiService.forgotPassword as jest.Mock).mockResolvedValue({ success: true });
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);
      
      expect(apiService.forgotPassword).toHaveBeenCalledWith('test@example.com');
    });

    it('trims and converts email to lowercase before submission', async () => {
      const user = userEvent.setup();
      (apiService.forgotPassword as jest.Mock).mockResolvedValue({ success: true });
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, '  Test@EXAMPLE.COM  ');
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);
      
      expect(apiService.forgotPassword).toHaveBeenCalledWith('test@example.com');
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      
      // Create a promise that we can control
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      (apiService.forgotPassword as jest.Mock).mockReturnValue(pendingPromise);
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);
      
      // Should show loading state
      expect(screen.getByRole('button', { name: /sending.../i })).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
      
      // Resolve the promise
      resolvePromise!({ success: true });
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /sending.../i })).not.toBeInTheDocument();
      });
    });

    it('disables form during submission', async () => {
      const user = userEvent.setup();
      
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      (apiService.forgotPassword as jest.Mock).mockReturnValue(pendingPromise);
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);
      
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
      
      resolvePromise!({ success: true });
    });
  });

  describe('Success State', () => {
    it('shows success message after successful submission', async () => {
      const user = userEvent.setup();
      (apiService.forgotPassword as jest.Mock).mockResolvedValue({ success: true });
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
      });
      
      expect(screen.getByText(/we've sent a password reset link to/i)).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText(/check your email and click the link/i)).toBeInTheDocument();
    });

    it('shows mail icon in success state', async () => {
      const user = userEvent.setup();
      (apiService.forgotPassword as jest.Mock).mockResolvedValue({ success: true });
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        // Check for elements that suggest a mail icon is rendered
        const iconContainer = document.querySelector('.bg-green-100.rounded-full');
        expect(iconContainer).toBeInTheDocument();
      });
    });

    it('shows back to login link in success state', async () => {
      const user = userEvent.setup();
      (apiService.forgotPassword as jest.Mock).mockResolvedValue({ success: true });
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        const backToLoginLink = screen.getByRole('link', { name: /back to login/i });
        expect(backToLoginLink).toBeInTheDocument();
        expect(backToLoginLink).toHaveAttribute('href', '/login');
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error message when API returns error', async () => {
      const user = userEvent.setup();
      (apiService.forgotPassword as jest.Mock).mockResolvedValue({ 
        success: false, 
        error: 'User not found' 
      });
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'nonexistent@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('User not found')).toBeInTheDocument();
      });
    });

    it('shows default error message when API returns no specific error', async () => {
      const user = userEvent.setup();
      (apiService.forgotPassword as jest.Mock).mockResolvedValue({ 
        success: false 
      });
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to send reset email')).toBeInTheDocument();
      });
    });

    it('shows network error message when API throws exception', async () => {
      const user = userEvent.setup();
      (apiService.forgotPassword as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Network error occurred. Please try again.')).toBeInTheDocument();
      });
    });

    it('restores button state after error', async () => {
      const user = userEvent.setup();
      (apiService.forgotPassword as jest.Mock).mockResolvedValue({ 
        success: false, 
        error: 'Error occurred' 
      });
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error occurred')).toBeInTheDocument();
      });
      
      // Button should be enabled again
      expect(screen.getByRole('button', { name: /send reset link/i })).not.toBeDisabled();
    });
  });

  describe('User Interface Interactions', () => {
    it('has proper styling for error alert', async () => {
      render(<ForgotPasswordPage />);
      
      // Trigger error by submitting empty form
      const form = screen.getByRole('button', { name: /send reset link/i }).closest('form');
      fireEvent.submit(form!);
      
      await waitFor(() => {
        const errorElement = screen.getByText('Email is required');
        expect(errorElement.closest('div')).toHaveClass('bg-red-100', 'border-red-400', 'text-red-700');
      });
    });

    it('has proper focus management', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      
      await user.click(emailInput);
      expect(emailInput).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button', { name: /send reset link/i })).toHaveFocus();
    });

    it('allows keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      
      // Pressing Enter should submit the form
      (apiService.forgotPassword as jest.Mock).mockResolvedValue({ success: true });
      await user.keyboard('{Enter}');
      
      expect(apiService.forgotPassword).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('Link Navigation', () => {
    it('has correct href for back to login link', () => {
      render(<ForgotPasswordPage />);
      
      const backToLoginLink = screen.getByRole('link', { name: /back to login/i });
      expect(backToLoginLink).toHaveAttribute('href', '/login');
    });

    it('has proper styling for back to login link', () => {
      render(<ForgotPasswordPage />);
      
      const backToLoginLink = screen.getByRole('link', { name: /back to login/i });
      expect(backToLoginLink).toHaveClass('text-green-600', 'hover:text-green-700');
    });
  });

  describe('Form Reset', () => {
    it('maintains email value after error', async () => {
      const user = userEvent.setup();
      (apiService.forgotPassword as jest.Mock).mockResolvedValue({ 
        success: false, 
        error: 'Error occurred' 
      });
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error occurred')).toBeInTheDocument();
      });
      
      // Email value should be preserved
      expect(emailInput).toHaveValue('test@example.com');
    });
  });

  describe('Component State Management', () => {
    it('prevents double submission', async () => {
      const user = userEvent.setup();
      
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      (apiService.forgotPassword as jest.Mock).mockReturnValue(pendingPromise);
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      // Click multiple times quickly
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);
      
      // API should only be called once
      expect(apiService.forgotPassword).toHaveBeenCalledTimes(1);
      
      resolvePromise!({ success: true });
    });
  });
});
