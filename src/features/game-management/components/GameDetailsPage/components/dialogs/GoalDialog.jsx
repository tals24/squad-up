import React, { useState, useEffect } from "react";
import { Target, X, Plus, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/primitives/select";

const GOAL_TYPES = [
  { value: 'open-play', label: 'Open Play' },
  { value: 'set-piece', label: 'Set Piece' },
  { value: 'penalty', label: 'Penalty' },
  { value: 'counter-attack', label: 'Counter Attack' },
  { value: 'own-goal', label: 'Own Goal' }
];

const MATCH_STATES = [
  { value: 'winning', label: 'Winning' },
  { value: 'drawing', label: 'Drawing' },
  { value: 'losing', label: 'Losing' }
];

const CONTRIBUTION_TYPES = [
  { value: 'pre-assist', label: 'Pre-Assist' },
  { value: 'space-creation', label: 'Space Creation' },
  { value: 'defensive-action', label: 'Defensive Action' },
  { value: 'set-piece-delivery', label: 'Set Piece Delivery' },
  { value: 'pressing-action', label: 'Pressing Action' },
  { value: 'other', label: 'Other' }
];

export default function GoalDialog({
  isOpen,
  onClose,
  onSave,
  goal = null,
  gamePlayers = [],
  existingGoals = [],
  matchDuration = 90,
  isReadOnly = false
}) {
  const [goalData, setGoalData] = useState({
    minute: null,
    scorerId: null,
    assistedById: null,
    goalInvolvement: [],
    goalType: 'open-play'
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form data when dialog opens or goal changes
  useEffect(() => {
    if (isOpen) {
      if (goal) {
        // Editing existing goal
        setGoalData({
          minute: goal.minute,
          scorerId: goal.scorerId?._id || goal.scorerId,
          assistedById: goal.assistedById?._id || goal.assistedById || null,
          goalInvolvement: goal.goalInvolvement || [],
          goalType: goal.goalType || 'open-play'
        });
      } else {
        // Creating new goal
        setGoalData({
          minute: null,
          scorerId: null,
          assistedById: null,
          goalInvolvement: [],
          goalType: 'open-play'
        });
      }
      setErrors({});
    }
  }, [isOpen, goal]);

  const validateForm = () => {
    const newErrors = {};

    if (!goalData.minute || goalData.minute < 1) {
      newErrors.minute = 'Minute is required';
    } else if (goalData.minute > matchDuration) {
      newErrors.minute = `Minute cannot exceed match duration (${matchDuration} minutes)`;
    }

    if (!goalData.scorerId) {
      newErrors.scorerId = 'Scorer is required';
    }

    if (goalData.scorerId && goalData.assistedById && goalData.scorerId === goalData.assistedById) {
      newErrors.assistedById = 'Assister cannot be the same as scorer';
    }

    // Validate goal involvement
    if (goalData.goalInvolvement.length > 0) {
      goalData.goalInvolvement.forEach((involvement, index) => {
        if (involvement.playerId === goalData.scorerId) {
          newErrors[`involvement-${index}`] = 'Cannot include the scorer';
        }
        if (involvement.playerId === goalData.assistedById) {
          newErrors[`involvement-${index}`] = 'Cannot include the assister';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(goalData);
      onClose();
    } catch (error) {
      console.error('Error saving goal:', error);
      setErrors({ submit: error.message || 'Failed to save goal' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddInvolvement = () => {
    setGoalData(prev => ({
      ...prev,
      goalInvolvement: [
        ...prev.goalInvolvement,
        { playerId: null, contributionType: 'pre-assist' }
      ]
    }));
  };

  const handleRemoveInvolvement = (index) => {
    setGoalData(prev => ({
      ...prev,
      goalInvolvement: prev.goalInvolvement.filter((_, i) => i !== index)
    }));
  };

  const handleInvolvementChange = (index, field, value) => {
    setGoalData(prev => ({
      ...prev,
      goalInvolvement: prev.goalInvolvement.map((involvement, i) =>
        i === index ? { ...involvement, [field]: value } : involvement
      )
    }));
  };

  // Filter out scorer and assister from available players for involvement
  const getAvailablePlayersForInvolvement = () => {
    return gamePlayers.filter(
      p => p._id !== goalData.scorerId && p._id !== goalData.assistedById
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-cyan-400">
            <Target className="w-6 h-6" />
            {isReadOnly ? 'View Goal' : goal ? 'Edit Goal' : 'Add Goal'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {isReadOnly
              ? 'View goal details'
              : goal
              ? 'Update goal information and relationships'
              : 'Record a new goal with scorer, assister, and other details'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Minute */}
          <div className="space-y-2">
            <Label htmlFor="minute" className="text-slate-300">Minute *</Label>
            <Input
              id="minute"
              type="number"
              min="1"
              max={matchDuration}
              value={goalData.minute || ''}
              onChange={(e) => setGoalData(prev => ({ ...prev, minute: parseInt(e.target.value) }))}
              disabled={isReadOnly}
              className="bg-slate-800 border-slate-700 text-white"
              placeholder={`1-${matchDuration}`}
            />
            {errors.minute && <p className="text-red-400 text-sm">{errors.minute}</p>}
          </div>

          {/* Scorer */}
          <div className="space-y-2">
            <Label htmlFor="scorer" className="text-slate-300">Scorer *</Label>
            <Select
              value={goalData.scorerId || ''}
              onValueChange={(value) => setGoalData(prev => ({ ...prev, scorerId: value }))}
              disabled={isReadOnly}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select scorer..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {gamePlayers.map(player => (
                  <SelectItem key={player._id} value={player._id} className="text-white">
                    #{player.kitNumber || '?'} {player.fullName || player.name || 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.scorerId && <p className="text-red-400 text-sm">{errors.scorerId}</p>}
          </div>

          {/* Assister */}
          <div className="space-y-2">
            <Label htmlFor="assister" className="text-slate-300">Assisted By (Optional)</Label>
            <Select
              value={goalData.assistedById || 'none'}
              onValueChange={(value) => setGoalData(prev => ({ ...prev, assistedById: value === 'none' ? null : value }))}
              disabled={isReadOnly}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select assister or unassisted..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="none" className="text-slate-400">Unassisted</SelectItem>
                {gamePlayers
                  .filter(p => p._id !== goalData.scorerId)
                  .map(player => (
                    <SelectItem key={player._id} value={player._id} className="text-white">
                      #{player.kitNumber || '?'} {player.fullName || player.name || 'Unknown'}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.assistedById && <p className="text-red-400 text-sm">{errors.assistedById}</p>}
          </div>

          {/* Goal Involvement */}
          {!isReadOnly && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">Other Contributors (Optional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddInvolvement}
                  className="border-slate-700 text-cyan-400"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              
              {goalData.goalInvolvement.map((involvement, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Select
                      value={involvement.playerId || ''}
                      onValueChange={(value) => handleInvolvementChange(index, 'playerId', value)}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Select player..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {getAvailablePlayersForInvolvement().map(player => (
                          <SelectItem key={player._id} value={player._id} className="text-white">
                            #{player.kitNumber || '?'} {player.fullName || player.name || 'Unknown'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={involvement.contributionType}
                      onValueChange={(value) => handleInvolvementChange(index, 'contributionType', value)}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {CONTRIBUTION_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value} className="text-white">
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveInvolvement(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {goalData.goalInvolvement.length === 0 && (
                <p className="text-sm text-slate-500">No contributors added</p>
              )}
            </div>
          )}

          {/* Goal Type */}
          <div className="space-y-2">
            <Label htmlFor="goalType" className="text-slate-300">Goal Type</Label>
            <Select
              value={goalData.goalType}
              onValueChange={(value) => setGoalData(prev => ({ ...prev, goalType: value }))}
              disabled={isReadOnly}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {GOAL_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value} className="text-white">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {isSaving ? 'Saving...' : 'Save Goal'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

