import React, { useState, useMemo, useEffect } from 'react';
import { BaseDialog } from '@/shared/ui/composed';
import { Input } from '@/shared/ui/primitives/input';
import { Textarea } from '@/shared/ui/primitives/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/primitives/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/primitives/select';
import { Badge } from '@/shared/ui/primitives/badge';
import { AlertCircle, FileText, BarChart3 } from 'lucide-react';
import { FeatureGuard } from '@/app/router/guards/FeatureGuard';
import { DetailedStatsSection } from '../features/DetailedStatsSection';
import { Button } from '@/shared/ui/primitives/button';

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
  goals = [], // Goals array from parent
  timeline = [], // Unified timeline from parent (Cards, Goals, Substitutions)
  cards = [], // Cards array from parent (fallback if timeline not available)
  // NEW: Pre-fetched stats (optional, for instant display)
  initialMinutes,
  initialGoals,
  initialAssists,
  // NEW: Loading state for stat fields
  isLoadingStats = false,
}) {
  const [errorMessage, setErrorMessage] = useState('');

  // Close dialog if it opens without a player (prevents React reconciliation errors)
  useEffect(() => {
    if (open && !player) {
      onOpenChange?.(false);
    }
  }, [open, player, onOpenChange]);

  // Filter cards for this player from timeline or cards array
  const playerCards = useMemo(() => {
    if (!player?._id) return [];

    // Priority 1: Filter from timeline
    if (timeline && timeline.length > 0) {
      return timeline.filter(
        (event) =>
          event.type === 'card' &&
          (event.player?._id === player._id ||
            event.playerId?._id === player._id ||
            event.playerId === player._id)
      );
    }

    // Priority 2: Filter from cards array
    if (cards && cards.length > 0) {
      return cards.filter(
        (card) => card.playerId?._id === player._id || card.playerId === player._id
      );
    }

    return [];
  }, [timeline, cards, player?._id]);

  const minutesPlayed = useMemo(() => Number(data?.minutesPlayed || 0), [data]);
  // Use matchDuration prop if available (real-time from header), otherwise fallback to game.matchDuration
  const maxMinutes = useMemo(() => {
    const duration = matchDuration || game?.matchDuration;
    return calculateTotalMatchDuration(duration);
  }, [matchDuration, game]);

  // Determine game status
  const isPlayedGame = game?.status === 'Played';
  const isDoneGame = game?.status === 'Done';

  // For "Played" games: Use pre-fetched stats (from props) or fallback to data prop
  // For "Done" games: Use saved values from GameReport (in data prop)
  // These fields are read-only for Played games (calculated by server)
  const useCalculated = isPlayedGame && initialMinutes !== undefined;
  const useCalculatedGA =
    isPlayedGame && (initialGoals !== undefined || initialAssists !== undefined);

  // Show loading indicator only if stats are being pre-fetched (not yet available)
  const showStatsLoading = isLoadingStats && isPlayedGame && initialMinutes === undefined;

  // Display logic: Pre-fetched stats > data prop > default (0)
  const displayMinutes = useCalculated
    ? initialMinutes
    : isDoneGame && data?.minutesPlayed !== undefined
      ? data.minutesPlayed
      : data?.minutesPlayed !== undefined
        ? data.minutesPlayed
        : minutesPlayed;

  // Display logic: Pre-fetched stats > data prop > default (0)
  const displayGoals = useCalculatedGA
    ? (initialGoals ?? 0)
    : isDoneGame && data?.goals !== undefined
      ? data.goals
      : data?.goals !== undefined
        ? data.goals
        : 0;

  const displayAssists = useCalculatedGA
    ? (initialAssists ?? 0)
    : isDoneGame && data?.assists !== undefined
      ? data.assists
      : data?.assists !== undefined
        ? data.assists
        : 0;

  // Debug logging for "Done" games
  useEffect(() => {
    if (isDoneGame && open && player) {
      console.log('🔍 [PlayerPerformanceDialog] Done game - data check:', {
        playerId: player._id,
        playerName: player.fullName,
        dataMinutesPlayed: data?.minutesPlayed,
        dataGoals: data?.goals,
        dataAssists: data?.assists,
        displayMinutes,
        displayGoals,
        displayAssists,
        fullData: data,
      });
    }
  }, [isDoneGame, open, player, data, displayMinutes, displayGoals, displayAssists]);

  const showCalculatedIndicator = useCalculated || useCalculatedGA || isDoneGame;

  const handleSaveClick = () => {
    // Minutes are automatically calculated from game events (substitutions, red cards)
    // No validation needed - calculation ensures correctness
    setErrorMessage('');
    onSave();
  };

  const getCardBadgeColor = (cardType) => {
    // Return only text color, no background color
    switch (cardType) {
      case 'yellow':
        return 'text-yellow-400';
      case 'red':
        return 'text-red-400';
      case 'second-yellow':
        return 'text-orange-400';
      default:
        return 'text-slate-400';
    }
  };

  // Extract teamId from game object (handles different property names)
  const getTeamId = () => {
    if (!game) return null;
    const teamObj = game.team;
    return typeof teamObj === 'object' ? teamObj._id : teamObj;
  };

  const teamId = getTeamId();

  // Ensure player exists before rendering Dialog
  if (!player) return null;

  return (
    <BaseDialog
      open={open && !!player}
      onOpenChange={onOpenChange}
      title="Player Performance Report"
      size="lg"
      isReadOnly={isReadOnly}
      error={errorMessage}
      actions={
        isReadOnly
          ? { cancel: { label: 'Close', onClick: () => onOpenChange(false) } }
          : {
              cancel: { label: 'Cancel', onClick: () => onOpenChange(false) },
              confirm: { label: 'Save Report', onClick: handleSaveClick },
            }
      }
    >
      {/* Player Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-white">
          {player.kitNumber || '?'}
        </div>
        <div>
          <div className="text-lg font-bold text-white">{player.fullName}</div>
          <div className="text-sm text-slate-400">{player.position}</div>
        </div>
      </div>

      <Tabs defaultValue="performance" className="mt-2">
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
          {/* Stats Grid: Minutes, Goals, Assists, Cards */}
          <div className="grid grid-cols-4 gap-4">
            {/* Minutes Played */}
            <div>
              <label className="text-sm font-semibold text-slate-400 mb-1 block">
                Minutes Played
              </label>
              <Input
                type="number"
                min="0"
                max={maxMinutes}
                value={displayMinutes ?? 0}
                onChange={(e) => {
                  if (!useCalculated && !isDoneGame) {
                    onDataChange({ ...data, minutesPlayed: parseInt(e.target.value) || 0 });
                    setErrorMessage(''); // Clear error when user types
                  }
                }}
                disabled={isReadOnly || useCalculated || isDoneGame}
                readOnly={useCalculated || isDoneGame}
                className={`bg-slate-800 border-slate-700 text-white ${
                  useCalculated || isDoneGame ? 'opacity-75 cursor-not-allowed' : ''
                }`}
                placeholder={showStatsLoading ? 'Loading...' : undefined}
              />
              {showStatsLoading ? (
                <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                  <span className="animate-spin">⏳</span>
                </p>
              ) : (
                <div className="mt-1 text-xs text-slate-500">Max: {maxMinutes} min</div>
              )}
            </div>

            {/* Goals */}
            <div>
              <label className="text-sm font-semibold text-slate-400 mb-1 block">Goals</label>
              <Input
                type="number"
                min="0"
                value={displayGoals ?? 0}
                onChange={(e) => {
                  if (!useCalculatedGA && !isDoneGame) {
                    onDataChange({ ...data, goals: parseInt(e.target.value) || 0 });
                  }
                }}
                disabled={isReadOnly || useCalculatedGA || isDoneGame}
                readOnly={useCalculatedGA || isDoneGame}
                className={`bg-slate-800 border-slate-700 text-white ${
                  useCalculatedGA || isDoneGame ? 'opacity-75 cursor-not-allowed' : ''
                }`}
                placeholder={showStatsLoading ? 'Loading...' : undefined}
              />
              {showStatsLoading && (
                <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                  <span className="animate-spin">⏳</span>
                </p>
              )}
            </div>

            {/* Assists */}
            <div>
              <label className="text-sm font-semibold text-slate-400 mb-1 block">Assists</label>
              <Input
                type="number"
                min="0"
                value={displayAssists ?? 0}
                onChange={(e) => {
                  if (!useCalculatedGA && !isDoneGame) {
                    onDataChange({ ...data, assists: parseInt(e.target.value) || 0 });
                  }
                }}
                disabled={isReadOnly || useCalculatedGA || isDoneGame}
                readOnly={useCalculatedGA || isDoneGame}
                className={`bg-slate-800 border-slate-700 text-white ${
                  useCalculatedGA || isDoneGame ? 'opacity-75 cursor-not-allowed' : ''
                }`}
                placeholder={showStatsLoading ? 'Loading...' : undefined}
              />
              {showStatsLoading && (
                <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                  <span className="animate-spin">⏳</span>
                </p>
              )}
            </div>

            {/* Cards Display */}
            <div>
              <label className="text-sm font-semibold text-slate-400 mb-1 block">Cards</label>
              <div className="min-h-[2.5rem] flex flex-col gap-1.5 justify-center">
                {playerCards.length > 0 ? (
                  playerCards
                    .sort((a, b) => (a.minute || 0) - (b.minute || 0))
                    .map((card) => {
                      const cardType = card.cardType || card.type;
                      const minute = card.minute;
                      const cardEmoji =
                        cardType === 'yellow' ? '🟨' : cardType === 'red' ? '🟥' : '🟨🟥';

                      return (
                        <div key={card._id} className="flex items-center gap-1.5">
                          <span className={`text-xs ${getCardBadgeColor(cardType)}`}>
                            {cardEmoji}
                          </span>
                          <span className="text-xs text-slate-300">{minute}'</span>
                        </div>
                      );
                    })
                ) : (
                  <span className="text-xs text-slate-500">None</span>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400 mb-2">{errorMessage}</p>
              {errorMessage.includes('substituted in') && onAddSubstitution && (
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
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-400 mb-2 block">
                Physical Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => !isReadOnly && onDataChange({ ...data, rating_physical: star })}
                    disabled={isReadOnly}
                    className={`
                      text-2xl transition-all
                      ${(data.rating_physical || 3) >= star ? 'text-yellow-400' : 'text-slate-600'}
                      ${!isReadOnly ? 'hover:text-yellow-400 hover:scale-110 cursor-pointer' : 'cursor-not-allowed'}
                    `}
                  >
                    ★
                  </button>
                ))}
                <span className="ml-2 text-sm text-slate-400">{data.rating_physical || 3}/5</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-400 mb-2 block">
                Technical Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => !isReadOnly && onDataChange({ ...data, rating_technical: star })}
                    disabled={isReadOnly}
                    className={`
                      text-2xl transition-all
                      ${(data.rating_technical || 3) >= star ? 'text-yellow-400' : 'text-slate-600'}
                      ${!isReadOnly ? 'hover:text-yellow-400 hover:scale-110 cursor-pointer' : 'cursor-not-allowed'}
                    `}
                  >
                    ★
                  </button>
                ))}
                <span className="ml-2 text-sm text-slate-400">{data.rating_technical || 3}/5</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-400 mb-2 block">
                Tactical Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => !isReadOnly && onDataChange({ ...data, rating_tactical: star })}
                    disabled={isReadOnly}
                    className={`
                      text-2xl transition-all
                      ${(data.rating_tactical || 3) >= star ? 'text-yellow-400' : 'text-slate-600'}
                      ${!isReadOnly ? 'hover:text-yellow-400 hover:scale-110 cursor-pointer' : 'cursor-not-allowed'}
                    `}
                  >
                    ★
                  </button>
                ))}
                <span className="ml-2 text-sm text-slate-400">{data.rating_tactical || 3}/5</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-400 mb-2 block">
                Mental Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => !isReadOnly && onDataChange({ ...data, rating_mental: star })}
                    disabled={isReadOnly}
                    className={`
                      text-2xl transition-all
                      ${(data.rating_mental || 3) >= star ? 'text-yellow-400' : 'text-slate-600'}
                      ${!isReadOnly ? 'hover:text-yellow-400 hover:scale-110 cursor-pointer' : 'cursor-not-allowed'}
                    `}
                  >
                    ★
                  </button>
                ))}
                <span className="ml-2 text-sm text-slate-400">{data.rating_mental || 3}/5</span>
              </div>
            </div>
          </div>

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
          {/* Detailed Stats Section (Feature Flag Protected) */}
          <FeatureGuard feature="detailedDisciplinaryEnabled" teamId={teamId}>
            <DetailedStatsSection
              stats={data?.stats || {}}
              onStatsChange={(updatedStats) => onDataChange({ ...data, stats: updatedStats })}
              isReadOnly={isReadOnly}
            />
          </FeatureGuard>
        </TabsContent>
      </Tabs>
    </BaseDialog>
  );
}
