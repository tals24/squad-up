import React, { useEffect } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/primitives/dialog';

/**
 * BaseDialog - Standard dialog wrapper with consistent layout
 * 
 * Features:
 * - Standard layout (header, body, footer)
 * - Loading state overlay
 * - Auto-focus management
 * - Escape key handling
 * - Backdrop click to close (configurable)
 * 
 * @param {boolean} open - Controls dialog visibility
 * @param {function} onOpenChange - Callback when dialog open state changes
 * @param {string} title - Dialog title
 * @param {string} description - Optional dialog description
 * @param {React.ReactNode} children - Dialog body content
 * @param {React.ReactNode} footer - Optional custom footer content
 * @param {boolean} isLoading - Shows loading overlay
 * @param {boolean} closeOnEscape - Allow ESC key to close (default: true)
 * @param {boolean} closeOnBackdropClick - Allow backdrop click to close (default: true)
 * @param {string} size - Dialog size: 'sm', 'md', 'lg', 'xl' (default: 'md')
 */
export function BaseDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  isLoading = false,
  closeOnEscape = true,
  closeOnBackdropClick = true,
  size = 'md',
  className = '',
}) {
  // Handle ESC key
  useEffect(() => {
    if (!open || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, closeOnEscape, onOpenChange]);

  const handleInteractOutside = (e) => {
    if (!closeOnBackdropClick) {
      e.preventDefault();
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${sizeClasses[size]} ${className}`}
        onInteractOutside={handleInteractOutside}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
            <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Header */}
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}

        {/* Body */}
        <div className="py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <DialogFooter>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

