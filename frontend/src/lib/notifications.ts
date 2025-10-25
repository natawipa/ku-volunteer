/* Notification system that fetches data to generate notifications
 */

import { activitiesApi } from './activities';
import { auth } from './utils';
import type { Activity, ActivityApplication } from './types';

const READ_NOTIFICATIONS_KEY = 'readNotifications';

export interface Notification {
  id: string;
  type: 'application_approved' | 'application_rejected' | 'activity_deleted' | 'activity_approved' | 'activity_rejected' | 'deletion_approved' | 'deletion_rejected';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  activityId?: number;
  applicationId?: number;
  isNew: boolean; // Within last 24 hours
}

/**
 * Get read notification IDs
 */
function getReadNotificationIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  
  try {
    const stored = localStorage.getItem(READ_NOTIFICATIONS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Mark a notification as read
 */
export function markNotificationAsRead(notificationId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const readIds = getReadNotificationIds();
    readIds.add(notificationId);
    localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(Array.from(readIds)));
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

/**
 * Get notifications for the current user based on their role
 */
export async function getNotifications(): Promise<Notification[]> {
  const role = auth.getUserRole();
  
  if (role === 'student') {
    return getStudentNotifications();
  } else if (role === 'organizer') {
    return getOrganizerNotifications();
  }
  
  return [];
}

/**
 * Get notifications for students
 * - Application approved
 * - Application rejected (with reason)
 * - Activity deleted (that they were participating in)
 */
async function getStudentNotifications(): Promise<Notification[]> {
  const notifications: Notification[] = [];
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const readIds = getReadNotificationIds();

  try {
    // Fetch student's applications
    const applicationsRes = await activitiesApi.getUserApplications();
    
    if (!applicationsRes.success || !applicationsRes.data) {
      return notifications;
    }

    const applications = applicationsRes.data as ActivityApplication[];

    // Check for approved applications
    const approvedApps = applications.filter(app => app.status === 'approved');
    for (const app of approvedApps) {
      const notificationId = `app-approved-${app.id}`;
      const decisionDate = app.decision_at ? new Date(app.decision_at) : null;
      const isNew = decisionDate ? decisionDate > oneDayAgo : false;
      
      notifications.push({
        id: notificationId,
        type: 'application_approved',
        title: 'Application Approved',
        message: `Your application for "${app.activity_title || 'activity'}" has been approved!`,
        timestamp: app.decision_at || app.submitted_at,
        read: readIds.has(notificationId),
        activityId: app.activity,
        applicationId: app.id,
        isNew,
      });
    }

    // Check for rejected applications
    const rejectedApps = applications.filter(app => app.status === 'rejected');
    for (const app of rejectedApps) {
      const notificationId = `app-rejected-${app.id}`;
      const decisionDate = app.decision_at ? new Date(app.decision_at) : null;
      const isNew = decisionDate ? decisionDate > oneDayAgo : false;
      const reason = app.notes ? `\nReason: ${app.notes}` : '';
      
      notifications.push({
        id: notificationId,
        type: 'application_rejected',
        title: 'Application Rejected',
        message: `Your application for "${app.activity_title || 'activity'}" was rejected.${reason}`,
        timestamp: app.decision_at || app.submitted_at,
        read: readIds.has(notificationId),
        activityId: app.activity,
        applicationId: app.id,
        isNew,
      });
    }

    // Check for deleted activities (approved apps where activity no longer exists)
    const approvedActivityIds = approvedApps.map(app => app.activity);
    const activitiesRes = await activitiesApi.getActivities();
    
    if (activitiesRes.success && activitiesRes.data) {
      const existingActivityIds = new Set(activitiesRes.data.map((a: Activity) => a.id));
      
      for (const app of approvedApps) {
        if (!existingActivityIds.has(app.activity)) {
          // Activity was deleted
          const notificationId = `activity-deleted-${app.id}`;
          notifications.push({
            id: notificationId,
            type: 'activity_deleted',
            title: 'Activity Deleted',
            message: `The activity "${app.activity_title || 'Unknown'}" you were participating in has been deleted.`,
            timestamp: app.decision_at || app.submitted_at,
            read: readIds.has(notificationId),
            activityId: app.activity,
            applicationId: app.id,
            isNew: true,
          });
        }
      }
    }

  } catch (error) {
    console.error('Error fetching student notifications:', error);
  }

  // Sort by timestamp (newest first)
  return notifications.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Get notifications for organizers
 * - Activity approved by admin
 * - Activity rejected by admin (with reason)
 */
async function getOrganizerNotifications(): Promise<Notification[]> {
  const notifications: Notification[] = [];
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const readIds = getReadNotificationIds();

  try {
    // Fetch all activities
    const activitiesRes = await activitiesApi.getActivities();
    
    if (!activitiesRes.success || !activitiesRes.data) {
      return notifications;
    }

    const activities = activitiesRes.data as Activity[];

    // Get user's email to match organizer
    const userData = auth.getUserData();
    const userEmail = userData?.email;

    // Filter activities by this organizer's email
    const myActivities = activities.filter(
      activity => activity.organizer_email === userEmail
    );

    // Check for approved activities
    const approvedActivities = myActivities.filter(act => act.status === 'open');
    for (const activity of approvedActivities) {
      const notificationId = `activity-approved-${activity.id}`;
      const createdDate = new Date(activity.created_at);
      const isNew = createdDate > oneDayAgo;
      
      // Only show if recently approved (within last day)
      if (isNew) {
        notifications.push({
          id: notificationId,
          type: 'activity_approved',
          title: 'Activity Approved',
          message: `Your activity "${activity.title}" has been approved and is now open!`,
          timestamp: activity.created_at,
          read: readIds.has(notificationId),
          activityId: activity.id,
          isNew: true,
        });
      }
    }

    // Check for rejected activities
    const rejectedActivities = myActivities.filter(act => act.status === 'rejected');
    for (const activity of rejectedActivities) {
      const notificationId = `activity-rejected-${activity.id}`;
      const updatedDate = new Date(activity.updated_at);
      const isNew = updatedDate > oneDayAgo;
      const reason = activity.rejection_reason ? `\nReason: ${activity.rejection_reason}` : '';
      
      notifications.push({
        id: notificationId,
        type: 'activity_rejected',
        title: 'Activity Rejected',
        message: `Your activity "${activity.title}" was rejected by admin.${reason}`,
        timestamp: activity.updated_at,
        read: readIds.has(notificationId),
        activityId: activity.id,
        isNew,
      });
    }

  } catch (error) {
    console.error('Error fetching organizer notifications:', error);
  }

  // Sort by timestamp (newest first)
  return notifications.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Get count of unread notifications
 */
export async function getUnreadCount(): Promise<number> {
  const notifications = await getNotifications();
  return notifications.filter(n => !n.read).length;
}

/**
 * Get count of new notifications (within last 24 hours)
 */
export async function getNewCount(): Promise<number> {
  const notifications = await getNotifications();
  return notifications.filter(n => n.isNew).length;
}
