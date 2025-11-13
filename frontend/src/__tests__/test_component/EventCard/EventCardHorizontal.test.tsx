/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

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

import EventCardHorizontal from '@/app/components/EventCard/EventCardHorizontal';

describe('EventCardHorizontal', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
    localStorage.clear();
  });

  const sampleEvent = {
    id: 123,
    title: 'Test Event',
    description: 'An event for testing',
    category: 'University Activities',
    dateStart: '2025-01-01',
    dateEnd: '2025-01-02',
    location: 'Test Location',
    organizer: 'Test Organizer',
    participants_count: 10,
    max_participants: 20,
    posted_at: new Date().toISOString(),
    imgSrc: '/test.jpg',
  } as any;

  it('renders title, category and basic info', () => {
    render(<EventCardHorizontal event={sampleEvent} requireAuth={false} />);

    expect(screen.getByText('Test Event')).toBeInTheDocument();
    // Category rendered with a leading #
    expect(screen.getByText('#University Activities')).toBeInTheDocument();
    // Participants count
    expect(screen.getByText(/10\/20/)).toBeInTheDocument();
    // Location
    expect(screen.getByText('Test Location')).toBeInTheDocument();
  });

  it('navigates to event detail when clicked and requireAuth is false', () => {
    render(<EventCardHorizontal event={sampleEvent} requireAuth={false} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledWith('/event-detail/123');
  });

  it('calls provided onClick handler instead of navigation', () => {
    const onClick = jest.fn();
    render(<EventCardHorizontal event={sampleEvent} requireAuth={false} onClick={onClick} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledWith(sampleEvent);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
