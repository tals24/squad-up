import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, ArrowDown, ArrowUp } from 'lucide-react';
import { BaseDialog } from '@/shared/ui/composed';
import { FormField, PlayerSelect } from '@/shared/ui/form';
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
  { value: 'other', label: 'Other' },
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
  timeline = [], // Unified timeline from parent (Cards, Goals, Substitutions)
  startingLineup = {}, // Map of playerId -> true for starting lineup players
  squadPlayers = {}, // Map of playerId -> status ('Starting Lineup' | 'Bench')
}) {
  const [subData, setSubData] = useState({
    playerOutId: null,
    playerInId: null,
    minute: null,
    reason: 'tactical',
    tacticalNote: '',
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
          tacticalNote: substitution.tacticalNote || '',
        });
      } else {
        // Creating new substitution
        setSubData({
          playerOutId: null,
          playerInId: null,
          minute: null,
          reason: 'tactical',
          tacticalNote: '',
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

    // Removed: Bench player minutes validation (minutes are now automatically calculated)

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
      // Extract detailed error message from backend
      const errorMessage = error.message || 'Failed to save substitution';
      setErrors({ submit: errorMessage });
      // Log to console for debugging (less verbose)
      console.warn('Substitution validation failed:', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const getPlayerDisplay = (player) => {
    if (!player) return 'Unknown';
    const kitNumber = player.kitNumber || '?';
    const name = player.fullName || player.name || 'Unknown';
    return `#${kitNumber} ${name}`;
  };

  // Prepare dialog configuration
  const title = isReadOnly
    ? 'View Substitution'
    : substitution
      ? 'Edit Substitution'
      : 'Add Substitution';
  const description = isReadOnly
    ? 'View substitution details'
    : substitution
      ? 'Update substitution information'
      : 'Record a player substitution with context';

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={onClose}
      title={title}
      titleIcon={<ArrowRightLeft className="text-cyan-400" />}
      description={description}
      size="lg"
      isLoading={isSaving}
      isReadOnly={isReadOnly}
      error={errors.submit}
      errors={errors}
      actions={
        isReadOnly
          ? { cancel: { label: 'Close', onClick: onClose } }
          : {
              cancel: { label: 'Cancel', onClick: onClose, disabled: isSaving },
              confirm: {
                label: 'Save Substitution',
                onClick: handleSave,
                disabled: isSaving,
                loading: isSaving,
              },
            }
      }
    >
      <div className="space-y-4">
        {/* Player Out */}
        <FormField
          label={
            <span className="flex items-center gap-2">
              <ArrowDown className="w-4 h-4 text-red-400" />
              Out <span className="text-red-400">*</span>
            </span>
          }
          htmlFor="playerOut"
          required={false}
          error={errors.playerOutId}
        >
          <PlayerSelect
            id="playerOut"
            players={playersOnPitch}
            value={subData.playerOutId}
            onChange={(value) => {
              setSubData((prev) => ({ ...prev, playerOutId: value }));
              if (errors.playerOutId) {
                setErrors((prev) => ({ ...prev, playerOutId: undefined }));
              }
            }}
            disabled={isReadOnly}
            placeholder="Select player leaving..."
            showPosition={true}
            formatPlayer={(player) => getPlayerDisplay(player)}
            required={false}
          />
        </FormField>

        {/* Player In */}
        <FormField
          label={
            <span className="flex items-center gap-2">
              <ArrowUp className="w-4 h-4 text-green-400" />
              In <span className="text-red-400">*</span>
            </span>
          }
          htmlFor="playerIn"
          required={false}
          error={errors.playerInId}
        >
          <PlayerSelect
            id="playerIn"
            players={benchPlayers}
            value={subData.playerInId}
            onChange={(value) => {
              setSubData((prev) => ({ ...prev, playerInId: value }));
              if (errors.playerInId) {
                setErrors((prev) => ({ ...prev, playerInId: undefined }));
              }
            }}
            disabled={isReadOnly}
            placeholder="Select player entering..."
            showPosition={true}
            formatPlayer={(player) => getPlayerDisplay(player)}
            required={false}
          />
        </FormField>

        {/* Minute */}
        <FormField label="Minute" htmlFor="minute" required={true} error={errors.minute}>
          <div className="flex gap-2">
            <Input
              id="minute"
              type="number"
              min="1"
              max={matchDuration}
              value={subData.minute || ''}
              onChange={(e) => {
                setSubData((prev) => ({ ...prev, minute: parseInt(e.target.value) }));
                if (errors.minute) {
                  setErrors((prev) => ({ ...prev, minute: undefined }));
                }
              }}
              disabled={isReadOnly}
              className="bg-slate-800 border-slate-700 text-white flex-1"
              placeholder={`1-${matchDuration}`}
            />
            {!isReadOnly && (
              <div className="flex gap-1">
                {COMMON_SUB_MINUTES.filter((m) => m <= matchDuration)
                  .slice(0, 4)
                  .map((minute) => (
                    <Button
                      key={minute}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSubData((prev) => ({ ...prev, minute }))}
                      className="border-slate-700 text-slate-300 hover:bg-slate-700"
                    >
                      {minute}'
                    </Button>
                  ))}
              </div>
            )}
          </div>
        </FormField>

        {/* Reason */}
        <FormField label="Reason" htmlFor="reason">
          <Select
            value={subData.reason}
            onValueChange={(value) => setSubData((prev) => ({ ...prev, reason: value }))}
            disabled={isReadOnly}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {SUBSTITUTION_REASONS.map((reason) => (
                <SelectItem key={reason.value} value={reason.value} className="text-white">
                  {reason.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {/* Tactical Note */}
        <FormField
          label="Tactical Note (Optional)"
          htmlFor="tacticalNote"
          hint={`${subData.tacticalNote.length}/500 characters`}
        >
          <Textarea
            id="tacticalNote"
            value={subData.tacticalNote}
            onChange={(e) => setSubData((prev) => ({ ...prev, tacticalNote: e.target.value }))}
            disabled={isReadOnly}
            className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
            placeholder="Brief explanation of the substitution reasoning..."
            maxLength={500}
          />
        </FormField>
      </div>
    </BaseDialog>
  );
}
