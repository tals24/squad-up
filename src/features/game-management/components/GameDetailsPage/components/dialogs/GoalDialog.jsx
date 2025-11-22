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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/primitives/tabs";
import { FeatureGuard } from "@/components/FeatureGuard";
import { GoalInvolvementSection } from "../features/GoalInvolvementSection";

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

export default function GoalDialog({
  isOpen,
  onClose,
  onSave,
  onSaveOpponentGoal,
  goal = null,
  gamePlayers = [], // Only players in lineup + bench (filtered in parent)
  existingGoals = [],
  matchDuration = 90,
  isReadOnly = false,
  game = null // Game object to extract teamId for feature flags
}) {
  const [activeTab, setActiveTab] = useState('team');
  const [goalData, setGoalData] = useState({
    minute: null,
    scorerId: null,
    assistedById: null,
    goalInvolvement: [],
    goalType: 'open-play'
  });
  const [opponentGoalData, setOpponentGoalData] = useState({
    minute: null,
    goalType: 'open-play'
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form data when dialog opens or goal changes
  useEffect(() => {
    if (isOpen) {
      // Check if editing an opponent goal
      const isOpponentGoal = goal && (goal.goalCategory === 'OpponentGoal' || goal.isOpponentGoal);
      
      if (isOpponentGoal) {
        setActiveTab('opponent');
        setOpponentGoalData({
          minute: goal.minute,
          goalType: goal.goalType || 'open-play'
        });
      } else {
        setActiveTab('team');
        setOpponentGoalData({
          minute: null,
          goalType: 'open-play'
        });
      }
      
      if (goal && !isOpponentGoal) {
        // Editing existing team goal
        setGoalData({
          minute: goal.minute,
          scorerId: goal.scorerId?._id || goal.scorerId,
          assistedById: goal.assistedById?._id || goal.assistedById || null,
          goalInvolvement: goal.goalInvolvement || [],
          goalType: goal.goalType || 'open-play'
        });
      } else if (!goal) {
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

    // Scorer is NOT required for own goals
    if (!goalData.scorerId && goalData.goalType !== 'own-goal') {
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

  const validateOpponentGoal = () => {
    const newErrors = {};

    if (!opponentGoalData.minute || opponentGoalData.minute < 1) {
      newErrors.opponentMinute = 'Minute is required';
    } else if (opponentGoalData.minute > matchDuration) {
      newErrors.opponentMinute = `Minute cannot exceed match duration (${matchDuration} minutes)`;
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

  const handleSaveOpponentGoal = async () => {
    if (!validateOpponentGoal()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSaveOpponentGoal(opponentGoalData);
      onClose();
    } catch (error) {
      console.error('Error saving opponent goal:', error);
      setErrors({ submit: error.message || 'Failed to save opponent goal' });
    } finally {
      setIsSaving(false);
    }
  };


  // Extract teamId from game object for feature flags
  const getTeamId = () => {
    if (!game) return null;
    const teamObj = game.team || game.Team || game.teamId || game.TeamId;
    return typeof teamObj === "object" ? teamObj._id : teamObj;
  };

  const teamId = getTeamId();
  const excludedPlayerIds = [goalData.scorerId, goalData.assistedById].filter(Boolean);

  const isOwnGoal = goalData.goalType === 'own-goal';

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
              : 'Record goals for your team or track opponent goals'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger value="team" disabled={!!goal && (goal.goalCategory === 'OpponentGoal' || goal.isOpponentGoal) || isReadOnly}>Team Goal</TabsTrigger>
            <TabsTrigger value="opponent" disabled={!!goal && goal.goalCategory !== 'OpponentGoal' && !goal.isOpponentGoal || isReadOnly}>Opponent Goal</TabsTrigger>
          </TabsList>

          {/* Team Goal Tab */}
          <TabsContent value="team" className="space-y-4 mt-4">
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

          {/* Scorer - Hidden for Own Goals */}
          {!isOwnGoal && (
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
          )}

          {/* Assister - Hidden for Own Goals */}
          {!isOwnGoal && (
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
          )}

          {/* Goal Involvement - Feature Flag Protected */}
          {!isOwnGoal && (
            <FeatureGuard 
              feature="goalInvolvementEnabled" 
              teamId={teamId}
            >
              <GoalInvolvementSection 
                involvements={goalData.goalInvolvement}
                onUpdate={(newInvolvements) => setGoalData(prev => ({ ...prev, goalInvolvement: newInvolvements }))}
                players={gamePlayers}
                excludedPlayerIds={excludedPlayerIds}
                isReadOnly={isReadOnly}
              />
            </FeatureGuard>
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
          </TabsContent>

          {/* Opponent Goal Tab */}
          <TabsContent value="opponent" className="space-y-4 mt-4">
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
              <p className="text-red-400 text-sm">
                Recording an opponent goal will automatically increment the opponent's score.
              </p>
            </div>

            {/* Minute */}
            <div className="space-y-2">
              <Label htmlFor="opponentMinute" className="text-slate-300">Minute *</Label>
              <Input
                id="opponentMinute"
                type="number"
                min="1"
                max={matchDuration}
                value={opponentGoalData.minute || ''}
                onChange={(e) => setOpponentGoalData(prev => ({ ...prev, minute: parseInt(e.target.value) }))}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder={`1-${matchDuration}`}
              />
              {errors.opponentMinute && <p className="text-red-400 text-sm">{errors.opponentMinute}</p>}
            </div>

            {/* Goal Type */}
            <div className="space-y-2">
              <Label htmlFor="opponentGoalType" className="text-slate-300">Goal Type</Label>
              <Select
                value={opponentGoalData.goalType}
                onValueChange={(value) => setOpponentGoalData(prev => ({ ...prev, goalType: value }))}
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
          </TabsContent>
        </Tabs>

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
              onClick={activeTab === 'team' ? handleSave : handleSaveOpponentGoal}
              disabled={isSaving}
              className={activeTab === 'team' 
                ? "bg-gradient-to-r from-cyan-500 to-blue-500" 
                : "bg-gradient-to-r from-red-500 to-orange-500"}
            >
              {isSaving ? 'Saving...' : activeTab === 'team' ? 'Save Goal' : 'Save Opponent Goal'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

