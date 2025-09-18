import React from 'react';
import { Button } from '@/components/ui/button';

/**
 * EmptyState Component
 * Provides consistent empty state patterns across all pages
 */
const EmptyState = ({ 
  icon: Icon,
  title,
  message,
  actionButton,
  className = ""
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      {Icon && (
        <div className="w-16 h-16 bg-gradient-to-r from-slate-700 to-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <Icon className="w-8 h-8 text-slate-300" />
        </div>
      )}
      {title && (
        <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
      )}
      {message && (
        <p className="text-slate-400 mb-6 max-w-md mx-auto">{message}</p>
      )}
      {actionButton}
    </div>
  );
};

export default EmptyState;
