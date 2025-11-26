import React from "react";
import { Button } from "@/shared/ui/primitives/button";
import { cn } from "@/shared/lib/utils";

/**
 * StatRatingControl Component
 * 
 * A segmented control composed of 5 buttons labeled [1] [2] [3] [4] [5].
 * Used for rating stats on a 1-5 scale (0 = unselected).
 * 
 * @param {number} value - Current rating value (0-5, where 0 is unselected)
 * @param {Function} onChange - Callback when rating changes: (newValue: number) => void
 * @param {boolean} disabled - Whether the control is disabled
 */
export const StatRatingControl = ({ 
  value = 0, 
  onChange, 
  disabled = false 
}) => {
  const handleClick = (rating) => {
    if (disabled) return;
    // Toggle: if clicking the same rating, set to 0 (unselected)
    const newValue = value === rating ? 0 : rating;
    onChange?.(newValue);
  };

  return (
    <div className="flex gap-1 w-full">
      {[1, 2, 3, 4, 5].map((rating) => (
        <Button
          key={rating}
          type="button"
          variant="outline"
          onClick={() => handleClick(rating)}
          disabled={disabled}
          className={cn(
            "flex-1 h-9 px-2 text-sm font-medium transition-all",
            "border-slate-700 bg-slate-800 text-slate-300",
            "hover:bg-slate-700 hover:text-white",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            value === rating && "bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-500 hover:from-cyan-500 hover:to-blue-500"
          )}
        >
          {rating}
        </Button>
      ))}
    </div>
  );
};

