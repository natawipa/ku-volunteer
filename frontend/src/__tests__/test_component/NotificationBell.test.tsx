/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));

const mockGetNotifications = jest.fn();
const mockGetUnreadCount = jest.fn();
const mockMarkNotificationAsRead = jest.fn();
jest.mock('@/lib/notifications', () => ({
  getNotifications: () => mockGetNotifications(),
  getUnreadCount: () => mockGetUnreadCount(),
  markNotificationAsRead: (id: number) => mockMarkNotificationAsRead(id),
}));

import NotificationBell from '@/app/components/NotificationBell';

describe('NotificationBell', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows unread badge and opens dropdown with notifications', async () => {
    mockGetUnreadCount.mockResolvedValue(2);
    mockGetNotifications.mockResolvedValue([
      { id: 1, title: 'T1', message: 'M1', timestamp: new Date().toISOString(), type: 'activity_approved', read: false, activityId: 7 },
      { id: 2, title: 'T2', message: 'M2', timestamp: new Date().toISOString(), type: 'application_rejected', read: true },
    ]);

    render(<NotificationBell />);

    // Badge should appear (unreadCount > 0)
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());

    // Click the bell to open dropdown
    const btn = screen.getByRole('button', { name: /Notifications/i });
    fireEvent.click(btn);

    // Expect a notification title to be displayed
    await waitFor(() => expect(screen.getByText('T1')).toBeInTheDocument());

    // Click the notification to navigate
    const notifBtn = screen.getByText('T1').closest('button') as HTMLElement;
    fireEvent.click(notifBtn);

    await waitFor(() => expect(mockMarkNotificationAsRead).toHaveBeenCalledWith(1));
    expect(mockPush).toHaveBeenCalledWith('/event-detail/7');
  });

  it('shows empty state when no notifications', async () => {
    mockGetUnreadCount.mockResolvedValue(0);
    mockGetNotifications.mockResolvedValue([]);

    render(<NotificationBell />);

    // No badge
    await waitFor(() => expect(screen.queryByText('0')).not.toBeInTheDocument());

    const btn = screen.getByRole('button', { name: /Notifications/i });
    fireEvent.click(btn);

    await waitFor(() => expect(screen.getByText(/No notifications yet/i)).toBeInTheDocument());
  });

  it('mark all read button calls API and clears unread badge', async () => {
    mockGetUnreadCount.mockResolvedValue(3);
    mockGetNotifications.mockResolvedValue([
      { id: 1, title: 'A', message: '', timestamp: new Date().toISOString(), type: 'activity_approved', read: false },
      { id: 2, title: 'B', message: '', timestamp: new Date().toISOString(), type: 'activity_approved', read: false },
      { id: 3, title: 'C', message: '', timestamp: new Date().toISOString(), type: 'activity_approved', read: false },
    ]);

    render(<NotificationBell />);

    // Wait for badge
    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());

    // Open dropdown
    const btn = screen.getByRole('button', { name: /Notifications/i });
    fireEvent.click(btn);

    await waitFor(() => expect(screen.getByText('A')).toBeInTheDocument());

    // Click Mark all read
    const markBtn = screen.getByText(/Mark all read/i);
    fireEvent.click(markBtn);

    await waitFor(() => {
      // markNotificationAsRead should have been called for each id
      expect(mockMarkNotificationAsRead).toHaveBeenCalledTimes(3);
      // unread badge no longer shows number
      expect(screen.queryByText('3')).not.toBeInTheDocument();
    });
  });

  it('View all navigates to /notifications and clicking outside closes dropdown', async () => {
    mockGetUnreadCount.mockResolvedValue(1);
    mockGetNotifications.mockResolvedValue([
      { id: 5, title: 'T', message: '', timestamp: new Date().toISOString(), type: 'activity_approved', read: false },
    ]);

    render(<NotificationBell />);

    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
    const btn = screen.getByRole('button', { name: /Notifications/i });
    fireEvent.click(btn);

    await waitFor(() => expect(screen.getByText('T')).toBeInTheDocument());

    // Click View all
    const viewAll = screen.getByText(/View all notifications/i);
    fireEvent.click(viewAll);
    expect(mockPush).toHaveBeenCalledWith('/notifications');

    // Open again and then click outside
    fireEvent.click(btn);
    await waitFor(() => expect(screen.getByText('T')).toBeInTheDocument());
    // simulate outside click
    fireEvent.mouseDown(document.body);
    await waitFor(() => expect(screen.queryByText('T')).not.toBeInTheDocument());
  });
});
