import React, { useState, useEffect } from 'react';
import { Target } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/primitives/dialog';
import { Button } from '@/shared/ui/primitives/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/primitives/tabs';
import { Input } from '@/shared/ui/primitives/input';
import { Label } from '@/shared/ui/primitives/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/primitives/select';
import { FeatureGuard } from '@/app/router/guards/FeatureGuard';

import { GoalInvolvementSection } from '../features/GoalInvolvementSection';

const GOAL_TYPES = [
  { value: 'open-play', label: 'Open Play' },
  { value: 'set-piece', label: 'Set Piece' },
  { value: 'penalty', label: 'Penalty' },
  { value: 'counter-attack', label: 'Counter Attack' },
  { value: 'own-goal', label: 'Own Goal' }
];

export default function GoalDialog({
  isOpen,
  onClose,
  onSave,
  onSaveOpponentGoal,
  goal = null,
  gamePlayers = [],
  existingGoals = [],
  matchDuration = 90,
  isReadOnly = false,
  game = null,
  timeline = [],
  startingLineup = {},
  squadPlayers = {}
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

  const isOpponentGoal = goal && (goal.goalCategory === 'OpponentGoal' || goal.isOpponentGoal);
  const teamId = game?.team?._id || game?.Team?._id || game?.teamId || game?.TeamId;

  useEffect(() => {
    if (isOpen) {
      if (isOpponentGoal) {
        setActiveTab('opponent');
        setOpponentGoalData({
          minute: goal.minute,
          goalType: goal.goalType || 'open-play'
        });
      } else if (goal) {
        setActiveTab('team');
        setGoalData({
          minute: goal.minute,
          scorerId: goal.scorerId?._id || goal.scorerId,
          assistedById: goal.assistedById?._id || goal.assistedById || null,
          goalInvolvement: goal.goalInvolvement || [],
          goalType: goal.goalType || 'open-play'
        });
      } else {
        setActiveTab('team');
        setGoalData({
          minute: null,
          scorerId: null,
          assistedById: null,
          goalInvolvement: [],
          goalType: 'open-play'
        });
        setOpponentGoalData({
          minute: null,
          goalType: 'open-play'
        });
      }
      setErrors({});
    }
  }, [isOpen, goal, isOpponentGoal]);

  const validateTeamGoal = () => {
    const newErrors = {};
    if (!goalData.minute || goalData.minute < 1) newErrors.minute = 'Minute is required';
    else if (goalData.minute > matchDuration) newErrors.minute = `Minute cannot exceed ${matchDuration}`;
    if (!goalData.scorerId) newErrors.scorerId = 'Scorer is required';
    if (!goalData.goalType) newErrors.goalType = 'Goal type is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOpponentGoal = () => {
    const newErrors = {};
    if (!opponentGoalData.minute || opponentGoalData.minute < 1) newErrors.minute = 'Minute is required';
    else if (opponentGoalData.minute > matchDuration) newErrors.minute = `Minute cannot exceed ${matchDuration}`;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveTeamGoal = async () => {
    if (!validateTeamGoal()) return;
    
    setIsSaving(true);
    try {
      await onSave({
        _id: goal?._id,
        ...goalData,
        goalInvolvement: goalData.goalInvolvement.filter(inv => inv.playerId && inv.contributionType)
      });
      onClose();
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to save goal' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveOpponentGoal = async () => {
    if (!validateOpponentGoal()) return;
    
    setIsSaving(true);
    try {
      await onSaveOpponentGoal(opponentGoalData);
      onClose();
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to save opponent goal' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-green-400">
            <Target className="w-6 h-6" />
            {isReadOnly ? 'View Goal' : goal ? 'Edit Goal' : 'Add Goal'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {isReadOnly ? 'View goal details' : goal ? 'Update goal information' : 'Record a goal'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger value="team" disabled={isOpponentGoal && !!goal}>Our Goal</TabsTrigger>
            <TabsTrigger value="opponent">Opponent Goal</TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Minute *</Label>
                  <Input
                    type="number"
                    min={1}
                    max={matchDuration}
                    value={goalData.minute || ''}
                    onChange={(e) => setGoalData(prev => ({ ...prev, minute: parseInt(e.target.value) || null }))}
                    disabled={isReadOnly}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  {errors.minute && <p className="text-red-400 text-sm">{errors.minute}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Goal Type *</Label>
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
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Scorer *</Label>
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
                        #{player.kitNumber || '?'} {player.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.scorerId && <p className="text-red-400 text-sm">{errors.scorerId}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Assisted By (Optional)</Label>
                <Select
                  value={goalData.assistedById || ''}
                  onValueChange={(value) => setGoalData(prev => ({ ...prev, assistedById: value || null }))}
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select assister..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="" className="text-white">None</SelectItem>
                    {gamePlayers.map(player => (
                      <SelectItem key={player._id} value={player._id} className="text-white">
                        #{player.kitNumber || '?'} {player.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <FeatureGuard feature="goalContributorsEnabled" teamId={teamId}>
                <GoalInvolvementSection
                  goalInvolvement={goalData.goalInvolvement}
                  setGoalInvolvement={(involvement) => setGoalData(prev => ({ ...prev, goalInvolvement: involvement }))}
                  gamePlayers={gamePlayers}
                  scorerId={goalData.scorerId}
                  assistedById={goalData.assistedById}
                  isReadOnly={isReadOnly}
                />
              </FeatureGuard>
            </div>
          </TabsContent>

          <TabsContent value="opponent" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Minute *</Label>
                <Input
                  type="number"
                  min={1}
                  max={matchDuration}
                  value={opponentGoalData.minute || ''}
                  onChange={(e) => setOpponentGoalData(prev => ({ ...prev, minute: parseInt(e.target.value) || null }))}
                  disabled={isReadOnly}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                {errors.minute && <p className="text-red-400 text-sm">{errors.minute}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Goal Type *</Label>
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
            </div>
          </TabsContent>
        </Tabs>

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
              <Button
                onClick={activeTab === 'team' ? handleSaveTeamGoal : handleSaveOpponentGoal}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : goal ? 'Update Goal' : 'Add Goal'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

