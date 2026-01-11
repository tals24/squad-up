import React from 'react';
import { cn } from '@/shared/lib/utils';
import { RotateCcw } from 'lucide-react';

/**
 * Compact Slider Component for Detailed Stats
 */
const CompactSlider = ({ label, value, onChange, disabled = false }) => {
  const levels = {
    1: 'Poor',
    2: 'Below',
    3: 'Normal',
    4: 'Good',
    5: 'Elite',
  };

  const handleChange = (e) => {
    if (disabled) return;
    const newValue = parseInt(e.target.value, 10);
    onChange?.(newValue);
  };

  // If value is 0 (not set), show at middle position (3)
  const sliderValue = value === 0 ? 3 : value >= 1 && value <= 5 ? value : 3;
  const displayLabel = value === 0 ? 'Not Set' : levels[value] || '—';
  const isUnset = value === 0;

  return (
    <div className="space-y-1">
      {/* Label and Value */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <span
          className={cn(
            'text-xs font-semibold min-w-[45px] text-right',
            isUnset ? 'text-slate-500' : 'text-cyan-400'
          )}
        >
          {displayLabel}
        </span>
      </div>
      {/* Slider */}
      <input
        type="range"
        min="1"
        max="5"
        step="1"
        value={sliderValue}
        onChange={handleChange}
        disabled={disabled}
        className={cn(
          'w-full h-1.5 rounded-full appearance-none cursor-pointer',
          'focus:outline-none focus:ring-1 focus:ring-cyan-500/50',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Webkit thumb styling - color changes based on set/unset
          '[&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:w-3.5',
          '[&::-webkit-slider-thumb]:h-3.5',
          '[&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:cursor-pointer',
          '[&::-webkit-slider-thumb]:transition-all',
          '[&::-webkit-slider-thumb]:hover:scale-110',
          isUnset
            ? '[&::-webkit-slider-thumb]:bg-slate-500'
            : '[&::-webkit-slider-thumb]:bg-cyan-400',
          isUnset
            ? '[&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(100,116,139,0.4)]'
            : '[&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(34,211,238,0.5)]',
          // Firefox thumb styling
          '[&::-moz-range-thumb]:w-3.5',
          '[&::-moz-range-thumb]:h-3.5',
          '[&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:border-0',
          '[&::-moz-range-thumb]:cursor-pointer',
          '[&::-moz-range-thumb]:transition-all',
          '[&::-moz-range-thumb]:hover:scale-110',
          isUnset ? '[&::-moz-range-thumb]:bg-slate-500' : '[&::-moz-range-thumb]:bg-cyan-400',
          isUnset
            ? '[&::-moz-range-thumb]:shadow-[0_0_6px_rgba(100,116,139,0.4)]'
            : '[&::-moz-range-thumb]:shadow-[0_0_6px_rgba(34,211,238,0.5)]',
          // Track styling
          '[&::-webkit-slider-runnable-track]:h-1.5',
          '[&::-webkit-slider-runnable-track]:rounded-full',
          '[&::-moz-range-track]:h-1.5',
          '[&::-moz-range-track]:rounded-full'
        )}
        style={{
          background: isUnset
            ? 'linear-gradient(to right, #475569 0%, #64748b 50%, #475569 100%)'
            : `linear-gradient(to right, 
                #ef4444 0%, 
                #f59e0b 25%, 
                #10b981 50%, 
                #3b82f6 75%, 
                #06b6d4 100%)`,
        }}
      />
    </div>
  );
};

/**
 * DetailedStatsSection Component
 *
 * Displays detailed match statistics using 1-5 ratings for:
 * - Fouls (committed/received)
 * - Shooting (volume/accuracy)
 * - Passing (volume/accuracy/key passes)
 * - Duels (involvement/success)
 *
 * @param {Object} stats - Stats object with nested structure:
 *   {
 *     fouls: { committedRating, receivedRating },
 *     shooting: { volumeRating, accuracyRating },
 *     passing: { volumeRating, accuracyRating, keyPassesRating },
 *     duels: { involvementRating, successRating }
 *   }
 * @param {Function} onStatsChange - Callback when any stat changes: (updatedStats) => void
 * @param {boolean} isReadOnly - Whether the section is read-only
 */
export const DetailedStatsSection = ({ stats = {}, onStatsChange, isReadOnly = false }) => {
  // Helper to update nested stats
  const updateStat = (category, field, value) => {
    const updatedStats = {
      ...stats,
      [category]: {
        ...(stats[category] || {}),
        [field]: value,
      },
    };
    onStatsChange?.(updatedStats);
  };

  // Helper to reset entire category
  const resetCategory = (category, fields) => {
    if (isReadOnly) return;

    const clearedFields = {};
    fields.forEach((field) => {
      clearedFields[field] = 0;
    });

    const updatedStats = {
      ...stats,
      [category]: clearedFields,
    };
    onStatsChange?.(updatedStats);
  };

  // Check if category has any set values
  const hasCategoryValues = (category, fields) => {
    if (!stats[category]) return false;
    return fields.some((field) => stats[category][field] > 0);
  };

  return (
    <div className="space-y-6">
      {/* Fouls Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">Fouls</h3>
          {hasCategoryValues('fouls', ['committedRating', 'receivedRating']) && !isReadOnly && (
            <button
              onClick={() => resetCategory('fouls', ['committedRating', 'receivedRating'])}
              className="p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
              title="Reset all fouls ratings"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="space-y-3">
          <CompactSlider
            label="Fouls Committed"
            value={stats.fouls?.committedRating || 0}
            onChange={(value) => updateStat('fouls', 'committedRating', value)}
            disabled={isReadOnly}
          />
          <CompactSlider
            label="Fouls Received"
            value={stats.fouls?.receivedRating || 0}
            onChange={(value) => updateStat('fouls', 'receivedRating', value)}
            disabled={isReadOnly}
          />
        </div>
      </div>

      {/* Shooting Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">Shooting</h3>
          {hasCategoryValues('shooting', ['volumeRating', 'accuracyRating']) && !isReadOnly && (
            <button
              onClick={() => resetCategory('shooting', ['volumeRating', 'accuracyRating'])}
              className="p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
              title="Reset all shooting ratings"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="space-y-3">
          <CompactSlider
            label="Shooting Volume"
            value={stats.shooting?.volumeRating || 0}
            onChange={(value) => updateStat('shooting', 'volumeRating', value)}
            disabled={isReadOnly}
          />
          <CompactSlider
            label="Shooting Accuracy"
            value={stats.shooting?.accuracyRating || 0}
            onChange={(value) => updateStat('shooting', 'accuracyRating', value)}
            disabled={isReadOnly}
          />
        </div>
      </div>

      {/* Passing Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">Passing</h3>
          {hasCategoryValues('passing', ['volumeRating', 'accuracyRating', 'keyPassesRating']) &&
            !isReadOnly && (
              <button
                onClick={() =>
                  resetCategory('passing', ['volumeRating', 'accuracyRating', 'keyPassesRating'])
                }
                className="p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
                title="Reset all passing ratings"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
        </div>
        <div className="space-y-3">
          <CompactSlider
            label="Passing Volume"
            value={stats.passing?.volumeRating || 0}
            onChange={(value) => updateStat('passing', 'volumeRating', value)}
            disabled={isReadOnly}
          />
          <CompactSlider
            label="Passing Accuracy"
            value={stats.passing?.accuracyRating || 0}
            onChange={(value) => updateStat('passing', 'accuracyRating', value)}
            disabled={isReadOnly}
          />
          <CompactSlider
            label="Key Passes"
            value={stats.passing?.keyPassesRating || 0}
            onChange={(value) => updateStat('passing', 'keyPassesRating', value)}
            disabled={isReadOnly}
          />
        </div>
      </div>

      {/* Duels Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">Duels</h3>
          {hasCategoryValues('duels', ['involvementRating', 'successRating']) && !isReadOnly && (
            <button
              onClick={() => resetCategory('duels', ['involvementRating', 'successRating'])}
              className="p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
              title="Reset all duel ratings"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="space-y-3">
          <CompactSlider
            label="Duel Involvement"
            value={stats.duels?.involvementRating || 0}
            onChange={(value) => updateStat('duels', 'involvementRating', value)}
            disabled={isReadOnly}
          />
          <CompactSlider
            label="Duel Success"
            value={stats.duels?.successRating || 0}
            onChange={(value) => updateStat('duels', 'successRating', value)}
            disabled={isReadOnly}
          />
        </div>
      </div>
    </div>
  );
};
