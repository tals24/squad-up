import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * LoadingState Component
 * Provides consistent loading patterns across all pages
 */
const LoadingState = ({
  message = 'Loading...',
  type = 'page', // page, card, inline
  className = '',
}) => {
  if (type === 'page') {
    return (
      <div className={`min-h-screen bg-slate-900 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Loader2 className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300 font-medium text-lg">{message}</p>
        </div>
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className={`p-8 text-center ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-400" />
        <p className="text-slate-400">{message}</p>
      </div>
    );
  }

  // inline type
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
      <span className="text-slate-400">{message}</span>
    </div>
  );
};

export default LoadingState;
