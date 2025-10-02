'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth } from '../../../lib/utils';
import { STORAGE_KEYS } from '../../../lib/constants';

export default function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  useEffect(() => {
    const access = searchParams.get('access');
    const refresh = searchParams.get('refresh');
    const role = searchParams.get('role');
    const email = searchParams.get('email');
    const firstName = searchParams.get('first_name');
    const lastName = searchParams.get('last_name');
    const userId = searchParams.get('user_id');
    
    console.log('OAuth callback params:', { 
      access: !!access, 
      refresh: !!refresh, 
      role,
      email,
      firstName,
      lastName,
      userId
    });
    
    if (access && refresh) {
      // Store tokens using auth utility
      auth.setTokens(access, refresh);
      
      // Create and store user data if provided
      if (role || email || firstName || lastName || userId) {
        const userData = {
          ...(userId && { id: userId }),
          ...(email && { email }),
          ...(firstName && { first_name: firstName }),
          ...(lastName && { last_name: lastName }),
          ...(role && { role }),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
        console.log('Stored user data:', userData);
      }
      
      // Redirect to unified home page for all users
      console.log('OAuth redirecting to unified home page, role:', role);
      router.replace('/');
    } else {
      console.error('OAuth callback missing required tokens');
      router.replace('/login?error=authentication_failed');
    }
  }, [searchParams, router]);
  
  // Return loading state while processing
  return (
    <div className="min-h-screen bg-gradient-to-br from-mutegreen to-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-2 left-2 w-15 h-15 bg-[url('/images/logokaset.png')] bg-contain bg-no-repeat z-10"></div>
      <div className="absolute bottom-0 left-0 w-full h-150 bg-[url('/images/wavewave.png')] bg-bottom bg-no-repeat bg-cover z-0"></div>
      
      <div className="relative z-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}