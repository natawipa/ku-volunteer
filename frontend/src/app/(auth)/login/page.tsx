'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import Card from '../../(auth)/components/Card';
import { API_ENDPOINTS, ENV, ERROR_MESSAGES, ROUTES } from '../../../lib/constants';
import type { LoginFormData } from '../../../lib/types';
import { auth, handleApiError, validation } from '../../../lib/utils';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const router = useRouter();

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    const emailError = validation.email(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validation.password(formData.password);
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    setApiError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      const response = await auth.login(formData.email, formData.password);

      if (response.success && response.data) {
        // Redirect to the unified home page
        // The home page will display appropriate content based on user role
        router.push('/');
      } else {
        setApiError(handleApiError(response.error || ERROR_MESSAGES.INVALID_CREDENTIALS));
      }
    } catch {
      setApiError(ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Redirect to Google OAuth
    window.location.href = `${ENV.API_BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE_LOGIN}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mutegreen to-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-2 left-2 w-15 h-15 bg-[url('/images/logokaset.png')] bg-contain bg-no-repeat z-10" />
      <div className="absolute bottom-0 left-0 w-full h-150 bg-[url('/images/wavewave.png')] bg-bottom bg-no-repeat bg-cover z-0" />
      
      <Card title="Log in">
        {apiError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded" role="alert">
            {apiError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              placeholder="username@gmail.com"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400 ${
                errors.email ? 'border-red-400' : 'border-gray-200'
              }`}
              required
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              placeholder="Password"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400 ${
                errors.password ? 'border-red-400' : 'border-gray-200'
              }`}
              required
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && (
              <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          <div className="mt-6 text-right">
            <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-green-700 font-small">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white py-3 rounded-lg font-medium hover:bg-green-800 transition-colors duration-200 focus:ring-4 focus:ring-green-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={loading ? 'Signing in...' : 'Sign in'}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6">
          <div className="text-center text-sm text-gray-500 mb-4">
            or continue with
          </div>
          
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full border border-gray-200 py-3 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors duration-200 focus:ring-4 focus:ring-gray-100 focus:outline-none"
            aria-label="Sign in with Google"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="ml-2">Continue with Google</span>
          </button>
        </div>

        <div className="mt-6 text-center">
          <span className="text-sm text-gray-600">Don&apos;t have an account? </span>
          <Link href={ROUTES.ROLE_SELECTION} className="text-sm text-green-600 hover:text-green-700 font-medium">
            Create one
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
