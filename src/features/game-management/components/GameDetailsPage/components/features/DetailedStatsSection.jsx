import React from "react";
import { Label } from "@/shared/ui/primitives/label";
import { StatRatingControl } from "@/components/ui/StatRatingControl";

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
export const DetailedStatsSection = ({ 
  stats = {},
  onStatsChange,
  isReadOnly = false 
}) => {
  // Helper to update nested stats
  const updateStat = (category, field, value) => {
    const updatedStats = {
      ...stats,
      [category]: {
        ...(stats[category] || {}),
        [field]: value
      }
    };
    onStatsChange?.(updatedStats);
  };

  return (
    <div className="space-y-6">
      {/* Fouls Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">Fouls</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label className="text-xs text-slate-400 mb-2 block">Fouls Committed</Label>
            <StatRatingControl
              value={stats.fouls?.committedRating || 0}
              onChange={(value) => updateStat('fouls', 'committedRating', value)}
              disabled={isReadOnly}
            />
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-2 block">Fouls Received</Label>
            <StatRatingControl
              value={stats.fouls?.receivedRating || 0}
              onChange={(value) => updateStat('fouls', 'receivedRating', value)}
              disabled={isReadOnly}
            />
          </div>
        </div>
      </div>

      {/* Shooting Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">Shooting</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label className="text-xs text-slate-400 mb-2 block">Shooting Volume</Label>
            <StatRatingControl
              value={stats.shooting?.volumeRating || 0}
              onChange={(value) => updateStat('shooting', 'volumeRating', value)}
              disabled={isReadOnly}
            />
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-2 block">Shooting Accuracy</Label>
            <StatRatingControl
              value={stats.shooting?.accuracyRating || 0}
              onChange={(value) => updateStat('shooting', 'accuracyRating', value)}
              disabled={isReadOnly}
            />
          </div>
        </div>
      </div>

      {/* Passing Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">Passing</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label className="text-xs text-slate-400 mb-2 block">Passing Volume</Label>
            <StatRatingControl
              value={stats.passing?.volumeRating || 0}
              onChange={(value) => updateStat('passing', 'volumeRating', value)}
              disabled={isReadOnly}
            />
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-2 block">Passing Accuracy</Label>
            <StatRatingControl
              value={stats.passing?.accuracyRating || 0}
              onChange={(value) => updateStat('passing', 'accuracyRating', value)}
              disabled={isReadOnly}
            />
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-2 block">Key Passes</Label>
            <StatRatingControl
              value={stats.passing?.keyPassesRating || 0}
              onChange={(value) => updateStat('passing', 'keyPassesRating', value)}
              disabled={isReadOnly}
            />
          </div>
        </div>
      </div>

      {/* Duels Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">Duels</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label className="text-xs text-slate-400 mb-2 block">Duel Involvement</Label>
            <StatRatingControl
              value={stats.duels?.involvementRating || 0}
              onChange={(value) => updateStat('duels', 'involvementRating', value)}
              disabled={isReadOnly}
            />
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-2 block">Duel Success</Label>
            <StatRatingControl
              value={stats.duels?.successRating || 0}
              onChange={(value) => updateStat('duels', 'successRating', value)}
              disabled={isReadOnly}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

