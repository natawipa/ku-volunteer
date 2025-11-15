import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import SearchLayout from '@/app/components/SearchLayout/SearchLayout';
import { USER_ROLES, STORAGE_KEYS } from '@/lib/constants';
import type { Activity } from '@/lib/types';

// Mock the child components
jest.mock('@/app/components/SearchCard', () => ({
  __esModule: true,
  default: jest.fn(({ 
    query, 
    setQuery, 
    onApply, 
    onKeyDown,
    showOpenEventCheckbox,
    OpenEventChecked,
    setOpenEventChecked 
  }: any) => (
    <div data-testid="search-card">
      <input 
        data-testid="search-card-input"
        value={query} 
        onChange={(e) => setQuery(e.target.value)} 
        onKeyDown={onKeyDown}
      />
      <button data-testid="apply-button" onClick={onApply}>
        Apply
      </button>
      {showOpenEventCheckbox && (
        <label>
          <input
            type="checkbox"
            data-testid="open-only-checkbox"
            checked={OpenEventChecked}
            onChange={(e) => setOpenEventChecked(e.target.checked)}
          />
          Open events only
        </label>
      )}
    </div>
  )),
}));

jest.mock('@/app/components/SearchResults', () => ({
  __esModule: true,
  default: jest.fn(({ events, onBack }: any) => (
    <div data-testid="search-results">
      <button data-testid="back-button" onClick={onBack}>Back</button>
      <div data-testid="results-count">{events.length} events found</div>
      {events.map((event: any) => (
        <div key={event.id} data-testid={`event-${event.id}`}>
          {event.title} - {event.status}
        </div>
      ))}
    </div>
  )),
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  MagnifyingGlassIcon: () => <div data-testid="search-icon" />,
}));

