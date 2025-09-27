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

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentValidationSchema),
  });

  useEffect(() => {
    // Get email from URL parameters if coming from OAuth
    const emailParam = searchParams.get('email');
    if (emailParam) {
      form.setValue('email', emailParam, { shouldValidate: true });
    }
  }, [searchParams, form]);

  const onSubmit = async (data: StudentFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    console.log('Submitting:', data);

    try {
      const result = await StudentRegistrationService.register(data);

      if (result.success) {
        console.log('Registration successful:', result.data);
        setSubmitSuccess(true);
        // You can add navigation logic here
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