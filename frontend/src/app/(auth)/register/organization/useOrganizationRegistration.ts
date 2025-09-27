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

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationValidationSchema),
  });

  useEffect(() => {
    // Get email from URL parameters if coming from OAuth
    const emailParam = searchParams.get('email');
    if (emailParam) {
      form.setValue('email', emailParam, { shouldValidate: true });
    }
  }, [searchParams, form]);

  const onSubmit = async (data: OrganizationFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    console.log('Submitting:', data);

    try {
      const result = await OrganizationRegistrationService.register(data);

      if (result.success) {
        console.log('Registration successful:', result.data);
        setSubmitSuccess(true);
        // Please add navigation logic here
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
  };
}