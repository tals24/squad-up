/**
 * Suspense Loader Component
 * Shows while lazy-loaded pages are being fetched
 */

import React from 'react';

export function SuspenseLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        {/* Spinner */}
        <div className="inline-block">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        
        {/* Loading Text */}
        <p className="mt-4 text-gray-600 text-lg font-medium">
          Loading...
        </p>
        
        {/* Optional hint */}
        <p className="mt-2 text-gray-400 text-sm">
          First-time loads may take a moment
        </p>
      </div>
    </div>
  );
}

/**
 * Minimal inline loader for fast loads
 * Use this for components that load quickly
 */
export function MinimalLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );
}

export default SuspenseLoader;

