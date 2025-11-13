/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const mockGetCurrentUser = jest.fn();
const mockLogout = jest.fn();
jest.mock('@/lib/api', () => ({
  apiService: {
    getCurrentUser: () => mockGetCurrentUser(),
    logout: () => mockLogout(),
  },
}));

import ProfileCard from '@/app/components/ProfileCard';

describe('ProfileCard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows user email when fetched and calls logout on click', async () => {
    mockGetCurrentUser.mockResolvedValue({ success: true, data: { email: 'a@b.com' } });
    mockLogout.mockResolvedValue({ success: true });

    render(<ProfileCard />);

    // Open dropdown by clicking the profile button
    const btn = screen.getByRole('button');
    fireEvent.click(btn);

    await waitFor(() => expect(screen.getByText('a@b.com')).toBeInTheDocument());

    // Click logout
    const logoutBtn = screen.getByText('Log out');
    fireEvent.click(logoutBtn);

    await waitFor(() => expect(mockLogout).toHaveBeenCalled());
  });
});
