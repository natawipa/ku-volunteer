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
      
      // Redirect to unified home page for all users
      console.log('OAuth redirecting to unified home page, role:', role);
      router.replace('/');
    } else {
      console.error('OAuth callback missing parameters');
      router.replace('/login?error=authentication_failed');
    }
  }, [searchParams, router]);
  
  // Return null to render nothing while redirecting
  return null;
}