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
  const searchParams = useSearchParams();
  const [oauthSession, setOAuthSession] = useState<string>('');

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationValidationSchema),
  });

  useEffect(() => {
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

    try {
      let result;
      if (oauthSession) {
        result = await OrganizationRegistrationService.registerWithOAuth(data, oauthSession);
      } else {
        result = await OrganizationRegistrationService.register(data);
      }

      if (result.success) {
        setSubmitSuccess(true);

        if (oauthSession) {
          if (result.redirect_url) {
            window.location.href = result.redirect_url;
          } else {
            window.location.href = '/homepage/organization';
          }
        } else {
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        }
      } else {
        setSubmitError(result.message || 'Registration failed');
      }
    } catch {
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
    oauthSession,
  };
}