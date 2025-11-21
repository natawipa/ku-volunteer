import { useState, useCallback, useEffect } from 'react';
import { activitiesApi } from '../../../lib/activities';
import { useModal } from '../../components/Modal';
import { APPLICATION_STATUS, UI_CONSTANTS } from '../../../lib/constants';
import type { ActivityApplication, CreateApplicationRequest } from '../../../lib/types';

export function ApplicationManagement(eventId: number | null, isStudent: boolean) {
  const [userApplication, setUserApplication] = useState<ActivityApplication | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const { showModal } = useModal();

  const checkUserApplication = useCallback(async () => {
    if (eventId == null || Number.isNaN(eventId) || !isStudent) {
      return;
    }
    
    try {
      const applicationsResponse = await activitiesApi.getUserApplications();
      
      if (applicationsResponse.success && applicationsResponse.data) {
        const userApp = applicationsResponse.data.find(
          (app: ActivityApplication) => app.activity === eventId
        );
        
        if (userApp) {
          setUserApplication(userApp);
          setApplicationStatus(userApp.status);
        } else {
          setUserApplication(null);
          setApplicationStatus(null);
        }
      } else {
        setUserApplication(null);
        setApplicationStatus(null);
      }
    } catch {
      setUserApplication(null);
      setApplicationStatus(null);
    }
  }, [eventId, isStudent]);

  const handleApply = async () => {
    if (eventId == null || Number.isNaN(eventId)) return;
    
    try {
      setApplying(true);
      const applicationData: CreateApplicationRequest = { activity: eventId };
      const response = await activitiesApi.createApplication(applicationData);
      
      if (response.success && response.data) {
        setApplicationStatus(APPLICATION_STATUS.PENDING);
        setUserApplication(response.data);
        showModal('Application submitted successfully! You can track your application status in "My Events"');
        await checkUserApplication();
      } else {
        if (response.error?.includes('already applied')) {
          await checkUserApplication();
          showModal('You have already applied to this activity.');
        } else {
          showModal(`Application failed`);
        }
      }
    } catch {
      showModal('An error occurred while submitting your application. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  const handleCancelApplication = async () => {
    if (!userApplication) return;

    try {
      const response = await activitiesApi.cancelApplication(userApplication.id);
      
      if (response.success) {
        setApplicationStatus(APPLICATION_STATUS.CANCELLED);
        setUserApplication({ 
          ...(userApplication as ActivityApplication), 
          status: APPLICATION_STATUS.CANCELLED as ActivityApplication['status'] 
        });
        showModal('Application cancelled successfully.');
      } else {
        showModal(`Cancellation failed`);
      }
    } catch {
      showModal('An error occurred while cancelling your application. Please try again.');
    }
  };

  useEffect(() => {
    if (!isStudent) return;
    
    const interval = setInterval(checkUserApplication, UI_CONSTANTS.POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [isStudent, checkUserApplication]);

  useEffect(() => {
    if (!isStudent) return;
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkUserApplication();
      }
    };

    const handleFocus = () => {
      checkUserApplication();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isStudent, checkUserApplication]);

  return {
    userApplication,
    applicationStatus,
    applying,
    checkUserApplication,
    handleApply,
    handleCancelApplication
  };
}