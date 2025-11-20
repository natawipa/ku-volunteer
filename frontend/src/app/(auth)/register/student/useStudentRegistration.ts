import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { StudentFormData } from './types';
import { studentValidationSchema } from './validation';
import { StudentRegistrationService } from './api';

export function useStudentRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const searchParams = useSearchParams();
  const [oauthSession, setOAuthSession] = useState<string>('');

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentValidationSchema),
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

  const onSubmit = async (data: StudentFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      let result;
      if (oauthSession) {
        result = await StudentRegistrationService.registerWithOAuth(data, oauthSession);
      } else {
        result = await StudentRegistrationService.register(data);
      }

      if (result.success) {
        setSubmitSuccess(true);

        if (oauthSession) {
          if (result.redirect_url) {
            window.location.href = result.redirect_url;
          } else {
            window.location.href = '/';
          }
        } else {
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
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