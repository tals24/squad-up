import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * PageLoader Component
 * Reusable full-page loading component for consistent UI across the application
 * 
 * @param {string} message - Optional loading message (default: "Loading...")
 */
const PageLoader = ({ message = "Loading..." }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center">
        <Loader2 className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-cyan-400 font-medium text-lg">{message}</p>
      </div>
    </div>
  );
};

export default PageLoader;



