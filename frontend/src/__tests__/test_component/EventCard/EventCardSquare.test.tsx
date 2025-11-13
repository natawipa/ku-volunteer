/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

// Provide a stable push mock for next/navigation
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Simplify next/image to a plain img for tests
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { unoptimized, loader, placeholder, srcSet, sizes, ...rest } = props || {};
    return React.createElement('img', rest);
  },
}));

// Mock internal libs (auth + notifications)
const mockIsAuthenticated = jest.fn();
const mockGetUserRole = jest.fn();
jest.mock('@/lib/utils', () => ({
  auth: {
    isAuthenticated: () => mockIsAuthenticated(),
    getUserRole: () => mockGetUserRole(),
  },
}));

const mockGetPending = jest.fn();
jest.mock('@/lib/notifications', () => ({
  getPendingApplicationsForActivity: (id: number) => mockGetPending(id),
}));

import EventCardSquare from '@/app/components/EventCard/EventCardSquare';
import { USER_ROLES } from '@/lib/constants';
import { formatDate } from '@/app/components/EventCard/utils';

describe('EventCardSquare', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
    localStorage.clear();
  });

  const sampleEvent = {
    id: 42,
    title: 'Sample Event',
    imgSrc: '/sample.jpg',
    dateStart: '2025-11-01T10:00:00.000Z',
    dateEnd: '2025-11-01T12:00:00.000Z',
    status: 'Open',
    category: ['volunteer', 'community'],
  } as any;

  beforeEach(() => {
    mockIsAuthenticated.mockReturnValue(false);
    mockGetUserRole.mockReturnValue('STUDENT');
  });

  it('renders title, image alt, dates, status and categories', () => {
    render(<EventCardSquare event={sampleEvent} />);

    expect(screen.getByText('Sample Event')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Sample Event');

    const start = formatDate(sampleEvent.dateStart);
    const end = formatDate(sampleEvent.dateEnd);
    expect(screen.getByText(`${start} - ${end}`)).toBeInTheDocument();

    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('#volunteer')).toBeInTheDocument();
    expect(screen.getByText('#community')).toBeInTheDocument();
  });

  it('unauthenticated click redirects to /login', () => {
    mockIsAuthenticated.mockReturnValue(false);
    render(<EventCardSquare event={sampleEvent} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('authenticated click navigates to event-detail id', () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockGetUserRole.mockReturnValue('STUDENT');

    render(<EventCardSquare event={sampleEvent} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledWith(`/event-detail/${sampleEvent.id}`);
  });

  it('organizer sees pending count badge when pending > 0', async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockGetUserRole.mockReturnValue(USER_ROLES.ORGANIZER);
    mockGetPending.mockResolvedValue(3);

    render(<EventCardSquare event={sampleEvent} />);

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('does not show pending badge when count is 0', async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockGetUserRole.mockReturnValue(USER_ROLES.ORGANIZER);
    mockGetPending.mockResolvedValue(0);

    render(<EventCardSquare event={sampleEvent} />);

    await waitFor(() => {
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });
});
