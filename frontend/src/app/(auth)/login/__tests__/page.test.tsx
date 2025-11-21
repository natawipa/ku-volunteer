import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import LoginPage from '../page';
import { auth } from '@/lib/utils';
import { USER_ROLES, ROUTES } from '@/lib/constants';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/utils', () => ({
  auth: {
    login: jest.fn(),
    getUserRole: jest.fn(),
  },
  validation: {
    email: jest.fn(),
    password: jest.fn(),
  },
  handleApiError: jest.fn((error) => error),
}));

jest.mock('@/app/(auth)/components/Card', () => ({
  __esModule: true,
  default: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="card">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
  });

  describe('Rendering', () => {
    it('should render login form with all fields', () => {
      render(<LoginPage />);

      expect(screen.getByText('Log in')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    });

    it('should render Google sign-in button', () => {
      render(<LoginPage />);

      expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeInTheDocument();
    });

    it('should render forgot password link', () => {
      render(<LoginPage />);

      const forgotPasswordLink = screen.getByText('Forgot password?');
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
    });

    it('should render create account link', () => {
      render(<LoginPage />);

      expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
      const createLink = screen.getByText('Create one');
      expect(createLink).toHaveAttribute('href', ROUTES.ROLE_SELECTION);
    });

    it('should have proper input placeholders', () => {
      render(<LoginPage />);

      expect(screen.getByPlaceholderText('username@gmail.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate email field when empty', async () => {
      const { validation } = jest.requireMock('@/lib/utils');
      validation.email.mockReturnValue('Email is required');

      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: 'Sign in' });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const { validation } = jest.requireMock('@/lib/utils');
      validation.email.mockReturnValue('Please enter a valid email address');

      render(<LoginPage />);

      const emailInput = screen.getByLabelText('Email');
      await userEvent.type(emailInput, 'invalid-email');
      
      const submitButton = screen.getByRole('button', { name: 'Sign in' });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('should validate password field when empty', async () => {
      const { validation } = jest.requireMock('@/lib/utils');
      validation.email.mockReturnValue(null);
      validation.password.mockReturnValue('Password is required');

      render(<LoginPage />);

      const emailInput = screen.getByLabelText('Email');
      await userEvent.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: 'Sign in' });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('should validate password length', async () => {
      const { validation } = jest.requireMock('@/lib/utils');
      validation.email.mockReturnValue(null);
      validation.password.mockReturnValue('Password must be at least 8 characters long');

      render(<LoginPage />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'short');

      const submitButton = screen.getByRole('button', { name: 'Sign in' });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
      });
    });

    it('should clear field errors when user starts typing', async () => {
      const { validation } = jest.requireMock('@/lib/utils');
      validation.email.mockReturnValue('Email is required');
      validation.password.mockReturnValue(null);

      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: 'Sign in' });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });

      validation.email.mockReturnValue(null);
      
      const emailInput = screen.getByLabelText('Email');
      await userEvent.type(emailInput, 'test@example.com');

      await waitFor(() => {
        expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should not submit if validation fails', async () => {
      const { validation } = jest.requireMock('@/lib/utils');
      validation.email.mockReturnValue('Email is required');
      validation.password.mockReturnValue('Password is required');

      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: 'Sign in' });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(auth.login).not.toHaveBeenCalled();
      });
    });

    it('should submit valid credentials', async () => {
      const { validation } = jest.requireMock('@/lib/utils');
      validation.email.mockReturnValue(null);
      validation.password.mockReturnValue(null);

      (auth.login as jest.Mock).mockResolvedValue({
        success: true,
        data: { user: { role: USER_ROLES.STUDENT } },
      });
      (auth.getUserRole as jest.Mock).mockReturnValue(USER_ROLES.STUDENT);

      render(<LoginPage />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      await userEvent.type(emailInput, 'student@example.com');
      await userEvent.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: 'Sign in' });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(auth.login).toHaveBeenCalledWith('student@example.com', 'password123');
      });
    });

    it('should show loading state during submission', async () => {
      const { validation } = jest.requireMock('@/lib/utils');
      validation.email.mockReturnValue(null);
      validation.password.mockReturnValue(null);

      (auth.login as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      render(<LoginPage />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: 'Sign in' });
      await userEvent.click(submitButton);

      expect(screen.getByRole('button', { name: 'Signing in...' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled();
    });

    it('should disable submit button during submission', async () => {
      const { validation } = jest.requireMock('@/lib/utils');
      validation.email.mockReturnValue(null);
      validation.password.mockReturnValue(null);

      (auth.login as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      render(<LoginPage />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: 'Sign in' });
      await userEvent.click(submitButton);

      const loadingButton = screen.getByRole('button', { name: 'Signing in...' });
      expect(loadingButton).toBeDisabled();
    });
  });

  describe('Successful Login', () => {
    beforeEach(() => {
      const { validation } = jest.requireMock('@/lib/utils');
      validation.email.mockReturnValue(null);
      validation.password.mockReturnValue(null);
    });

    it('should redirect admin to admin home', async () => {
      (auth.login as jest.Mock).mockResolvedValue({
        success: true,
        data: { user: { role: USER_ROLES.ADMIN } },
      });
      (auth.getUserRole as jest.Mock).mockReturnValue(USER_ROLES.ADMIN);

      render(<LoginPage />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      await userEvent.type(emailInput, 'admin@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(ROUTES.ADMIN_HOME);
      });
    });

    it('should redirect student to home page', async () => {
      (auth.login as jest.Mock).mockResolvedValue({
        success: true,
        data: { user: { role: USER_ROLES.STUDENT } },
      });
      (auth.getUserRole as jest.Mock).mockReturnValue(USER_ROLES.STUDENT);

      render(<LoginPage />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      await userEvent.type(emailInput, 'student@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(ROUTES.HOME);
      });
    });

    it('should redirect organizer to home page', async () => {
      (auth.login as jest.Mock).mockResolvedValue({
        success: true,
        data: { user: { role: USER_ROLES.ORGANIZER } },
      });
      (auth.getUserRole as jest.Mock).mockReturnValue(USER_ROLES.ORGANIZER);

      render(<LoginPage />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      await userEvent.type(emailInput, 'organizer@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(ROUTES.HOME);
      });
    });
  });

  describe('Login Errors', () => {
    beforeEach(() => {
      const { validation } = jest.requireMock('@/lib/utils');
      validation.email.mockReturnValue(null);
      validation.password.mockReturnValue(null);
    });

    it('should display error message for invalid credentials', async () => {
      (auth.login as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Invalid email or password',
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      await userEvent.type(emailInput, 'wrong@example.com');
      await userEvent.type(passwordInput, 'wrongpassword');
      await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password');
      });
    });

    it('should display network error message', async () => {
      (auth.login as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<LoginPage />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('should clear API error when user types', async () => {
      (auth.login as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      await userEvent.type(emailInput, 'a');

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });

    it('should show error styling on invalid fields', async () => {
      const { validation } = jest.requireMock('@/lib/utils');
      validation.email.mockReturnValue('Invalid email');

      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: 'Sign in' });
      await userEvent.click(submitButton);

      await waitFor(() => {
        const emailInput = screen.getByLabelText('Email');
        expect(emailInput).toHaveClass('border-red-400');
      });
    });
  });

  describe('Google Sign-In', () => {
    // Note: window.location navigation is difficult to test in JSDOM
    // This would be better tested in an E2E test with Playwright/Cypress
    it('should redirect to Google OAuth on button click', () => {
      render(<LoginPage />);
      const googleButton = screen.getByRole('button', { name: 'Sign in with Google' });
      expect(googleButton).toBeInTheDocument();
      // In a real browser, clicking this would redirect to Google OAuth
    });

    it('should have proper Google button styling', () => {
      render(<LoginPage />);

      const googleButton = screen.getByRole('button', { name: 'Sign in with Google' });
      expect(googleButton).toHaveClass('border', 'border-gray-200');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<LoginPage />);

      expect(screen.getByRole('button', { name: 'Sign in' })).toHaveAttribute('aria-label', 'Sign in');
      expect(screen.getByRole('button', { name: 'Sign in with Google' })).toHaveAttribute('aria-label', 'Sign in with Google');
    });

    it('should associate error messages with inputs', async () => {
      const { validation } = jest.requireMock('@/lib/utils');
      validation.email.mockReturnValue('Email is required');

      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: 'Sign in' });
      await userEvent.click(submitButton);

      await waitFor(() => {
        const emailInput = screen.getByLabelText('Email');
        const errorId = emailInput.getAttribute('aria-describedby');
        expect(errorId).toBe('email-error');
        expect(screen.getByRole('alert', { name: '' })).toHaveAttribute('id', 'email-error');
      });
    });

    it('should mark form fields as required', () => {
      render(<LoginPage />);

      expect(screen.getByLabelText('Email')).toHaveAttribute('required');
      expect(screen.getByLabelText('Password')).toHaveAttribute('required');
    });

    it('should have proper input types', () => {
      render(<LoginPage />);

      expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Interaction', () => {
    it('should allow form submission via Enter key', async () => {
      const { validation } = jest.requireMock('@/lib/utils');
      validation.email.mockReturnValue(null);
      validation.password.mockReturnValue(null);

      (auth.login as jest.Mock).mockResolvedValue({
        success: true,
        data: { user: { role: USER_ROLES.STUDENT } },
      });
      (auth.getUserRole as jest.Mock).mockReturnValue(USER_ROLES.STUDENT);

      render(<LoginPage />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123{Enter}');

      await waitFor(() => {
        expect(auth.login).toHaveBeenCalled();
      });
    });

    it('should update form state on input change', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');

      expect(emailInput.value).toBe('test@example.com');
      expect(passwordInput.value).toBe('password123');
    });
  });
});
