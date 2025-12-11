import React, { useState, useMemo, useEffect } from 'react';

import { Button } from '@/shared/ui/primitives/button';
import { Textarea } from '@/shared/ui/primitives/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/primitives/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/primitives/tabs';
import { AlertCircle, FileText, BarChart3 } from 'lucide-react';
import { FeatureGuard } from '@/app/router/guards/FeatureGuard';

import { DetailedStatsSection } from '../features/DetailedStatsSection';
import { PlayerStatsDisplay } from './modules/PlayerStatsDisplay';
import { PlayerRatingsForm } from './modules/PlayerRatingsForm';
import { calculateTotalMatchDuration } from '../../../../utils/minutesValidation';

export default function PlayerPerformanceDialog({ 
  open, 
  onOpenChange, 
  player, 
  data, 
  onDataChange, 
  onSave, 
  isReadOnly,
  isStarting = false,
  game,
  matchDuration,
  substitutions = [],
  playerReports = {},
  onAddSubstitution,
  goals = [],
  timeline = [],
  cards = [],
  initialMinutes,
  initialGoals,
  initialAssists,
  isLoadingStats = false,
}) {
  const [errorMessage, setErrorMessage] = useState('');

  // Close dialog if it opens without a player
  useEffect(() => {
    if (open && !player) {
      onOpenChange?.(false);
    }
  }, [open, player, onOpenChange]);

  // Filter cards for this player
  const playerCards = useMemo(() => {
    if (!player?._id) return [];
    
    if (timeline && timeline.length > 0) {
      return timeline.filter(event => 
        event.type === 'card' && 
        (event.player?._id === player._id || event.playerId?._id === player._id || event.playerId === player._id)
      );
    }
    
    if (cards && cards.length > 0) {
      return cards.filter(card => 
        card.playerId?._id === player._id || card.playerId === player._id
      );
    }
    
    return [];
  }, [timeline, cards, player?._id]);

  // Calculate max minutes
  const maxMinutes = useMemo(() => {
    const duration = matchDuration || game?.matchDuration;
    return calculateTotalMatchDuration(duration);
  }, [matchDuration, game]);

  // Game status flags
  const isPlayedGame = game?.status === 'Played';
  const isDoneGame = game?.status === 'Done';
  
  // Display logic for stats
  const useCalculated = isPlayedGame && initialMinutes !== undefined;
  const useCalculatedGA = isPlayedGame && (initialGoals !== undefined || initialAssists !== undefined);
  const showStatsLoading = isLoadingStats && isPlayedGame && initialMinutes === undefined;
  
  const displayMinutes = useCalculated 
    ? initialMinutes 
    : (isDoneGame && data?.minutesPlayed !== undefined 
        ? data.minutesPlayed 
        : (data?.minutesPlayed !== undefined ? data.minutesPlayed : 0));

  const displayGoals = useCalculatedGA 
    ? (initialGoals ?? 0)
    : (isDoneGame && data?.goals !== undefined 
        ? data.goals 
        : (data?.goals !== undefined ? data.goals : 0));
  
  const displayAssists = useCalculatedGA 
    ? (initialAssists ?? 0)
    : (isDoneGame && data?.assists !== undefined 
        ? data.assists 
        : (data?.assists !== undefined ? data.assists : 0));

  const getCardBadgeColor = (cardType) => {
    switch (cardType) {
      case 'yellow': return 'text-yellow-400';
      case 'red': return 'text-red-400';
      case 'second-yellow': return 'text-orange-400';
      default: return 'text-slate-400';
    }
  };

  // Extract teamId
  const getTeamId = () => {
    if (!game) return null;
    const teamObj = game.team || game.Team || game.teamId || game.TeamId;
    return typeof teamObj === "object" ? teamObj._id : teamObj;
  };

  const teamId = getTeamId();

  const handleSaveClick = () => {
    setErrorMessage("");
    onSave();
  };

  if (!player) return null;

  return (
    <Dialog open={open && !!player} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-white">
              {player.kitNumber || "?"}
            </div>
            <div>
              <div className="text-lg font-bold">{player.fullName}</div>
              <div className="text-sm text-slate-400">{player.position}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="performance" className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger value="performance" className="data-[state=active]:bg-slate-700">
              <FileText className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="detailed-stats" className="data-[state=active]:bg-slate-700">
              <BarChart3 className="w-4 h-4 mr-2" />
              Detailed Stats
            </TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4 mt-4">
            {/* Stats Display */}
            <PlayerStatsDisplay
              player={player}
              data={data}
              onDataChange={onDataChange}
              isReadOnly={isReadOnly}
              maxMinutes={maxMinutes}
              displayMinutes={displayMinutes}
              displayGoals={displayGoals}
              displayAssists={displayAssists}
              playerCards={playerCards}
              showStatsLoading={showStatsLoading}
              useCalculated={useCalculated}
              useCalculatedGA={useCalculatedGA}
              isDoneGame={isDoneGame}
              getCardBadgeColor={getCardBadgeColor}
            />

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400 mb-2">{errorMessage}</p>
                {errorMessage.includes("substituted in") && onAddSubstitution && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onAddSubstitution}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                  >
                    Create Substitution
                  </Button>
                )}
              </div>
            )}

            {/* Individual Rating Dimensions */}
            <PlayerRatingsForm
              data={data}
              onDataChange={onDataChange}
              isReadOnly={isReadOnly}
            />

            {/* Notes */}
            <div>
              <label className="text-sm font-semibold text-slate-400 mb-1 block">
                Performance Notes
              </label>
              <Textarea
                value={data.notes}
                onChange={(e) => onDataChange({ ...data, notes: e.target.value })}
                disabled={isReadOnly}
                placeholder="Detailed observations about player performance..."
                className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
              />
            </div>
          </TabsContent>

          {/* Detailed Stats Tab */}
          <TabsContent value="detailed-stats" className="space-y-4 mt-4">
            <FeatureGuard feature="detailedDisciplinaryEnabled" teamId={teamId}>
              <DetailedStatsSection
                stats={data?.stats || {}}
                onStatsChange={(updatedStats) => onDataChange({ ...data, stats: updatedStats })}
                isReadOnly={isReadOnly}
              />
            </FeatureGuard>
          </TabsContent>
        </Tabs>

        {errorMessage && (
          <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-400 text-sm">{errorMessage}</p>
          </div>
        )}

        <DialogFooter className="mt-4">
          {isReadOnly ? (
            <Button 
              onClick={() => onOpenChange(false)} 
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
            >
              Close
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                className="border-slate-700 text-slate-400"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveClick} 
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
              >
                Save Report
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

