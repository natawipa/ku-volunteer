'use client';

import { useSearchParams } from 'next/navigation';

export default function ErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'unknown';

  const isMismatch = reason === 'account_mismatch';

  const handleGoBack = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mutegreen to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">
          {isMismatch ? 'Account mismatch detected' : 'Authentication error'}
        </h2>
        <p className="text-gray-600 mb-6">
          {isMismatch
            ? "You're signed in to the backend as a different account (e.g., admin), and tried to link a Google account that doesn't match. Please sign out of Django admin or use an incognito window, then try again."
            : 'Something went wrong during authentication.'}
        </p>
        <div className="flex items-center justify-center">
          <button
            onClick={handleGoBack}
            className="px-5 py-2 rounded-full bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
