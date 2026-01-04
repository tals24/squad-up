import React, { useState, useEffect } from "react";
import { Target } from "lucide-react";
import { BaseDialog } from "@/shared/ui/composed";
import { FormField, MinuteInput, PlayerSelect } from "@/shared/ui/form";
import { Label } from "@/shared/ui/primitives/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/primitives/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/primitives/tabs";
import { FeatureGuard } from "@/app/router/guards/FeatureGuard";
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
  game = null, // Game object to extract teamId for feature flags
  timeline = [], // Unified timeline from parent (Cards, Goals, Substitutions)
  startingLineup = {}, // Map of playerId -> true for starting lineup players
  squadPlayers = {} // Map of playerId -> status ('Starting Lineup' | 'Bench')
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

  // Prepare dialog configuration
  const title = isReadOnly ? 'View Goal' : goal ? 'Edit Goal' : 'Add Goal';
  const description = isReadOnly
    ? 'View goal details'
    : goal
    ? 'Update goal information and relationships'
    : 'Record goals for your team or track opponent goals';

  // Dynamic save handler based on active tab
  const handleSaveClick = activeTab === 'team' ? handleSave : handleSaveOpponentGoal;
  const saveButtonLabel = activeTab === 'team' ? 'Save Goal' : 'Save Opponent Goal';

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={onClose}
      title={title}
      titleIcon={<Target className="text-cyan-400" />}
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
                label: saveButtonLabel,
                onClick: handleSaveClick,
                disabled: isSaving,
                loading: isSaving
              }
            }
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger value="team" disabled={!!goal && (goal.goalCategory === 'OpponentGoal' || goal.isOpponentGoal) || isReadOnly}>Team Goal</TabsTrigger>
            <TabsTrigger value="opponent" disabled={!!goal && goal.goalCategory !== 'OpponentGoal' && !goal.isOpponentGoal || isReadOnly}>Opponent Goal</TabsTrigger>
          </TabsList>

          {/* Team Goal Tab */}
          <TabsContent value="team" className="space-y-4 mt-4">
          {/* Minute */}
          <MinuteInput
            value={goalData.minute}
            onChange={(value) => setGoalData(prev => ({ ...prev, minute: value }))}
            matchDuration={matchDuration}
            disabled={isReadOnly}
            error={errors.minute}
          />

          {/* Scorer - Hidden for Own Goals */}
          {!isOwnGoal && (
            <PlayerSelect
              id="scorer"
              label="Scorer"
              required={true}
              players={gamePlayers}
              value={goalData.scorerId}
              onChange={(value) => setGoalData(prev => ({ ...prev, scorerId: value }))}
              disabled={isReadOnly}
              error={errors.scorerId}
              placeholder="Select scorer..."
            />
          )}

          {/* Assister - Hidden for Own Goals */}
          {!isOwnGoal && (
            <PlayerSelect
              id="assister"
              label="Assisted By (Optional)"
              required={false}
              players={gamePlayers.filter(p => p._id !== goalData.scorerId)}
              value={goalData.assistedById}
              onChange={(value) => setGoalData(prev => ({ ...prev, assistedById: value === 'none' ? null : value }))}
              disabled={isReadOnly}
              error={errors.assistedById}
              placeholder="Select assister or unassisted..."
              allowNone={true}
              noneLabel="Unassisted"
            />
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
          <FormField
            label="Goal Type"
            htmlFor="goalType"
          >
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
          </FormField>
          </TabsContent>

          {/* Opponent Goal Tab */}
          <TabsContent value="opponent" className="space-y-4 mt-4">
            {/* Minute */}
            <MinuteInput
              id="opponentMinute"
              value={opponentGoalData.minute}
              onChange={(value) => setOpponentGoalData(prev => ({ ...prev, minute: value }))}
              matchDuration={matchDuration}
              error={errors.opponentMinute}
            />

            {/* Goal Type */}
            <FormField
              label="Goal Type"
              htmlFor="opponentGoalType"
            >
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
            </FormField>
          </TabsContent>
        </Tabs>
    </BaseDialog>
  );
}

