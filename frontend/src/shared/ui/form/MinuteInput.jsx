import React from 'react';
import { Input } from '@/shared/ui/primitives/input';
import FormField from './FormField';

/**
 * MinuteInput - Standardized match minute input field
 * Used across Card, Goal, and Substitution dialogs
 *
 * @param {number} value - Current minute value
 * @param {function} onChange - Change handler (receives parsed integer)
 * @param {number} matchDuration - Maximum allowed minute (default: 90)
 * @param {boolean} disabled - Whether input is disabled
 * @param {string} error - Error message to display
 * @param {string} label - Custom label (default: "Minute")
 * @param {boolean} required - Whether field is required (default: true)
 * @param {string} id - Input ID (default: "minute")
 * @param {string} hint - Custom hint text
 */
export default function MinuteInput({
  value,
  onChange,
  matchDuration = 90,
  disabled = false,
  error,
  label = 'Minute',
  required = true,
  id = 'minute',
  hint,
}) {
  const handleChange = (e) => {
    const parsed = parseInt(e.target.value);
    onChange(isNaN(parsed) ? null : parsed);
  };

  const defaultHint = `Enter minute between 1 and ${matchDuration}`;

  return (
    <FormField
      label={label}
      htmlFor={id}
      required={required}
      error={error}
      hint={hint || defaultHint}
    >
      <Input
        id={id}
        type="number"
        min="1"
        max={matchDuration}
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        className="bg-slate-800 border-slate-700 text-white"
        placeholder={`1-${matchDuration}`}
      />
    </FormField>
  );
}
