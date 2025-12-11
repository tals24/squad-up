import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';

import { BaseDialog } from './BaseDialog';
import { Button } from '@/shared/ui/primitives/button';

/**
 * FormDialog - Specialized dialog for forms
 * 
 * Features:
 * - Form wrapper with React Hook Form integration
 * - Submit/Cancel buttons
 * - Error handling
 * - Dirty state tracking (warn on close if form has changes)
 * - Auto-reset on successful submission
 * 
 * @param {boolean} open - Controls dialog visibility
 * @param {function} onOpenChange - Callback when dialog open state changes
 * @param {string} title - Dialog title
 * @param {string} description - Optional dialog description
 * @param {React.ReactNode} children - Form fields (will be wrapped in FormProvider)
 * @param {function} onSubmit - Async function to handle form submission
 * @param {object} defaultValues - Default form values
 * @param {object} resolver - Zod resolver or other validation resolver
 * @param {string} submitText - Submit button text (default: "Save")
 * @param {string} cancelText - Cancel button text (default: "Cancel")
 * @param {boolean} warnOnClose - Warn user if closing with unsaved changes (default: true)
 * @param {string} size - Dialog size (default: 'md')
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  defaultValues = {},
  resolver,
  submitText = 'Save',
  cancelText = 'Cancel',
  warnOnClose = true,
  size = 'md',
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const methods = useForm({
    defaultValues,
    resolver,
  });

  const {
    handleSubmit,
    formState: { isDirty, errors },
    reset,
  } = methods;

  // Reset form when dialog opens with new defaultValues
  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, defaultValues, reset]);

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      reset(); // Reset form on successful submission
      onOpenChange(false);
    } catch (error) {
      console.error('Form submission error:', error);
      // Don't close dialog on error - let user see error and retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (warnOnClose && isDirty) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        return;
      }
    }
    reset();
    onOpenChange(false);
  };

  const handleOpenChangeWrapper = (newOpen) => {
    if (!newOpen && warnOnClose && isDirty) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        return;
      }
    }
    if (!newOpen) {
      reset();
    }
    onOpenChange(newOpen);
  };

  const footer = (
    <div className="flex gap-2 justify-end w-full">
      <Button
        type="button"
        variant="outline"
        onClick={handleCancel}
        disabled={isSubmitting}
      >
        {cancelText}
      </Button>
      <Button
        type="submit"
        form="form-dialog-form"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : submitText}
      </Button>
    </div>
  );

  return (
    <BaseDialog
      open={open}
      onOpenChange={handleOpenChangeWrapper}
      title={title}
      description={description}
      footer={footer}
      isLoading={isSubmitting}
      size={size}
      closeOnBackdropClick={!isDirty} // Don't allow backdrop close if form has changes
    >
      <FormProvider {...methods}>
        <form id="form-dialog-form" onSubmit={handleSubmit(handleFormSubmit)}>
          {children}
          
          {/* Show form-level errors */}
          {Object.keys(errors).length > 0 && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400 font-medium">
                Please fix the errors above before submitting.
              </p>
            </div>
          )}
        </form>
      </FormProvider>
    </BaseDialog>
  );
}

