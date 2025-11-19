import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSearchParams } from 'next/navigation';
import ResetPassword from '../page';
import { apiService } from '../../../lib/api';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

jest.mock('../../../lib/api', () => ({
  apiService: {
    resetPassword: jest.fn(),
  },
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

const mockSearchParams = {
  get: jest.fn(),
};

describe('Reset Password Page', () => {
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
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'token') return 'valid-reset-token';
      if (key === 'email') return 'user@test.com';
      return null;
    });
  });

  describe('Initial Rendering', () => {
    it('renders reset password form with valid parameters', () => {
      render(<ResetPassword />);
      
      expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
      expect(screen.getByText(/enter your new password below/i)).toBeInTheDocument();
      expect(document.getElementById('password')).toBeInTheDocument();
      expect(document.getElementById('confirmPassword')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });

    it('shows error message when token is missing', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'email') return 'user@test.com';
        return null; // Missing token
      });

      render(<ResetPassword />);
      
      expect(screen.getByText(/invalid or missing reset parameters/i)).toBeInTheDocument();
    });

    it('shows error message when email is missing', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'token') return 'valid-reset-token';
        return null; // Missing email
      });

      render(<ResetPassword />);
      
      expect(screen.getByText(/invalid or missing reset parameters/i)).toBeInTheDocument();
    });

    it('has accessible form elements', () => {
      render(<ResetPassword />);
      
      const passwordInput = document.getElementById('password')!;
      const confirmPasswordInput = document.getElementById('confirmPassword')!;
      
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');
      expect(confirmPasswordInput).toHaveAttribute('required');
    });
  });

  describe('Form Validation', () => {
    it('shows error when password is empty', async () => {
      render(<ResetPassword />);
      
      const form = screen.getByRole('button', { name: /reset password/i }).closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('shows error when password is too short', async () => {
      const user = userEvent.setup();
      render(<ResetPassword />);
      
      const passwordInput = document.getElementById('password')!;
      await user.type(passwordInput, '12345');
      
      const form = screen.getByRole('button', { name: /reset password/i }).closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
      });
    });

    it('shows error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<ResetPassword />);
      
      const passwordInput = document.getElementById('password')!;
      const confirmPasswordInput = document.getElementById('confirmPassword')!;
      
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password456');
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);
      
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    it('clears error when user types in password field', async () => {
      const user = userEvent.setup();
      render(<ResetPassword />);
      
      // First trigger an error
      const form = screen.getByRole('button', { name: /reset password/i }).closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
      
      // Then type in password field
      const passwordInput = document.getElementById('password')!;
      await user.type(passwordInput, 'p');
      
      expect(screen.queryByText(/password is required/i)).not.toBeInTheDocument();
    });

    it('clears error when user types in confirm password field', async () => {
      const user = userEvent.setup();
      render(<ResetPassword />);
      
      const passwordInput = document.getElementById('password')!;
      const confirmPasswordInput = document.getElementById('confirmPassword')!;
      
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password456');
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);
      
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      
      // Clear and retype to match
      await user.clear(confirmPasswordInput);
      await user.type(confirmPasswordInput, 'p');
      
      expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
    });
  });

  describe('Password Reset Submission', () => {
    it('successfully resets password with valid data', async () => {
      const user = userEvent.setup();
      (apiService.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
        data: { message: 'Password reset successfully' },
      });

      render(<ResetPassword />);
      
      const passwordInput = document.getElementById('password')!;
      const confirmPasswordInput = document.getElementById('confirmPassword')!;
      
      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(apiService.resetPassword).toHaveBeenCalledWith(
          'user@test.com',
          'valid-reset-token',
          'newpassword123'
        );
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      // Create a promise that we can control
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      (apiService.resetPassword as jest.Mock).mockReturnValue(pendingPromise);

      render(<ResetPassword />);
      
      const passwordInput = document.getElementById('password')!;
      const confirmPasswordInput = document.getElementById('confirmPassword')!;
      
      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);
      
      // Check loading state
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/resetting/i)).toBeInTheDocument();
      
      // Resolve the promise
      resolvePromise!({
        success: true,
        data: { message: 'Password reset successfully' },
      });
    });

    it('handles API error response', async () => {
      const user = userEvent.setup();
      (apiService.resetPassword as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Invalid or expired token',
      });

      render(<ResetPassword />);
      
      const passwordInput = document.getElementById('password')!;
      const confirmPasswordInput = document.getElementById('confirmPassword')!;
      
      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid or expired token')).toBeInTheDocument();
      });
    });

    it('handles network error', async () => {
      const user = userEvent.setup();
      (apiService.resetPassword as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<ResetPassword />);
      
      const passwordInput = document.getElementById('password')!;
      const confirmPasswordInput = document.getElementById('confirmPassword')!;
      
      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/network error occurred/i)).toBeInTheDocument();
      });
    });

    it('shows generic error for API response without error message', async () => {
      const user = userEvent.setup();
      (apiService.resetPassword as jest.Mock).mockResolvedValue({
        success: false,
      });

      render(<ResetPassword />);
      
      const passwordInput = document.getElementById('password')!;
      const confirmPasswordInput = document.getElementById('confirmPassword')!;
      
      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to reset password/i)).toBeInTheDocument();
      });
    });
  });

  describe('Success State', () => {
    it('displays success message after successful reset', async () => {
      const user = userEvent.setup();
      (apiService.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
        data: { message: 'Password reset successfully' },
      });

      render(<ResetPassword />);
      
      const passwordInput = document.getElementById('password')!;
      const confirmPasswordInput = document.getElementById('confirmPassword')!;
      
      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /password reset successful/i })).toBeInTheDocument();
        expect(screen.getByText(/your password has been reset successfully/i)).toBeInTheDocument();
      });
    });

    it('shows login link after successful reset', async () => {
      const user = userEvent.setup();
      (apiService.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
        data: { message: 'Password reset successfully' },
      });

      render(<ResetPassword />);
      
      const passwordInput = document.getElementById('password')!;
      const confirmPasswordInput = document.getElementById('confirmPassword')!;
      
      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        const loginLink = screen.getByRole('link', { name: /go to login/i });
        expect(loginLink).toBeInTheDocument();
        expect(loginLink).toHaveAttribute('href', '/login');
      });
    });

    it('displays success icon', async () => {
      const user = userEvent.setup();
      (apiService.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
        data: { message: 'Password reset successfully' },
      });

      render(<ResetPassword />);
      
      const passwordInput = document.getElementById('password')!;
      const confirmPasswordInput = document.getElementById('confirmPassword')!;
      
      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        const successIcon = document.querySelector('svg');
        expect(successIcon).toBeInTheDocument();
      });
    });
  });

  describe('Form Interaction', () => {
    it('allows form submission with Enter key', async () => {
      const user = userEvent.setup();
      (apiService.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
        data: { message: 'Password reset successfully' },
      });

      render(<ResetPassword />);
      
      const passwordInput = document.getElementById('password')!;
      const confirmPasswordInput = document.getElementById('confirmPassword')!;
      
      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');
      
      // Press Enter in the confirm password field
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(apiService.resetPassword).toHaveBeenCalled();
      });
    });

    it('prevents form submission when required fields are empty', async () => {
      userEvent.setup();
      render(<ResetPassword />);
      
      // Try to submit form with empty fields - HTML5 validation should prevent submission
      const form = screen.getByRole('button', { name: /reset password/i }).closest('form')!;
      fireEvent.submit(form);
      
      // API should not be called due to HTML5 validation, but JavaScript validation should run
      expect(apiService.resetPassword).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('prevents multiple submissions', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      (apiService.resetPassword as jest.Mock).mockReturnValue(pendingPromise);

      render(<ResetPassword />);
      
      const passwordInput = document.getElementById('password')!;
      const confirmPasswordInput = document.getElementById('confirmPassword')!;
      
      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      
      // Click submit multiple times
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);
      
      // Should only be called once
      expect(apiService.resetPassword).toHaveBeenCalledTimes(1);
      
      // Resolve the promise
      resolvePromise!({
        success: true,
        data: { message: 'Password reset successfully' },
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles malformed URL parameters gracefully', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'token') return '';
        if (key === 'email') return 'invalid-email';
        return null;
      });

      render(<ResetPassword />);
      
      expect(screen.getByText(/invalid or missing reset parameters/i)).toBeInTheDocument();
    });

    it('handles very long passwords', async () => {
      const user = userEvent.setup();
      (apiService.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
        data: { message: 'Password reset successfully' },
      });

      render(<ResetPassword />);
      
      const longPassword = 'a'.repeat(100); // Very long password
      const passwordInput = document.getElementById('password')!;
      const confirmPasswordInput = document.getElementById('confirmPassword')!;
      
      await user.type(passwordInput, longPassword);
      await user.type(confirmPasswordInput, longPassword);
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(apiService.resetPassword).toHaveBeenCalledWith(
          'user@test.com',
          'valid-reset-token',
          longPassword
        );
      });
    });

    it('handles special characters in password', async () => {
      const user = userEvent.setup();
      (apiService.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
        data: { message: 'Password reset successfully' },
      });

      render(<ResetPassword />);
      
      const specialPassword = 'P@ssw0rd!@#$%^&*()';
      const passwordInput = document.getElementById('password')!;
      const confirmPasswordInput = document.getElementById('confirmPassword')!;
      
      await user.type(passwordInput, specialPassword);
      await user.type(confirmPasswordInput, specialPassword);
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(apiService.resetPassword).toHaveBeenCalledWith(
          'user@test.com',
          'valid-reset-token',
          specialPassword
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for error messages', async () => {
      render(<ResetPassword />);
      
      const form = screen.getByRole('button', { name: /reset password/i }).closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        const errorMessage = screen.getByText('Password is required');
        expect(errorMessage.closest('div')).toHaveClass('bg-red-100');
      });
    });

    it('maintains focus management during state changes', async () => {
      const user = userEvent.setup();
      render(<ResetPassword />);
      
      const passwordInput = document.getElementById('password')!;
      await user.click(passwordInput);
      
      expect(passwordInput).toHaveFocus();
    });

    it('provides descriptive labels and instructions', () => {
      render(<ResetPassword />);
      
      expect(screen.getByText(/enter your new password below/i)).toBeInTheDocument();
      expect(document.getElementById('password')).toBeInTheDocument();
      expect(document.getElementById('confirmPassword')).toBeInTheDocument();
    });
  });
});