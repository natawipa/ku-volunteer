/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/app/components/EventCard/EventCardHorizontal', () => (props: any) => (
  <div data-testid="mock-ecard">ecard-{props?.event?.id}</div>
));

import EventTypeSection from '@/app/components/EventTypeSection';

describe('EventTypeSection', () => {
  it('renders empty state when no events', () => {
    render(<EventTypeSection title="University Activities" events={[]} />);

    expect(screen.getByText(/No university activities available/i)).toBeInTheDocument();
  });

  it('renders most recent event and view all', () => {
    const events = [ { id: 5, imgSrc: '/a.jpg' } as any ];
    render(<EventTypeSection title="University Activities" events={events} />);

    expect(screen.getByTestId('mock-ecard')).toBeInTheDocument();
    expect(screen.getByText(/View All/i)).toBeInTheDocument();
  });
});
