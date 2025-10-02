import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { OrganizationFormData } from './types';
import { organizationValidationSchema } from './validation';
import { OrganizationRegistrationService } from './api';

export function useOrganizationRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showRedirectPage] = useState(false);
  const searchParams = useSearchParams();
  const [oauthSession, setOAuthSession] = useState<string>('');

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationValidationSchema),
  });

  useEffect(() => {
    // Get email and oauth session from URL parameters if coming from OAuth
    const emailParam = searchParams.get('email');
    const oauthSessionParam = searchParams.get('oauth_session');
    if (emailParam) {
      form.setValue('email', emailParam, { shouldValidate: true });
    }
    if (oauthSessionParam) {
      setOAuthSession(oauthSessionParam);
    }
  }, [searchParams, form]);

  const onSubmit = async (data: OrganizationFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    console.log('Submitting:', data);

    try {
      let result;
      if (oauthSession) {
        // Use OAuth registration endpoint
        result = await OrganizationRegistrationService.registerWithOAuth(data, oauthSession);
      } else {
        // Use regular registration endpoint
        result = await OrganizationRegistrationService.register(data);
      }

      if (result.success) {
        console.log('Registration successful:', result.data);
        setSubmitSuccess(true);

        // If OAuth registration, backend already issued tokens and provided a callback URL
        if (oauthSession) {
          if (result.redirect_url) {
            window.location.href = result.redirect_url;
          } else {
            window.location.href = '/homepage/organization';
          }
        } else {
          // Manual registration will redirect to login page after short delay
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        }
      } else {
        console.error('Registration failed:', result.message);
        setSubmitError(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setSubmitError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    ...form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting,
    submitError,
    submitSuccess,
    showRedirectPage,
    oauthSession,
  };
}