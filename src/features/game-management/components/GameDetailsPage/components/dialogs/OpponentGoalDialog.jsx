import React, { useState, useEffect } from "react";
import { Target, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/primitives/dialog";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";

export default function OpponentGoalDialog({
  isOpen,
  onClose,
  onSave,
  matchDuration = 90,
  isReadOnly = false
}) {
  const [minute, setMinute] = useState(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setMinute(null);
      setError("");
    }
  }, [isOpen]);

  const validateForm = () => {
    if (!minute || minute < 1) {
      setError("Minute is required");
      return false;
    }

    if (minute > matchDuration) {
      setError(`Minute cannot exceed match duration (${matchDuration} minutes)`);
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave({ minute: parseInt(minute) });
      onClose();
    } catch (error) {
      console.error('Error saving opponent goal:', error);
      setError(error.message || 'Failed to save opponent goal');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-red-400">
            <Target className="w-6 h-6" />
            Record Opponent Goal
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Enter the minute when the opponent scored
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Minute */}
          <div className="space-y-2">
            <Label htmlFor="minute" className="text-slate-300">
              Minute (When Opponent Scored) *
            </Label>
            <Input
              id="minute"
              type="number"
              min="1"
              max={matchDuration}
              value={minute || ''}
              onChange={(e) => {
                setMinute(parseInt(e.target.value) || null);
                setError(""); // Clear error when user types
              }}
              disabled={isReadOnly}
              className="bg-slate-800 border-slate-700 text-white"
              placeholder={`1-${matchDuration}`}
              autoFocus
            />
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg">
            <p className="text-sm text-slate-400">
              <span className="text-cyan-400 font-semibold">Note:</span> This will automatically update the opponent score.
              Only enter the minute when the goal was conceded.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-700 text-slate-300"
          >
            Cancel
          </Button>
          {!isReadOnly && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-red-500 to-orange-500"
            >
              {isSaving ? 'Saving...' : 'Record Goal'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

