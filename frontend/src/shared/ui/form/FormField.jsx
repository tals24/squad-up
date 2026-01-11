import React from 'react';
import { Label } from '@/shared/ui/primitives/label';
import { AlertCircle } from 'lucide-react';

/**
 * FormField - Generic form field wrapper with label and error display
 *
 * @param {string} label - Field label text
 * @param {string} htmlFor - ID of the input element
 * @param {boolean} required - Whether field is required (adds * to label)
 * @param {string} error - Error message to display
 * @param {string} hint - Optional hint/helper text
 * @param {React.ReactNode} children - Input component
 * @param {string} className - Additional wrapper classes
 */
export default function FormField({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  children,
  className = '',
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={htmlFor} className="text-slate-300">
          {label} {required && <span className="text-red-400">*</span>}
        </Label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && (
        <p className="text-red-400 text-sm flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}
