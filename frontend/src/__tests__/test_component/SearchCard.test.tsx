/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import SearchCard from '@/app/components/SearchCard';

describe('SearchCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders history from localStorage and allows deleting and clearing', async () => {
    localStorage.setItem('searchHistory', JSON.stringify(['one', 'two']));
    render(<SearchCard />);

    expect(screen.getByText('one')).toBeInTheDocument();
    expect(screen.getByText('two')).toBeInTheDocument();

    // delete the first item
    const deleteBtn = screen.getByLabelText('Delete history item 0');
    fireEvent.click(deleteBtn);

    await waitFor(() => expect(screen.queryByText('one')).not.toBeInTheDocument());

    // clear history
    const clearBtn = screen.getByText('Clear history');
    fireEvent.click(clearBtn);
    await waitFor(() => expect(screen.queryByText('two')).not.toBeInTheDocument());
  });

  it('toggles category dropdown and selects categories', async () => {
    const setCategoriesSelected = jest.fn();
    render(<SearchCard categoriesSelected={[]} setCategoriesSelected={setCategoriesSelected} />);

    // open categories
    const trigger = screen.getByText(/Select categories.../i);
    fireEvent.click(trigger);

    // Click a category from the default list
    const cat = screen.getByText('University Activities');
    fireEvent.click(cat);

    // Controlled mode should call setCategoriesSelected with an array containing the category
    await waitFor(() => {
      expect(setCategoriesSelected).toHaveBeenCalledWith(expect.arrayContaining(['University Activities']));
    });
  });

  it('applies status selection when organizer role in localStorage', async () => {
    // set role
    localStorage.setItem('user', JSON.stringify({ role: 'organizer' }));

    // controlled mode for statuses
    const setStatusSelected = jest.fn();
    render(<SearchCard showStatus statusSelected={[]} setStatusSelected={setStatusSelected} />);
    const statusTrigger = screen.getByText(/Select status.../i);
    fireEvent.click(statusTrigger);

    const pending = screen.getByText('Pending');
    fireEvent.click(pending);

    await waitFor(() => {
      expect(setStatusSelected).toHaveBeenCalledWith(expect.arrayContaining(['Pending']));
    });
  });

  it('date inputs change call setters and Enter key triggers onApply', () => {
    const setStart = jest.fn();
    const setEnd = jest.fn();
    const onApply = jest.fn();

    render(<SearchCard setStartDate={setStart} setEndDate={setEnd} onApply={onApply} />);

    // inputs are not associated with labels via htmlFor, select by type
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const startInput = dateInputs[0] as HTMLInputElement;
    const endInput = dateInputs[1] as HTMLInputElement;

    fireEvent.change(startInput, { target: { value: '2025-01-01' } });
    fireEvent.change(endInput, { target: { value: '2025-01-02' } });

    expect(setStart).toHaveBeenCalledWith('2025-01-01');
    expect(setEnd).toHaveBeenCalledWith('2025-01-02');

    // Press Enter on startInput
    fireEvent.keyDown(startInput, { key: 'Enter', code: 'Enter' });
    expect(onApply).toHaveBeenCalled();
  });

  it('apply button triggers onApply', () => {
    const onApply = jest.fn();
    render(<SearchCard onApply={onApply} />);

    const applyBtn = screen.getByRole('button', { name: /Search/i });
    fireEvent.click(applyBtn);
    expect(onApply).toHaveBeenCalled();
  });
});
