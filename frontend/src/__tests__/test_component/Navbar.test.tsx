/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock child components
jest.mock('@/app/components/NotificationBell', () => () => <div data-testid="mock-notif" />);
jest.mock('@/app/components/ProfileCard', () => () => <div data-testid="mock-profile" />);

const mockIsAuthenticated = jest.fn();
const mockGetUserRole = jest.fn();
jest.mock('@/lib/utils', () => ({
  auth: {
    isAuthenticated: () => mockIsAuthenticated(),
    getUserRole: () => mockGetUserRole(),
  },
}));

import Navbar from '@/app/components/Navbar';

describe('Navbar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows Sign In when not authenticated', () => {
    mockIsAuthenticated.mockReturnValue(false);
    mockGetUserRole.mockReturnValue(null);

    render(<Navbar />);

    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('shows NotificationBell and ProfileCard for student', async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockGetUserRole.mockReturnValue('student');

    render(<Navbar />);

    expect(screen.getByTestId('mock-notif')).toBeInTheDocument();
    expect(screen.getByTestId('mock-profile')).toBeInTheDocument();
  });

  it('shows Create button for organizer', () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockGetUserRole.mockReturnValue('organizer');

    render(<Navbar />);

    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByTestId('mock-profile')).toBeInTheDocument();
  });
});
