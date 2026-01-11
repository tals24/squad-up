import React from 'react';
import TacticalBoard from '../components/TacticalBoard';
import AutoFillReportsButton from '../components/AutoFillReportsButton';

/**
 * TacticalBoardModule
 *
 * Pure wrapper for the tactical board + auto-fill button section.
 * Composes TacticalBoard with AutoFillReportsButton overlay.
 * No logic - just composition and prop forwarding.
 *
 * @param {Object} tacticalBoardProps - Props for TacticalBoard
 * @param {Object} autoFillProps - Props for AutoFillReportsButton
 * @param {boolean} autoFillProps.showAutoFill - Whether to show the auto-fill button
 * @param {number} autoFillProps.remainingCount - Count of remaining reports
 * @param {Function} autoFillProps.onAutoFill - Auto-fill handler
 * @param {boolean} autoFillProps.disabled - Whether button is disabled
 */
export default function TacticalBoardModule({ tacticalBoardProps, autoFillProps }) {
  return (
    <div className="flex-1 bg-slate-900/95 backdrop-blur-sm relative">
      <TacticalBoard {...tacticalBoardProps} />

      {/* Auto-Fill Reports Button - Only show for Played games */}
      {autoFillProps.showAutoFill && (
        <AutoFillReportsButton
          remainingCount={autoFillProps.remainingCount}
          onAutoFill={autoFillProps.onAutoFill}
          disabled={autoFillProps.disabled}
        />
      )}
    </div>
  );
}
