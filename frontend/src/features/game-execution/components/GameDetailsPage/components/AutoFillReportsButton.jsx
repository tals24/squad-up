import React from 'react';
import { Button } from '@/shared/ui/primitives/button';
import { Badge } from '@/shared/ui/primitives/badge';
import { Zap } from 'lucide-react';

/**
 * AutoFillReportsButton Component
 *
 * Button that allows coaches to quickly apply default reports to all players
 * who don't yet have a report in the draft.
 *
 * @param {number} remainingCount - Number of players without reports
 * @param {Function} onAutoFill - Handler function to execute auto-fill
 * @param {boolean} disabled - Whether the button should be disabled
 */
export default function AutoFillReportsButton({ remainingCount, onAutoFill, disabled = false }) {
  if (remainingCount === 0) {
    return null; // Hide button if no remaining players
  }

  return (
    <div className="absolute top-4 right-4 z-10">
      <Button
        onClick={onAutoFill}
        disabled={disabled}
        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm h-8 px-3 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Zap className="w-4 h-4" />
        <span>Auto-Fill Reports</span>
        <Badge variant="secondary" className="bg-slate-700 text-white border-slate-600 ml-1">
          {remainingCount}
        </Badge>
      </Button>
    </div>
  );
}
