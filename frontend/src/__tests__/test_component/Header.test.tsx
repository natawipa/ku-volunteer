/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock SearchLayout so Header can render without its implementation
jest.mock('@/app/components/SearchLayout', () => (props: any) => (
  <div data-testid="mock-searchlayout">search</div>
));

const mockIsAuthenticated = jest.fn();
const mockGetUserRole = jest.fn();
jest.mock('@/lib/utils', () => ({
  auth: {
    isAuthenticated: () => mockIsAuthenticated(),
    getUserRole: () => mockGetUserRole(),
  },
}));

import Header from '@/app/components/Header';

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders big logo and search layout when props enabled and not authenticated', async () => {
    mockIsAuthenticated.mockReturnValue(false);
    mockGetUserRole.mockReturnValue(null);

    render(<Header showBigLogo showSearch activities={[]} />);

    // Big logo should be rendered
    await waitFor(() => {
      expect(screen.getByAltText('Big Logo')).toBeInTheDocument();
    });

    // SearchLayout mocked
    expect(screen.getByTestId('mock-searchlayout')).toBeInTheDocument();
  });

  it('shows organizer logo when authenticated as organizer', async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockGetUserRole.mockReturnValue('organizer');

    render(<Header showBigLogo activities={[]} />);

    await waitFor(() => {
      const img = screen.getByAltText('Big Logo') as HTMLImageElement;
      expect(img).toBeInTheDocument();
      // Next/image mock renders an img with src prop
      expect(img.getAttribute('src')).toContain('logo-organizer');
    });
  });
});
