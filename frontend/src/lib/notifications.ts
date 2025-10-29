/* Notification system that fetches data to generate notifications
 */

import { activitiesApi } from './activities';
import { auth } from './utils';
import type { Activity, ActivityApplication } from './types';

const READ_NOTIFICATIONS_KEY = 'readNotifications';
const PENDING_APPS_TRACKER_KEY = 'pendingAppsTracker'; // Track pending counts over time

export interface Notification {
  id: string;
  type: 'application_approved' | 'application_rejected' | 'activity_deleted' | 'activity_approved' | 'activity_rejected' | 'deletion_approved' | 'deletion_rejected' | 'pending_applications_reminder';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  activityId?: number;
  applicationId?: number;
  isNew: boolean; // Within last 24 hours
}

interface PendingAppTracker {
  [activityId: string]: {
    count: number;
    firstSeenAt: string;
  };
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
 * Get pending applications tracker from localStorage
 */
function getPendingAppsTracker(): PendingAppTracker {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(PENDING_APPS_TRACKER_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Update pending applications tracker
 */
function updatePendingAppsTracker(activityId: number, count: number): void {
  if (typeof window === 'undefined') return;
  
  try {
    const tracker = getPendingAppsTracker();
    const key = activityId.toString();
    const now = new Date().toISOString();
    
    if (count === 0) {
      // No pending apps, remove from tracker
      delete tracker[key];
    } else if (!tracker[key]) {
      // First time seeing this count
      tracker[key] = { count, firstSeenAt: now };
    } else if (tracker[key].count !== count) {
      // Count changed, reset timer
      tracker[key] = { count, firstSeenAt: now };
    }
    // If count is same, keep the original firstSeenAt timestamp
    
    localStorage.setItem(PENDING_APPS_TRACKER_KEY, JSON.stringify(tracker));
  } catch (error) {
    console.error('Error updating pending apps tracker:', error);
  }
}

/**
 * Check if pending apps have been waiting for 1+ days
 */
function shouldNotifyPendingApps(activityId: number, count: number): boolean {
  if (typeof window === 'undefined') return false;
  
  const tracker = getPendingAppsTracker();
  const key = activityId.toString();
  
  if (!tracker[key] || tracker[key].count !== count) {
    return false;
  }
  
  const firstSeenAt = new Date(tracker[key].firstSeenAt);
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - firstSeenAt.getTime()) / (24 * 60 * 60 * 1000));
  
  return daysSince >= 1;
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
        activityId: app.activity ?? undefined,
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
        activityId: app.activity ?? undefined,
        applicationId: app.id,
        isNew,
      });
    }

    // Check for deleted activities (approved apps where activity is null)
    const deletedActivityApps = approvedApps.filter(app => app.activity === null);
    
    for (const app of deletedActivityApps) {
      const notificationId = `activity-deleted-${app.id}`;
      
      // Use current time as timestamp since we don't know when it was deleted
      // This ensures the notification appears as "new"
      const deletionTimestamp = new Date().toISOString();
      
      notifications.push({
        id: notificationId,
        type: 'activity_deleted',
        title: 'Activity Deleted',
        message: `The activity "${app.activity_title || 'Unknown'}" you were participating in has been deleted.`,
        timestamp: deletionTimestamp,
        read: readIds.has(notificationId),
        activityId: undefined,
        applicationId: app.id,
        isNew: true, // Always show as new since we just detected the deletion
      });
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
      // Use updated_at to check when the activity was approved (status changed)
      const updatedDate = new Date(activity.updated_at);
      const isNew = updatedDate > oneDayAgo;
      
      // Only show if recently approved (within last day)
      if (isNew) {
        notifications.push({
          id: notificationId,
          type: 'activity_approved',
          title: 'Activity Approved',
          message: `Your activity "${activity.title}" has been approved and is now open!`,
          timestamp: activity.updated_at,
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

    // Check for pending applications and send reminders if waiting 1+ days
    for (const activity of myActivities) {
      try {
        const applicationsRes = await activitiesApi.getActivityApplications(activity.id);
        
        if (applicationsRes.success && applicationsRes.data) {
          const applications = applicationsRes.data as ActivityApplication[];
          const pendingCount = applications.filter(app => app.status === 'pending').length;
          
          // Update tracker with current count
          updatePendingAppsTracker(activity.id, pendingCount);
          
          // Check if we should send a reminder notification
          if (pendingCount > 0 && shouldNotifyPendingApps(activity.id, pendingCount)) {
            const notificationId = `pending-apps-${activity.id}-${pendingCount}`;
            
            notifications.push({
              id: notificationId,
              type: 'pending_applications_reminder',
              title: 'Pending Applications',
              message: `There ${pendingCount === 1 ? 'is' : 'are'} ${pendingCount} participant application${pendingCount > 1 ? 's' : ''} waiting for you in "${activity.title}"`,
              timestamp: new Date().toISOString(),
              read: readIds.has(notificationId),
              activityId: activity.id,
              isNew: true,
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching applications for activity ${activity.id}:`, error);
      }
    }

    // Check for deletion requests (approved or rejected)
    try {
      const deletionRequestsRes = await activitiesApi.getDeletionRequests();
      
      if (deletionRequestsRes.success && deletionRequestsRes.data) {
        const deletionRequests = deletionRequestsRes.data;
        
        // Backend already filters by organizer_profile_id, so all deletion requests are ours
        // No need to filter by activity ID (which would exclude approved requests where activity=null)
        const myDeletionRequests = deletionRequests;
        
        for (const request of myDeletionRequests) {
          // Check for approved deletion requests
          if (request.status === 'approved') {
            const notificationId = `deletion-approved-${request.id}`;
            const timestamp = request.reviewed_at || request.requested_at || new Date().toISOString();
            const reviewedDate = new Date(timestamp);
            const isNew = reviewedDate > oneDayAgo;
            
            notifications.push({
              id: notificationId,
              type: 'deletion_approved',
              title: 'Deletion Request Approved',
              message: `Your request to delete "${request.title}" has been approved by admin.`,
              timestamp,
              read: readIds.has(notificationId),
              activityId: Number(request.activity),
              isNew,
            });
          }
          
          // Check for rejected deletion requests
          if (request.status === 'rejected') {
            const notificationId = `deletion-rejected-${request.id}`;
            const timestamp = request.reviewed_at || request.requested_at || new Date().toISOString();
            const reviewedDate = new Date(timestamp);
            const isNew = reviewedDate > oneDayAgo;
            const reason = request.review_note ? `\nReason: ${request.review_note}` : '';
            
            notifications.push({
              id: notificationId,
              type: 'deletion_rejected',
              title: 'Deletion Request Rejected',
              message: `Your request to delete "${request.title}" was rejected by admin.${reason}`,
              timestamp,
              read: readIds.has(notificationId),
              activityId: Number(request.activity),
              isNew,
            });
          }
        }
      } else {
        console.error('❌ Failed to fetch deletion requests:', deletionRequestsRes.error);
      }
    } catch (error) {
      console.error('Error fetching deletion requests:', error);
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

/**
 * Get pending applications count for a specific activity
 * This is used to show badge on activity cards
 */
export async function getPendingApplicationsForActivity(activityId: number): Promise<number> {
  try {
    const applicationsRes = await activitiesApi.getActivityApplications(activityId);
    
    if (applicationsRes.success && applicationsRes.data) {
      const applications = applicationsRes.data as ActivityApplication[];
      return applications.filter(app => app.status === 'pending').length;
    }
    
    return 0;
  } catch (error) {
    console.error(`Error fetching applications for activity ${activityId}:`, error);
    return 0;
  }
}
