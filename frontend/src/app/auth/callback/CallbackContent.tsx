'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('processing');
  
  useEffect(() => {
    const access = searchParams.get('access');
    const refresh = searchParams.get('refresh');
    const role = searchParams.get('role');
    
    console.log('OAuth callback params:', { access: !!access, refresh: !!refresh, role });
    
    if (access && refresh) {
      // Store tokens in localStorage
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      setStatus('success');
      
      // Redirect based on user role after a short delay
      setTimeout(() => {
        console.log('OAuth redirecting based on role:', role);
        if (role === 'student') {
          console.log('Redirecting to student homepage');
          router.push('/student-homepage');
        } else if (role === 'organizer') {
          console.log('Redirecting to staff homepage');
          router.push('/staff-homepage');
        } else {
          console.log('Redirecting to main page');
          router.push('/'); // Default redirect for admin or unknown roles
        }
      }, 2000);
    } else {
      console.error('OAuth callback missing parameters');
      setStatus('error');
    }
  }, [searchParams, router]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-mutegreen to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {status === 'processing' && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Authenticating...</h2>
            <p className="text-gray-600">Please wait while we sign you in.</p>
          </div>
        )}
        
        {status === 'success' && (
          <div>
            <div className="rounded-full h-12 w-12 bg-green-100 mx-auto mb-4 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Success!</h2>
            <p className="text-gray-600">You have been successfully signed in. Redirecting...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div>
            <div className="rounded-full h-12 w-12 bg-red-100 mx-auto mb-4 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-4">There was an error during authentication.</p>
            <button 
              onClick={() => router.push('/login')}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}