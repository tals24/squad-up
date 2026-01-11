import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

/**
 * StatSliderControl Component
 *
 * A modern, gaming-style slider control for 1-5 ratings with dynamic qualitative labels.
 * Features a gradient track and glowing thumb for a sleek gaming aesthetic.
 *
 * @param {number} value - Current rating value (1-5, default: 0 for unselected)
 * @param {Function} onChange - Callback when rating changes: (newValue: number) => void
 * @param {string} label - Label text (e.g., "Shooting Accuracy")
 * @param {boolean} disabled - Whether the control is disabled
 * @param {string} className - Additional CSS classes
 */
export const StatSliderControl = ({ value = 0, onChange, label, disabled = false, className }) => {
  const levels = {
    1: 'Poor',
    2: 'Below Avg',
    3: 'Normal',
    4: 'Good',
    5: 'Elite',
  };

  const handleChange = (e) => {
    if (disabled) return;
    const newValue = parseInt(e.target.value, 10);
    onChange?.(newValue);
  };

  const handleClear = () => {
    if (disabled) return;
    onChange?.(0);
  };

  // Ensure value is between 1-5 for slider display (default to 1 if 0 or invalid)
  const sliderValue = value >= 1 && value <= 5 ? value : 1;
  // Show "Not Set" if value is 0, otherwise show the level label
  const displayLabel = value === 0 ? 'Not Set' : levels[sliderValue] || 'Normal';

  return (
    <div
      className={cn(
        'flex justify-between items-center py-3 px-1',
        'bg-slate-800/50 rounded-lg border border-slate-700/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {/* Left Label */}
      <label className="text-xs text-slate-400 font-medium min-w-[120px]">{label}</label>

      {/* Slider Wrapper */}
      <div className="flex items-center gap-3 w-[300px]">
        {/* Slider Input */}
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={sliderValue}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            'flex-1 h-2 rounded-full appearance-none cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-800',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            // Webkit thumb styling
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-5',
            '[&::-webkit-slider-thumb]:h-5',
            '[&::-webkit-slider-thumb]:bg-[#00d5ff]',
            '[&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:shadow-[0_0_10px_#00d5ff]',
            '[&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-webkit-slider-thumb]:transition-all',
            '[&::-webkit-slider-thumb]:hover:shadow-[0_0_15px_#00d5ff]',
            '[&::-webkit-slider-thumb]:hover:scale-110',
            // Firefox thumb styling
            '[&::-moz-range-thumb]:w-5',
            '[&::-moz-range-thumb]:h-5',
            '[&::-moz-range-thumb]:bg-[#00d5ff]',
            '[&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:border-0',
            '[&::-moz-range-thumb]:shadow-[0_0_10px_#00d5ff]',
            '[&::-moz-range-thumb]:cursor-pointer',
            '[&::-moz-range-thumb]:transition-all',
            '[&::-moz-range-thumb]:hover:shadow-[0_0_15px_#00d5ff]',
            '[&::-moz-range-thumb]:hover:scale-110',
            // Track styling
            '[&::-webkit-slider-runnable-track]:h-2',
            '[&::-webkit-slider-runnable-track]:rounded-full',
            '[&::-moz-range-track]:h-2',
            '[&::-moz-range-track]:rounded-full'
          )}
          style={{
            background: `linear-gradient(to right, 
              #ff3a3a 0%, 
              #ffb13a 25%, 
              #00ffa7 50%, 
              #00d5ff 75%, 
              #00d5ff 100%)`,
          }}
        />

        {/* Dynamic Label */}
        <span className="text-[#7dd8ff] min-w-[70px] text-right text-sm font-medium">
          {displayLabel}
        </span>

        {/* Clear Button */}
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled || value === 0}
          className={cn(
            'p-1.5 rounded-md transition-all',
            'text-slate-400 hover:text-slate-200',
            'hover:bg-slate-700/50',
            'focus:outline-none focus:ring-2 focus:ring-slate-500/50',
            'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent',
            value === 0 && 'opacity-30'
          )}
          aria-label="Clear rating"
          title="Clear rating"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
