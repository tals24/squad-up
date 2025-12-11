import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

import { BaseDialog } from './BaseDialog';
import { Button } from '@/shared/ui/primitives/button';

/**
 * ConfirmDialog - Specialized dialog for confirmations
 * 
 * Features:
 * - Yes/No buttons with custom labels
 * - Variant types: info, success, warning, danger, error
 * - Icon support based on variant
 * - Async onConfirm support with loading state
 * 
 * @param {boolean} open - Controls dialog visibility
 * @param {function} onOpenChange - Callback when dialog open state changes
 * @param {string} title - Dialog title
 * @param {string} message - Confirmation message
 * @param {string} confirmText - Confirm button text (default: "Confirm")
 * @param {string} cancelText - Cancel button text (default: "Cancel")
 * @param {function} onConfirm - Async function to call on confirmation
 * @param {function} onCancel - Function to call on cancellation
 * @param {string} variant - Visual variant: 'info', 'success', 'warning', 'danger', 'error' (default: 'info')
 * @param {boolean} isLoading - Shows loading state
 * @param {boolean} showIcon - Shows icon based on variant (default: true)
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'info',
  isLoading = false,
  showIcon = true,
}) {
  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  // Icon based on variant
  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    danger: AlertCircle,
    error: XCircle,
  };

  const Icon = icons[variant] || icons.info;

  // Colors based on variant
  const iconColors = {
    info: 'text-blue-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    danger: 'text-red-400',
    error: 'text-red-400',
  };

  const confirmButtonVariants = {
    info: 'default',
    success: 'default',
    warning: 'default',
    danger: 'destructive',
    error: 'destructive',
  };

  const footer = (
    <div className="flex gap-2 justify-end w-full">
      {cancelText && (
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
        >
          {cancelText}
        </Button>
      )}
      <Button
        variant={confirmButtonVariants[variant]}
        onClick={handleConfirm}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : confirmText}
      </Button>
    </div>
  );

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      footer={footer}
      isLoading={isLoading}
      size="md"
    >
      <div className="flex gap-4">
        {showIcon && (
          <div className="flex-shrink-0">
            <Icon className={`w-6 h-6 ${iconColors[variant]}`} />
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm text-slate-300 whitespace-pre-line">
            {message}
          </p>
        </div>
      </div>
    </BaseDialog>
  );
}

