'use client';

import React, { Suspense } from 'react';
import CallbackContent from './CallbackContent';

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-mutegreen to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait.</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}