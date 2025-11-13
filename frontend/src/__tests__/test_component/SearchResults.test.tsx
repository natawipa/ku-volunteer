/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/app/components/EventCard/EventCardHorizontal', () => (props: any) => (
  <div data-testid="mock-ecard">ecard-{props?.event?.id}</div>
));

import SearchResults from '@/app/components/SearchResults';

describe('SearchResults', () => {
  it('shows no events message when empty', () => {
    render(<SearchResults events={[]} onBack={() => {}} />);
    expect(screen.getByText(/No events found matching your search/i)).toBeInTheDocument();
  });

  it('renders events and back button', () => {
    const events = [{ id: 9, title: 'E' } as any];
    render(<SearchResults events={events} onBack={() => {}} />);

    expect(screen.getByText(/Search Results/i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-ecard')).toBeInTheDocument();
  });
});
