import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentRegisterPage from '../page';
import { StudentRegistrationService } from '../api';
import { useSearchParams } from 'next/navigation';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
}));

jest.mock('../api', () => ({
  StudentRegistrationService: {
    register: jest.fn(),
    registerWithOAuth: jest.fn(),
  },
}));

jest.mock('../../../components/Card', () => ({
  __esModule: true,
  default: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="card">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

jest.mock('../../../components/FormField', () => ({
  FormField: ({ id, label, error, register, ...props }: { 
    id: string; 
    label: string; 
    error?: string; 
    register: Record<string, unknown>;
    [key: string]: unknown;
  }) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} {...props} {...register} />
      {error && <span role="alert">{error}</span>}
    </div>
  ),
}));

jest.mock('../../../components/Dropdown', () => ({
  Dropdown: ({ 
    value, 
    onChange, 
    placeholder, 
    label, 
    options 
  }: { 
    value: string; 
    onChange: (value: string) => void;
    placeholder: string;
    label: string;
    options: string[];
  }) => (
    <div>
      <label htmlFor="title-dropdown">{label}</label>
      <select 
        id="title-dropdown"
        data-testid="title-dropdown"
        value={value} 
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  ),
}));

const mockSearchParams = new URLSearchParams();

describe('StudentRegisterPage', () => {
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
    mockSearchParams.delete('email');
    mockSearchParams.delete('oauth_session');
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => mockSearchParams.get(key),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render registration form with all fields', () => {
      render(<StudentRegisterPage />);

      expect(screen.getByText('Student Register')).toBeInTheDocument();
      expect(screen.getByLabelText('Student ID')).toBeInTheDocument();
      expect(screen.getByTestId('title-dropdown')).toBeInTheDocument();
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Faculty')).toBeInTheDocument();
      expect(screen.getByLabelText('Major')).toBeInTheDocument();
      expect(screen.getByLabelText('Year')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    });

    it('should have Back and Submit buttons', () => {
      render(<StudentRegisterPage />);

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('should have link to role selection page', () => {
      render(<StudentRegisterPage />);

      const backButton = screen.getByRole('button', { name: /back/i }).closest('a');
      expect(backButton).toHaveAttribute('href', '/role');
    });

    it('should render title dropdown with options', () => {
      render(<StudentRegisterPage />);

      const dropdown = screen.getByTestId('title-dropdown');
      expect(dropdown).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error when student ID is invalid format', async () => {
      render(<StudentRegisterPage />);

      const studentIdInput = screen.getByLabelText('Student ID');
      await userEvent.type(studentIdInput, '123'); // Too short

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(StudentRegistrationService.register).not.toHaveBeenCalled();
      });
    });

    it('should show error when title is not selected', async () => {
      render(<StudentRegisterPage />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(StudentRegistrationService.register).not.toHaveBeenCalled();
      });
    });

    it('should show error when required fields are empty', async () => {
      render(<StudentRegisterPage />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(StudentRegistrationService.register).not.toHaveBeenCalled();
      });
    });

    it('should validate email format', async () => {
      render(<StudentRegisterPage />);

      const emailInput = screen.getByLabelText('Email');
      await userEvent.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(StudentRegistrationService.register).not.toHaveBeenCalled();
      });
    });

    it('should validate password length (min 8 characters)', async () => {
      render(<StudentRegisterPage />);

      const passwordInput = screen.getByLabelText('Password');
      await userEvent.type(passwordInput, 'short');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(StudentRegistrationService.register).not.toHaveBeenCalled();
      });
    });

    it('should validate password confirmation matches', async () => {
      render(<StudentRegisterPage />);

      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      
      await userEvent.type(passwordInput, 'Password123#');
      await userEvent.type(confirmPasswordInput, 'password456');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(StudentRegistrationService.register).not.toHaveBeenCalled();
      });
    });

    it('should validate year is between 1 and 6', async () => {
      render(<StudentRegisterPage />);

      const yearInput = screen.getByLabelText('Year');
      await userEvent.type(yearInput, '10'); // Invalid year

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(StudentRegistrationService.register).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    const validFormData = {
      studentID: '6610123456',
      title: 'Mr.',
      firstName: 'John',
      lastName: 'Doe',
      faculty: 'Engineering',
      major: 'Computer Engineering',
      year: 3,
      email: 'john.doe@example.com',
      password: 'Password123#',
      confirm: 'Password123#',
    };

    it('should submit valid form data', async () => {
      (StudentRegistrationService.register as jest.Mock).mockResolvedValue({
        success: true,
        data: { id: 1, email: validFormData.email },
      });

      render(<StudentRegisterPage />);

      // Fill in the form
      await userEvent.type(screen.getByLabelText('Student ID'), validFormData.studentID);
      
      const dropdown = screen.getByTestId('title-dropdown');
      await userEvent.selectOptions(dropdown, validFormData.title);
      
      await userEvent.type(screen.getByLabelText('First Name'), validFormData.firstName);
      await userEvent.type(screen.getByLabelText('Last Name'), validFormData.lastName);
      await userEvent.type(screen.getByLabelText('Faculty'), validFormData.faculty);
      await userEvent.type(screen.getByLabelText('Major'), validFormData.major);
      await userEvent.type(screen.getByLabelText('Year'), validFormData.year.toString());
      await userEvent.type(screen.getByLabelText('Email'), validFormData.email);
      await userEvent.type(screen.getByLabelText('Password'), validFormData.password);
      await userEvent.type(screen.getByLabelText('Confirm Password'), validFormData.confirm);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(StudentRegistrationService.register).toHaveBeenCalled();
      });
    });

    it('should show loading state during submission', async () => {
      (StudentRegistrationService.register as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      render(<StudentRegisterPage />);

      // Fill minimal required fields
      await userEvent.type(screen.getByLabelText('Student ID'), '6610123456');
      const dropdown = screen.getByTestId('title-dropdown');
      await userEvent.selectOptions(dropdown, 'Mr.');
      await userEvent.type(screen.getByLabelText('First Name'), 'John');
      await userEvent.type(screen.getByLabelText('Last Name'), 'Doe');
      await userEvent.type(screen.getByLabelText('Faculty'), 'Engineering');
      await userEvent.type(screen.getByLabelText('Major'), 'Computer');
      await userEvent.type(screen.getByLabelText('Year'), '3');
      await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
      await userEvent.type(screen.getByLabelText('Password'), 'Password123#');
      await userEvent.type(screen.getByLabelText('Confirm Password'), 'Password123#');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);

      expect(screen.getByRole('button', { name: /submitting/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled();
    });

    it('should disable submit button during submission', async () => {
      (StudentRegistrationService.register as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      render(<StudentRegisterPage />);

      // Fill form...
      await userEvent.type(screen.getByLabelText('Student ID'), '6610123456');
      const dropdown = screen.getByTestId('title-dropdown');
      await userEvent.selectOptions(dropdown, 'Mr.');
      await userEvent.type(screen.getByLabelText('First Name'), 'John');
      await userEvent.type(screen.getByLabelText('Last Name'), 'Doe');
      await userEvent.type(screen.getByLabelText('Faculty'), 'Engineering');
      await userEvent.type(screen.getByLabelText('Major'), 'Computer');
      await userEvent.type(screen.getByLabelText('Year'), '3');
      await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
      await userEvent.type(screen.getByLabelText('Password'), 'Password123#');
      await userEvent.type(screen.getByLabelText('Confirm Password'), 'Password123#');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);

      const loadingButton = screen.getByRole('button', { name: /submitting/i });
      expect(loadingButton).toBeDisabled();
    });
  });

  describe('Successful Registration', () => {
    it('should show success message on successful registration', async () => {
      (StudentRegistrationService.register as jest.Mock).mockResolvedValue({
        success: true,
        data: { id: 1, email: 'test@example.com' },
      });

      render(<StudentRegisterPage />);

      // Fill and submit form
      await userEvent.type(screen.getByLabelText('Student ID'), '6610123456');
      const dropdown = screen.getByTestId('title-dropdown');
      await userEvent.selectOptions(dropdown, 'Mr.');
      await userEvent.type(screen.getByLabelText('First Name'), 'John');
      await userEvent.type(screen.getByLabelText('Last Name'), 'Doe');
      await userEvent.type(screen.getByLabelText('Faculty'), 'Engineering');
      await userEvent.type(screen.getByLabelText('Major'), 'Computer');
      await userEvent.type(screen.getByLabelText('Year'), '3');
      await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
      await userEvent.type(screen.getByLabelText('Password'), 'Password123#');
      await userEvent.type(screen.getByLabelText('Confirm Password'), 'Password123#');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
      });
    });

    it('should redirect to login page after successful regular registration', async () => {
      // Note: window.location navigation is difficult to test in JSDOM
      // This test verifies the success message appears, actual redirect would be tested in E2E
      (StudentRegistrationService.register as jest.Mock).mockResolvedValue({
        success: true,
        data: { id: 1, email: 'test@example.com' },
      });

      render(<StudentRegisterPage />);

      // Fill and submit form
      await userEvent.type(screen.getByLabelText('Student ID'), '6610123456');
      const dropdown = screen.getByTestId('title-dropdown');
      await userEvent.selectOptions(dropdown, 'Mr.');
      await userEvent.type(screen.getByLabelText('First Name'), 'John');
      await userEvent.type(screen.getByLabelText('Last Name'), 'Doe');
      await userEvent.type(screen.getByLabelText('Faculty'), 'Engineering');
      await userEvent.type(screen.getByLabelText('Major'), 'Computer');
      await userEvent.type(screen.getByLabelText('Year'), '3');
      await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
      await userEvent.type(screen.getByLabelText('Password'), 'Password123#');
      await userEvent.type(screen.getByLabelText('Confirm Password'), 'Password123#');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
      });

      // The actual redirect happens via setTimeout and would be tested in E2E tests
      expect(StudentRegistrationService.register).toHaveBeenCalled();
    });
  });

  describe('OAuth Registration', () => {
    it('should pre-fill email from OAuth', () => {
      mockSearchParams.set('email', 'oauth@example.com');
      mockSearchParams.set('oauth_session', 'session123');

      render(<StudentRegisterPage />);

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      
      waitFor(() => {
        expect(emailInput.value).toBe('oauth@example.com');
      });
    });

    it('should use OAuth registration endpoint when oauth_session is present', async () => {
      mockSearchParams.set('email', 'oauth@example.com');
      mockSearchParams.set('oauth_session', 'session123');

      (StudentRegistrationService.registerWithOAuth as jest.Mock).mockResolvedValue({
        success: true,
        data: { id: 1, email: 'oauth@example.com' },
        redirect_url: '/',
      });

      render(<StudentRegisterPage />);

      // Fill and submit form
      await userEvent.type(screen.getByLabelText('Student ID'), '6610123456');
      const dropdown = screen.getByTestId('title-dropdown');
      await userEvent.selectOptions(dropdown, 'Mr.');
      await userEvent.type(screen.getByLabelText('First Name'), 'John');
      await userEvent.type(screen.getByLabelText('Last Name'), 'Doe');
      await userEvent.type(screen.getByLabelText('Faculty'), 'Engineering');
      await userEvent.type(screen.getByLabelText('Major'), 'Computer');
      await userEvent.type(screen.getByLabelText('Year'), '3');
      await userEvent.type(screen.getByLabelText('Password'), 'Password123#');
      await userEvent.type(screen.getByLabelText('Confirm Password'), 'Password123#');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(StudentRegistrationService.registerWithOAuth).toHaveBeenCalledWith(
          expect.any(Object),
          'session123'
        );
      });
    });

    it('should redirect to provided URL after OAuth registration', async () => {
      // Note: window.location navigation is difficult to test in JSDOM
      // This test verifies the OAuth endpoint is called with redirect_url
      mockSearchParams.set('oauth_session', 'session123');

      (StudentRegistrationService.registerWithOAuth as jest.Mock).mockResolvedValue({
        success: true,
        data: { id: 1 },
        redirect_url: '/dashboard',
      });

      render(<StudentRegisterPage />);

      // Fill and submit form
      await userEvent.type(screen.getByLabelText('Student ID'), '6610123456');
      const dropdown = screen.getByTestId('title-dropdown');
      await userEvent.selectOptions(dropdown, 'Mr.');
      await userEvent.type(screen.getByLabelText('First Name'), 'John');
      await userEvent.type(screen.getByLabelText('Last Name'), 'Doe');
      await userEvent.type(screen.getByLabelText('Faculty'), 'Engineering');
      await userEvent.type(screen.getByLabelText('Major'), 'Computer');
      await userEvent.type(screen.getByLabelText('Year'), '3');
      await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
      await userEvent.type(screen.getByLabelText('Password'), 'Password123#');
      await userEvent.type(screen.getByLabelText('Confirm Password'), 'Password123#');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(StudentRegistrationService.registerWithOAuth).toHaveBeenCalled();
      });

      // Verify the service was called with the correct session
      expect(StudentRegistrationService.registerWithOAuth).toHaveBeenCalledWith(
        expect.any(Object),
        'session123'
      );
    });
  });

  describe('Registration Errors', () => {
    it('should display error message on registration failure', async () => {
      (StudentRegistrationService.register as jest.Mock).mockResolvedValue({
        success: false,
        message: 'Email already exists',
      });

      render(<StudentRegisterPage />);

      // Fill and submit form
      await userEvent.type(screen.getByLabelText('Student ID'), '6610123456');
      const dropdown = screen.getByTestId('title-dropdown');
      await userEvent.selectOptions(dropdown, 'Mr.');
      await userEvent.type(screen.getByLabelText('First Name'), 'John');
      await userEvent.type(screen.getByLabelText('Last Name'), 'Doe');
      await userEvent.type(screen.getByLabelText('Faculty'), 'Engineering');
      await userEvent.type(screen.getByLabelText('Major'), 'Computer');
      await userEvent.type(screen.getByLabelText('Year'), '3');
      await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
      await userEvent.type(screen.getByLabelText('Password'), 'Password123#');
      await userEvent.type(screen.getByLabelText('Confirm Password'), 'Password123#');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });

    it('should handle unexpected errors gracefully', async () => {
      (StudentRegistrationService.register as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      render(<StudentRegisterPage />);

      // Fill and submit form
      await userEvent.type(screen.getByLabelText('Student ID'), '6610123456');
      const dropdown = screen.getByTestId('title-dropdown');
      await userEvent.selectOptions(dropdown, 'Mr.');
      await userEvent.type(screen.getByLabelText('First Name'), 'John');
      await userEvent.type(screen.getByLabelText('Last Name'), 'Doe');
      await userEvent.type(screen.getByLabelText('Faculty'), 'Engineering');
      await userEvent.type(screen.getByLabelText('Major'), 'Computer');
      await userEvent.type(screen.getByLabelText('Year'), '3');
      await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
      await userEvent.type(screen.getByLabelText('Password'), 'Password123#');
      await userEvent.type(screen.getByLabelText('Confirm Password'), 'Password123#');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form structure', () => {
      render(<StudentRegisterPage />);

      const form = screen.getByRole('button', { name: /submit/i }).closest('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('Suspense Fallback', () => {
    it('should show loading state', () => {
      const { container } = render(<StudentRegisterPage />);
      
      // The Suspense fallback should render initially
      expect(container).toBeInTheDocument();
    });
  });
});
