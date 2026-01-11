import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/primitives/dialog';
import { Button } from '@/shared/ui/primitives/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib';

/**
 * BaseDialog Component
 *
 * Reusable base dialog with common patterns for all feature dialogs.
 * Provides consistent styling, loading states, error handling, and footer actions.
 *
 * @example
 * ```jsx
 * <BaseDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Edit Player"
 *   titleIcon={<User />}
 *   description="Update player information"
 *   isLoading={isSaving}
 *   error={errorMessage}
 *   actions={{
 *     cancel: {
 *       label: "Cancel",
 *       onClick: handleCancel
 *     },
 *     confirm: {
 *       label: "Save",
 *       onClick: handleSave,
 *       loading: isSaving,
 *       disabled: !isValid
 *     }
 *   }}
 * >
 *   <div>Form fields go here</div>
 * </BaseDialog>
 * ```
 */
export default function BaseDialog({
  // Dialog State
  open = false,
  onOpenChange,

  // Header
  title,
  titleIcon,
  description,

  // Content
  children,

  // Footer Actions
  actions,

  // States
  isLoading = false,
  isReadOnly = false,
  loadingMessage = 'Processing...',

  // Errors
  error = null, // Global error
  errors = {}, // Field-level errors

  // Styling
  className,
  size = 'lg',

  // Advanced
  hideCloseButton = false,
  preventOutsideClick = false,
}) {
  // Size mapping
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  // Default actions
  const defaultCancelAction = {
    label: 'Cancel',
    onClick: () => onOpenChange?.(false),
    disabled: isLoading,
  };

  const cancelAction = actions?.cancel
    ? { ...defaultCancelAction, ...actions.cancel }
    : defaultCancelAction;

  const confirmAction = actions?.confirm;

  // Check if there are any field-level errors
  const hasFieldErrors = Object.keys(errors).length > 0;

  return (
    <Dialog open={open} onOpenChange={preventOutsideClick ? undefined : onOpenChange}>
      <DialogContent
        className={cn(
          sizeClasses[size],
          'max-h-[90vh] overflow-y-auto',
          'bg-slate-900 border-slate-700 text-white',
          className
        )}
        onInteractOutside={preventOutsideClick ? (e) => e.preventDefault() : undefined}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-900/80 z-50 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
              <p className="text-slate-300">{loadingMessage}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-cyan-400">
            {titleIcon && <span className="w-6 h-6">{titleIcon}</span>}
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-slate-400">{description}</DialogDescription>
          )}
        </DialogHeader>

        {/* Global Error */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 text-sm font-medium">Error</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Field-Level Errors Summary (if multiple) */}
        {hasFieldErrors && Object.keys(errors).length > 1 && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-yellow-400 text-sm font-medium">Validation Errors</p>
                <ul className="text-yellow-300 text-sm list-disc list-inside mt-1">
                  {Object.entries(errors).map(([field, message]) => (
                    <li key={field}>{message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-4">{children}</div>

        {/* Footer */}
        {(actions?.cancel || actions?.confirm || actions?.custom) && (
          <DialogFooter className="flex flex-row gap-2 justify-end">
            {/* Custom Actions (if provided) */}
            {actions?.custom}

            {/* Cancel Button */}
            {actions?.cancel !== false && (
              <Button
                variant="outline"
                onClick={cancelAction.onClick}
                disabled={cancelAction.disabled || isReadOnly}
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              >
                {cancelAction.label}
              </Button>
            )}

            {/* Confirm Button */}
            {confirmAction && (
              <Button
                variant={confirmAction.variant || 'default'}
                onClick={confirmAction.onClick}
                disabled={confirmAction.disabled || confirmAction.loading || isReadOnly}
                className={cn(
                  confirmAction.variant === 'destructive'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-cyan-600 hover:bg-cyan-700'
                )}
              >
                {confirmAction.loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {confirmAction.label}
              </Button>
            )}
          </DialogFooter>
        )}

        {/* Read-Only Indicator */}
        {isReadOnly && (
          <div className="text-center text-slate-400 text-sm py-2 border-t border-slate-700">
            This dialog is in read-only mode
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
