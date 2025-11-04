import React, { useState, useEffect } from "react";
import { ArrowRightLeft, X, ArrowDown, ArrowUp } from "lucide-react";
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
import { Textarea } from "@/shared/ui/primitives/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/primitives/select";

const SUBSTITUTION_REASONS = [
  { value: 'tactical', label: 'Tactical' },
  { value: 'tired', label: 'Tired' },
  { value: 'injury', label: 'Injury' },
  { value: 'yellow-card-risk', label: 'Yellow Card Risk' },
  { value: 'poor-performance', label: 'Poor Performance' },
  { value: 'other', label: 'Other' }
];

const COMMON_SUB_MINUTES = [45, 60, 65, 70, 75, 80, 85, 90];

export default function SubstitutionDialog({
  isOpen,
  onClose,
  onSave,
  substitution = null,
  playersOnPitch = [],
  benchPlayers = [],
  matchDuration = 90,
  isReadOnly = false,
  playerReports = {},
}) {
  const [subData, setSubData] = useState({
    playerOutId: null,
    playerInId: null,
    minute: null,
    reason: 'tactical',
    tacticalNote: ''
  });

  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form data when dialog opens or substitution changes
  useEffect(() => {
    if (isOpen) {
      if (substitution) {
        // Editing existing substitution
        setSubData({
          playerOutId: substitution.playerOutId?._id || substitution.playerOutId,
          playerInId: substitution.playerInId?._id || substitution.playerInId,
          minute: substitution.minute,
          reason: substitution.reason || 'tactical',
          tacticalNote: substitution.tacticalNote || ''
        });
      } else {
        // Creating new substitution
        setSubData({
          playerOutId: null,
          playerInId: null,
          minute: null,
          reason: 'tactical',
          tacticalNote: ''
        });
      }
      setErrors({});
      setWarnings({});
    }
  }, [isOpen, substitution]);

  const validateForm = () => {
    const newErrors = {};
    const newWarnings = {};

    if (!subData.playerOutId) {
      newErrors.playerOutId = 'Player leaving field is required';
    }

    if (!subData.playerInId) {
      newErrors.playerInId = 'Player entering field is required';
    }

    if (subData.playerOutId && subData.playerInId && subData.playerOutId === subData.playerInId) {
      newErrors.playerInId = 'Players must be different';
    }

    if (!subData.minute || subData.minute < 1) {
      newErrors.minute = 'Minute is required';
    } else if (subData.minute > matchDuration) {
      newErrors.minute = `Minute cannot exceed match duration (${matchDuration} minutes)`;
    }

    // Validate: Player coming in (bench player) must have minutes > 0
    if (subData.playerInId) {
      const playerInReport = playerReports[subData.playerInId];
      const playerInMinutes = playerInReport?.minutesPlayed || 0;
      
      // Check if player is a bench player (not in starting lineup)
      const isBenchPlayer = benchPlayers.some(p => p._id === subData.playerInId);
      
      if (isBenchPlayer && playerInMinutes <= 0) {
        newWarnings.playerInId = 'This bench player must have minutes played > 0. Please set their minutes in the player report before finalizing the game.';
      }
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(subData);
      onClose();
    } catch (error) {
      console.error('Error saving substitution:', error);
      setErrors({ submit: error.message || 'Failed to save substitution' });
    } finally {
      setIsSaving(false);
    }
  };

  const getPlayerDisplay = (player) => {
    if (!player) return 'Unknown';
    const kitNumber = player.kitNumber || player.jerseyNumber || '?';
    const name = player.fullName || player.name || 'Unknown';
    return `#${kitNumber} ${name}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-cyan-400">
            <ArrowRightLeft className="w-6 h-6" />
            {isReadOnly ? 'View Substitution' : substitution ? 'Edit Substitution' : 'Add Substitution'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {isReadOnly
              ? 'View substitution details'
              : substitution
              ? 'Update substitution information'
              : 'Record a player substitution with context'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Player Out */}
          <div className="space-y-2">
            <Label htmlFor="playerOut" className="text-slate-300 flex items-center gap-2">
              <ArrowDown className="w-4 h-4 text-red-400" />
              Out *
            </Label>
            <Select
              value={subData.playerOutId || ''}
              onValueChange={(value) => setSubData(prev => ({ ...prev, playerOutId: value }))}
              disabled={isReadOnly}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select player leaving..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {playersOnPitch.map(player => (
                  <SelectItem key={player._id} value={player._id} className="text-white">
                    {getPlayerDisplay(player)} {player.position ? `- ${player.position}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.playerOutId && <p className="text-red-400 text-sm">{errors.playerOutId}</p>}
          </div>

          {/* Player In */}
          <div className="space-y-2">
            <Label htmlFor="playerIn" className="text-slate-300 flex items-center gap-2">
              <ArrowUp className="w-4 h-4 text-green-400" />
              In *
            </Label>
            <Select
              value={subData.playerInId || ''}
              onValueChange={(value) => {
                setSubData(prev => ({ ...prev, playerInId: value }));
                // Trigger validation after state update
                setTimeout(() => {
                  validateForm();
                }, 0);
              }}
              disabled={isReadOnly}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select player entering..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {benchPlayers.map(player => (
                  <SelectItem key={player._id} value={player._id} className="text-white">
                    {getPlayerDisplay(player)} {player.position ? `- ${player.position}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.playerInId && <p className="text-red-400 text-sm">{errors.playerInId}</p>}
            {warnings.playerInId && (
              <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 text-sm">{warnings.playerInId}</p>
              </div>
            )}
          </div>

          {/* Minute */}
          <div className="space-y-2">
            <Label htmlFor="minute" className="text-slate-300">Minute *</Label>
            <div className="flex gap-2">
              <Input
                id="minute"
                type="number"
                min="1"
                max={matchDuration}
                value={subData.minute || ''}
                onChange={(e) => setSubData(prev => ({ ...prev, minute: parseInt(e.target.value) }))}
                disabled={isReadOnly}
                className="bg-slate-800 border-slate-700 text-white flex-1"
                placeholder={`1-${matchDuration}`}
              />
              {!isReadOnly && (
                <div className="flex gap-1">
                  {COMMON_SUB_MINUTES.filter(m => m <= matchDuration).slice(0, 4).map(minute => (
                    <Button
                      key={minute}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSubData(prev => ({ ...prev, minute }))}
                      className="border-slate-700 text-slate-300 hover:bg-slate-700"
                    >
                      {minute}'
                    </Button>
                  ))}
                </div>
              )}
            </div>
            {errors.minute && <p className="text-red-400 text-sm">{errors.minute}</p>}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-slate-300">Reason</Label>
            <Select
              value={subData.reason}
              onValueChange={(value) => setSubData(prev => ({ ...prev, reason: value }))}
              disabled={isReadOnly}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {SUBSTITUTION_REASONS.map(reason => (
                  <SelectItem key={reason.value} value={reason.value} className="text-white">
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tactical Note */}
          <div className="space-y-2">
            <Label htmlFor="tacticalNote" className="text-slate-300">Tactical Note (Optional)</Label>
            <Textarea
              id="tacticalNote"
              value={subData.tacticalNote}
              onChange={(e) => setSubData(prev => ({ ...prev, tacticalNote: e.target.value }))}
              disabled={isReadOnly}
              className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
              placeholder="Brief explanation of the substitution reasoning..."
              maxLength={500}
            />
            <p className="text-xs text-slate-500">{subData.tacticalNote.length}/500 characters</p>
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-700 text-slate-300"
          >
            {isReadOnly ? 'Close' : 'Cancel'}
          </Button>
          {!isReadOnly && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-cyan-500 to-blue-500"
            >
              {isSaving ? 'Saving...' : 'Save Substitution'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

