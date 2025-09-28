import React from 'react';
import Link from 'next/link';

export default function DocumentPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Documents</h1>
        <p className="text-gray-600 mb-6">Document management page is coming soon!</p>
        <div className="space-y-2">
          <Link 
            href="/student-homepage" 
            className="block w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
          >
            Back to Student Homepage
          </Link>
          <Link 
            href="/staff-homepage" 
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Back to Staff Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}