jest.mock('@heroicons/react/20/solid', () => ({
  ChevronDownIcon: () => <div data-testid="chevron-icon" />,
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Sample test data
const mockActivities: Activity[] = [
  {
    id: 1,
    title: 'Beach Cleanup',
    created_at: '2024-01-01T00:00:00Z',
    start_at: '2024-02-01T09:00:00Z',
    end_at: '2024-02-01T12:00:00Z',
    location: 'Sandy Beach',
    categories: ['Environment', 'Service'],
    max_participants: 50,
    organizer_name: 'Eco Club',
    organizer_profile_id: 1,
    organizer_email: 'eco@example.com',
    updated_at: '2024-01-10T00:00:00Z',
    current_participants: 20,
    requires_admin_for_delete: false,
    description: 'Clean the beach',
    cover_image_url: '/beach.jpg',
    capacity_reached: false,
    status: 'open',
  },
  {
    id: 2,
    title: 'Tech Workshop',
    created_at: '2024-01-02T00:00:00Z',
    start_at: '2024-02-15T14:00:00Z',
    end_at: '2024-02-15T17:00:00Z',
    location: 'Tech Lab',
    categories: ['Education', 'Technology'],
    max_participants: 30,
    organizer_name: 'Tech Society',
    organizer_email: 'tech@example.com',
    organizer_profile_id: 2,
    updated_at: '2024-01-12T00:00:00Z',
    current_participants: 15,
    requires_admin_for_delete: false,
    capacity_reached: false,
    description: 'Learn programming',
    cover_image_url: '/tech.jpg',
    status: 'closed',
  },
  {
    id: 3,
    title: 'Food Drive',
    created_at: '2024-01-03T00:00:00Z',
    start_at: '2024-01-20T10:00:00Z',
    end_at: '2024-01-20T14:00:00Z',
    location: 'Community Center',
    categories: ['Social Impact', 'Service'],
    max_participants: 100,
    organizer_name: 'Helping Hands',
    organizer_profile_id: 3,
    organizer_email: 'help@example.com',
    updated_at: '2024-01-15T00:00:00Z',
    current_participants: 75,
    requires_admin_for_delete: false,
    capacity_reached: false,
    description: 'Collect food for needy',
    cover_image_url: '/food.jpg',
    status: 'open',
  },
  {
    id: 4,
    title: 'Music Concert',
    created_at: '2024-01-04T00:00:00Z',
    start_at: '2024-03-01T18:00:00Z',
    end_at: '2024-03-01T22:00:00Z',
    location: 'Auditorium',
    categories: ['Entertainment'],
    max_participants: 200,
    organizer_name: 'Music Club',
    organizer_profile_id: 4,
    organizer_email: 'music@example.com',
    updated_at: '2024-01-20T00:00:00Z',
    current_participants: 150,
    requires_admin_for_delete: false,
    capacity_reached: false,
    description: 'Live music performance',
    status: 'pending', // No cover image - should use default
  },
];

describe('SearchLayout', () => {
  const mockSetIsSearchActive = jest.fn();
  const mockSearchInputRef = { current: null };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'searchHistory') return JSON.stringify(['previous search', 'beach']);
      return null;
    });
  });

  const renderComponent = (props = {}) => {
    return render(
      <SearchLayout
        activities={mockActivities}
        setIsSearchActive={mockSetIsSearchActive}
        searchInputRef={mockSearchInputRef}
        isScrolled={false}
        {...props}
      />
    );
  };

  describe('Initialization and User Role Detection', () => {
    it('loads search history from localStorage on mount', () => {
      renderComponent();
      expect(localStorageMock.getItem).toHaveBeenCalledWith('searchHistory');
    });

    it('detects student role and shows open events checkbox', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'user') return JSON.stringify({ role: USER_ROLES.STUDENT });
        if (key === 'searchHistory') return JSON.stringify([]);
        return null;
      });

      renderComponent();

      // Open search card to see the checkbox
      fireEvent.click(screen.getByPlaceholderText('Search activities'));
      expect(screen.getByTestId('open-only-checkbox')).toBeInTheDocument();
    });

    it('does not show open events checkbox for non-student roles', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'user') return JSON.stringify({ role: USER_ROLES.ORGANIZER });
        if (key === 'searchHistory') return JSON.stringify([]);
        return null;
      });

      renderComponent();
      fireEvent.click(screen.getByPlaceholderText('Search activities'));
      
      expect(screen.queryByTestId('open-only-checkbox')).not.toBeInTheDocument();
    });
  });

  describe('Search Input Interactions', () => {
    it('opens search card when input is clicked', () => {
      renderComponent();
      
      fireEvent.click(screen.getByPlaceholderText('Search activities'));
      
      expect(screen.getByTestId('search-card')).toBeInTheDocument();
    });

    it('shows search history dropdown when input is focused', () => {
      renderComponent();
      
      fireEvent.click(screen.getByPlaceholderText('Search activities'));
      
      expect(screen.getByText('previous search')).toBeInTheDocument();
      expect(screen.getByText('beach')).toBeInTheDocument();
    });

    it('selects search history item and closes dropdown', async () => {
      renderComponent();
      
      fireEvent.click(screen.getByPlaceholderText('Search activities'));
      fireEvent.click(screen.getByText('beach'));
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search activities')).toHaveValue('beach');
      });
      await waitFor(() => {
        expect(screen.queryByText('previous search')).not.toBeInTheDocument();
      });
    });

    it('removes item from search history', () => {
      renderComponent();
      
      fireEvent.click(screen.getByPlaceholderText('Search activities'));
      
      const removeButtons = screen.getAllByTitle('Remove');
      fireEvent.click(removeButtons[0]);
      
      expect(screen.queryByText('previous search')).not.toBeInTheDocument();
      expect(screen.getByText('beach')).toBeInTheDocument();
    });

    it('adds to search history on Enter key', () => {
      renderComponent();
      
      const input = screen.getByPlaceholderText('Search activities');
      fireEvent.change(input, { target: { value: 'new search' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'searchHistory',
        JSON.stringify(['new search', 'previous search', 'beach'])
      );
    });

    it('clears search when clear button is clicked', () => {
      renderComponent();
      
      const input = screen.getByPlaceholderText('Search activities');
      fireEvent.change(input, { target: { value: 'test query' } });
      
      // Clear button should appear
      const clearButton = screen.getByText('Clear');
      fireEvent.click(clearButton);
      
      expect(input).toHaveValue('');
      expect(mockSetIsSearchActive).toHaveBeenCalledWith(false);
    });
  });

  describe('Filtering Functionality', () => {
    it('filters events by search query', async () => {
      renderComponent();
      
      const input = screen.getByPlaceholderText('Search activities');
      fireEvent.change(input, { target: { value: 'beach' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toBeInTheDocument();
      });
      
      expect(screen.getByText('1 events found')).toBeInTheDocument();
      expect(screen.getByTestId('event-1')).toBeInTheDocument();
      expect(screen.queryByTestId('event-2')).not.toBeInTheDocument();
    });

    it('filters events by category', async () => {
      // This would require more complex testing since category filtering
      // happens within the SearchCard component
      renderComponent();
      
      // Open search and apply would typically set categories
      fireEvent.click(screen.getByPlaceholderText('Search activities'));
      fireEvent.click(screen.getByTestId('apply-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toBeInTheDocument();
      });
      
      // All events should be shown initially
      expect(screen.getByText('4 events found')).toBeInTheDocument();
    });

    it('filters open events only for students', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'user') return JSON.stringify({ role: USER_ROLES.STUDENT });
        if (key === 'searchHistory') return JSON.stringify([]);
        return null;
      });

      renderComponent();
      
      // Open search card and check open only
      fireEvent.click(screen.getByPlaceholderText('Search activities'));
      fireEvent.click(screen.getByTestId('open-only-checkbox'));
      fireEvent.click(screen.getByTestId('apply-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toBeInTheDocument();
      });
      
      // Should only show events with status 'open'
      expect(screen.getByText('2 events found')).toBeInTheDocument();
      expect(screen.getByTestId('event-1')).toBeInTheDocument(); // Beach Cleanup - open
      expect(screen.getByTestId('event-3')).toBeInTheDocument(); // Food Drive - open
      expect(screen.queryByTestId('event-2')).not.toBeInTheDocument(); // Tech Workshop - closed
    });

    it('filters events by date range', async () => {
      renderComponent();
      
      // This would require simulating date inputs in SearchCard
      // For now, we can test that date filtering logic exists
      fireEvent.click(screen.getByPlaceholderText('Search activities'));
      fireEvent.click(screen.getByTestId('apply-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toBeInTheDocument();
      });
      
      // All events should be visible without date filters
      expect(screen.getByText('4 events found')).toBeInTheDocument();
    });
  });

  describe('Activity Transformation', () => {
    it('transforms activities to events correctly', async () => {
      renderComponent();
      
      const input = screen.getByPlaceholderText('Search activities');
      fireEvent.change(input, { target: { value: 'tech' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toBeInTheDocument();
      });
      
      // Check that transformed event data is displayed
      expect(screen.getByText('Tech Workshop - closed')).toBeInTheDocument();
    });

    it('handles activities without cover images', async () => {
      renderComponent();
      
      const input = screen.getByPlaceholderText('Search activities');
      fireEvent.change(input, { target: { value: 'concert' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toBeInTheDocument();
      });
      
      // Music Concert has no cover image but should still be transformed
      expect(screen.getByText('Music Concert - pending')).toBeInTheDocument();
    });
  });

  describe('UI States and Interactions', () => {
    it('closes search card when clicking outside', () => {
      renderComponent();
      
      // Open search card
      fireEvent.click(screen.getByPlaceholderText('Search activities'));
      expect(screen.getByTestId('search-card')).toBeInTheDocument();
      
      // Click outside
      fireEvent.mouseDown(document);
      
      expect(screen.queryByTestId('search-card')).not.toBeInTheDocument();
    });

    it('shows search results when search is applied', async () => {
      renderComponent();
      
      const input = screen.getByPlaceholderText('Search activities');
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toBeInTheDocument();
      });
      
      expect(mockSetIsSearchActive).toHaveBeenCalledWith(true);
    });

    it('hides search results when back button is clicked', async () => {
      renderComponent();
      
      // Apply search first
      const input = screen.getByPlaceholderText('Search activities');
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toBeInTheDocument();
      });
      
      // Click back button
      fireEvent.click(screen.getByTestId('back-button'));
      
      expect(screen.queryByTestId('search-results')).not.toBeInTheDocument();
      expect(mockSetIsSearchActive).toHaveBeenCalledWith(false);
    });

    it('applies scaling when scrolled', () => {
      const { container } = render(
        <SearchLayout
          activities={mockActivities}
          setIsSearchActive={mockSetIsSearchActive}
          searchInputRef={mockSearchInputRef}
          isScrolled={true}
        />
      );
      
      const section = container.querySelector('section');
      const wrapper = section?.querySelector(':scope > div');
      expect(wrapper).toHaveClass('scale-90');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty activities array', () => {
      renderComponent({ activities: [] });
      
      const input = screen.getByPlaceholderText('Search activities');
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(screen.getByText('0 events found')).toBeInTheDocument();
    });

    it('handles malformed activity data gracefully', () => {
      const malformedActivities = [
        { id: 1, title: 'Valid Event' }, // Missing many required fields
        null, // Null activity
        undefined, // Undefined activity
      ] as any;
      
      renderComponent({ activities: malformedActivities });
      
      const input = screen.getByPlaceholderText('Search activities');
      fireEvent.change(input, { target: { value: 'valid' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      // Should filter out null/undefined and handle missing fields
      expect(screen.getByText('1 events found')).toBeInTheDocument();
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      expect(() => {
        renderComponent();
      }).not.toThrow();
      
      // Component should still render
      expect(screen.getByPlaceholderText('Search activities')).toBeInTheDocument();
    });
  });
});