'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StaffHomepage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the unified home page
    router.replace('/');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}