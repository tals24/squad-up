import React, { useState, useEffect } from 'react';
import { ArrowRightLeft } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/primitives/dialog';
import { Button } from '@/shared/ui/primitives/button';
import { Input } from '@/shared/ui/primitives/input';
import { Label } from '@/shared/ui/primitives/label';
import { Textarea } from '@/shared/ui/primitives/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/primitives/select';

const SUBSTITUTION_REASONS = [
  { value: 'tactical', label: 'Tactical' },
  { value: 'tired', label: 'Tired' },
  { value: 'injury', label: 'Injury' },
  { value: 'yellow-card-risk', label: 'Yellow Card Risk' },
  { value: 'poor-performance', label: 'Poor Performance' },
  { value: 'other', label: 'Other' }
];

export default function SubstitutionDialog({
  isOpen,
  onClose,
  onSave,
  substitution = null,
  playersOnPitch = [],
  benchPlayers = [],
  matchDuration = 90,
  isReadOnly = false,
}) {
  const [subData, setSubData] = useState({
    playerOutId: null,
    playerInId: null,
    minute: null,
    reason: 'tactical',
    tacticalNote: ''
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (substitution) {
        setSubData({
          playerOutId: substitution.playerOutId?._id || substitution.playerOutId,
          playerInId: substitution.playerInId?._id || substitution.playerInId,
          minute: substitution.minute,
          reason: substitution.reason || 'tactical',
          tacticalNote: substitution.tacticalNote || ''
        });
      } else {
        setSubData({
          playerOutId: null,
          playerInId: null,
          minute: null,
          reason: 'tactical',
          tacticalNote: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, substitution]);

  const validateForm = () => {
    const newErrors = {};
    if (!subData.playerOutId) newErrors.playerOutId = 'Player out is required';
    if (!subData.playerInId) newErrors.playerInId = 'Player in is required';
    if (subData.playerOutId === subData.playerInId) newErrors.playerInId = 'Cannot substitute player with themselves';
    if (!subData.minute || subData.minute < 1) newErrors.minute = 'Minute is required';
    else if (subData.minute > matchDuration) newErrors.minute = `Minute cannot exceed ${matchDuration}`;
    if (!subData.reason) newErrors.reason = 'Reason is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await onSave({
        _id: substitution?._id,
        ...subData
      });
      onClose();
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to save substitution' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-orange-400">
            <ArrowRightLeft className="w-6 h-6" />
            {isReadOnly ? 'View Substitution' : substitution ? 'Edit Substitution' : 'Add Substitution'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {isReadOnly ? 'View substitution details' : substitution ? 'Update substitution' : 'Record a player substitution'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Player Out *</Label>
              <Select
                value={subData.playerOutId || ''}
                onValueChange={(value) => setSubData(prev => ({ ...prev, playerOutId: value }))}
                disabled={isReadOnly}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select player coming off..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {playersOnPitch.map(player => (
                    <SelectItem key={player._id} value={player._id} className="text-white">
                      #{player.kitNumber || '?'} {player.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.playerOutId && <p className="text-red-400 text-sm">{errors.playerOutId}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Player In *</Label>
              <Select
                value={subData.playerInId || ''}
                onValueChange={(value) => setSubData(prev => ({ ...prev, playerInId: value }))}
                disabled={isReadOnly}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select player coming on..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {benchPlayers.map(player => (
                    <SelectItem key={player._id} value={player._id} className="text-white">
                      #{player.kitNumber || '?'} {player.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.playerInId && <p className="text-red-400 text-sm">{errors.playerInId}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Minute *</Label>
              <Input
                type="number"
                min={1}
                max={matchDuration}
                value={subData.minute || ''}
                onChange={(e) => setSubData(prev => ({ ...prev, minute: parseInt(e.target.value) || null }))}
                disabled={isReadOnly}
                className="bg-slate-800 border-slate-700 text-white"
              />
              {errors.minute && <p className="text-red-400 text-sm">{errors.minute}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Reason *</Label>
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
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Tactical Note (Optional)</Label>
            <Textarea
              value={subData.tacticalNote}
              onChange={(e) => setSubData(prev => ({ ...prev, tacticalNote: e.target.value }))}
              disabled={isReadOnly}
              className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
              placeholder="Additional context about this substitution..."
            />
          </div>
        </div>

        {errors.submit && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{errors.submit}</p>
          </div>
        )}

        <DialogFooter className="mt-6">
          {isReadOnly ? (
            <Button onClick={onClose}>Close</Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : substitution ? 'Update' : 'Add Substitution'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

