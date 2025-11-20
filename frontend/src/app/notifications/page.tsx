'use client';

import { useState, useEffect } from 'react';
import { getNotifications, markNotificationAsRead, type Notification } from '@/lib/notifications';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/lib/utils';
import { USER_ROLES } from '@/lib/constants';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { SquareCheck,SquareX,Trash,Megaphone,MapPinCheckInside,Pin,AlarmClock,Bell} from 'lucide-react';
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'read'>('all');
  const [refreshKey, setRefreshKey] = useState(0); // Trigger re-render for timestamps
  void refreshKey; // Used to force re-renders via state change
  const router = useRouter();
  const userRole = auth.getUserRole();

  // Fetch notifications
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const notifs = await getNotifications();
      setNotifications(notifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Update timestamps every 30 seconds
    const timeInterval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000);
    
    return () => clearInterval(timeInterval);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markNotificationAsRead(notification.id);
    
    // Update state immediately
    setNotifications(notifications.map(n => 
      n.id === notification.id ? { ...n, read: true } : n
    ));
    
    // Navigate if activity available
    if (notification.activityId) {
      router.push(`/event-detail/${notification.activityId}`);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'application_approved':
      case 'activity_approved':
      case 'deletion_approved':
        return <SquareCheck />;
      case 'application_rejected':
      case 'activity_rejected':
      case 'deletion_rejected':
        return <SquareX />;
      case 'activity_deleted':
        return <Trash />;
      case 'pending_applications_reminder':
        return <AlarmClock />;
      case 'activity_reminder':
        return <Pin />;
      case 'checkin_reminder':
        return <MapPinCheckInside />;
      default:
        return <Megaphone />;
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
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getLogo = () => {
    return userRole === USER_ROLES.ORGANIZER ? "/logo-organizer.svg" : "/logo-kasetsart.svg";
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'new') return !notif.read; // Unread notifications
    if (filter === 'read') return notif.read; // Read notifications
    return true;
  });

  const newCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#DAE9DC] to-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/50 rounded-lg transition-colors">
              <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
            </Link>
            <Image src={getLogo()} alt="Logo" width={48} height={48} className="object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          <div className="w-14"></div> {/* Spacer for centering */}
        </header>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-[#215701] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('new')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'new'
                ? 'bg-[#215701] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            New ({newCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'read'
                ? 'bg-[#215701] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Read ({notifications.length - newCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#215701]"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="text-10xl mb-4 flex justify-center"><Bell /></div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
              </h2>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? "You'll see updates about your activities here"
                  : `Switch to another tab to see ${filter === 'new' ? 'older' : 'newer'} notifications`
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-5 ${
                  !notification.read 
                    ? 'bg-[#DAE9DC] ring-2 ring-[#215701] ring-opacity-50' 
                    : 'bg-white'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="text-3xl flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 text-base">
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="px-2 py-1 text-xs font-medium bg-[#215701] text-white rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-2 whitespace-pre-line">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{formatTimestamp(notification.timestamp)}</span>
                      {notification.activityId && (
                        <>
                          <span>•</span>
                          <span className="text-[#215701]">Click to view activity</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Back to Home */}
        {!isLoading && filteredNotifications.length > 0 && (
          <div className="mt-8 text-center">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-[#215701] hover:text-[#215701] font-medium"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
