/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('@/app/components/SearchResults', () => (props: any) => (
  <div data-testid="mock-searchresults">results-{props.events?.length}</div>
));

import SearchLayout from '@/app/components/SearchLayout';

describe('SearchLayout', () => {
  it('opens search results when typing in input', async () => {
    const activities = [
      { id: 1, title: 'Hello', created_at: '2025-01-01', start_at: '2025-01-02', end_at: '2025-01-03', location: 'X', categories: [], cover_image: '/a.jpg', max_participants: 3, status: 'open' },
    ] as any;

    render(<SearchLayout activities={activities} setIsSearchActive={() => {}} searchInputRef={{ current: null }} isScrolled={false} />);

    // Focus the input and type
    const input = screen.getByPlaceholderText('Search activities') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Hello' } });

    await waitFor(() => expect(screen.getByTestId('mock-searchresults')).toBeInTheDocument());
  });
});
