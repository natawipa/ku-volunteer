'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  useEffect(() => {
    const access = searchParams.get('access');
    const refresh = searchParams.get('refresh');
    const role = searchParams.get('role');
    
    console.log('OAuth callback params:', { access: !!access, refresh: !!refresh, role });
    
    if (access && refresh) {
      // Store tokens in localStorage
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      // Redirect immediately based on user role
      console.log('OAuth redirecting based on role:', role);
      if (role === 'student') {
        console.log('Redirecting to student homepage');
        router.replace('/student-homepage');
      } else if (role === 'organizer') {
        console.log('Redirecting to staff homepage');
        router.replace('/staff-homepage');
      } else {
        console.log('Redirecting to main page');
        router.replace('/'); // Default redirect for admin or unknown roles
      }
    } else {
      console.error('OAuth callback missing parameters');
      router.replace('/login?error=authentication_failed');
    }
  }, [searchParams, router]);
  
  // Return null to render nothing while redirecting
  return null;
}