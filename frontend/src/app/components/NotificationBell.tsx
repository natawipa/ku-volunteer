'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { getNotifications, getUnreadCount, markNotificationAsRead, type Notification } from '@/lib/notifications';
import { useRouter } from 'next/navigation';

// Mark all notifications as read
function markAllAsRead(notifications: Notification[]) {
  notifications.forEach(notif => {
    markNotificationAsRead(notif.id);
  });
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [refreshKey, setRefreshKey] = useState(0); // Trigger re-render for timestamps
  void refreshKey; // Used to force re-renders via state change
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  // Fetch notifications
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const [notifs, count] = await Promise.all([
        getNotifications(),
        getUnreadCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications();
    
    // Refresh notifications every 60 seconds
    const notifInterval = setInterval(fetchNotifications, 60000);
    
    // Update timestamps every 30 seconds
    const timeInterval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000);
    
    return () => {
      clearInterval(notifInterval);
      clearInterval(timeInterval);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleBellClick = () => {
    if (!isOpen && buttonRef.current) {
      // Calculate position when opening
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    markAllAsRead(notifications);
    
    // Update state immediately to reflect changes
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    
    // Also refresh from server to ensure consistency
    fetchNotifications();
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markNotificationAsRead(notification.id);
    
    // Update state immediately to reflect changes
    setNotifications(notifications.map(n => 
      n.id === notification.id ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // Close dropdown
    setIsOpen(false);
    
    // Navigate to activity detail if available
    if (notification.activityId) {
      router.push(`/event-detail/${notification.activityId}`);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'application_approved':
      case 'activity_approved':
      case 'deletion_approved':
        return '✅';
      case 'application_rejected':
      case 'activity_rejected':
      case 'deletion_rejected':
        return '❌';
      case 'activity_deleted':
        return '🗑️';
      case 'pending_applications_reminder':
        return '⏰';
      default:
        return '📢';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative z-[10000]" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        ref={buttonRef}
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:text-[#000000] transition-colors duration-200"
        aria-label="Notifications"
      >
        {/* Bell Icon from Lucide */}
        <Bell className="w-6 h-6" />

        {/* Badge for new notifications */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-[#DC143C] rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div 
          className="fixed w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-[99999] max-h-[32rem] overflow-hidden flex flex-col"
          style={{
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <span className="text-xs font-medium text-[#215701] bg-[#DAE9DC] px-2 py-1 rounded-full">
                    {unreadCount} new
                  </span>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-[#00361C] hover:text-[#215701] font-medium whitespace-nowrap"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#215701]"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="text-4xl mb-2">🔔</div>
                <p className="text-gray-500 text-center">No notifications yet</p>
                <p className="text-gray-400 text-sm text-center mt-1">
                  You&apos;ll see updates about your activities here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.slice(0, 2).map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-150 ${
                      !notification.read ? 'bg-[#DAE9DC]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="text-2xl flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm mb-1">
                          {notification.title}
                        </p>
                        <p className="text-gray-600 text-sm whitespace-pre-line">
                          {notification.message}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>

                      {/* Unread Badge (Dot) */}
                      {!notification.read && (
                        <div className="w-2 h-2 bg-[#00361C] rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/notifications');
                }}
                className="text-sm text-[#00361C] hover:text-[#215701] font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
