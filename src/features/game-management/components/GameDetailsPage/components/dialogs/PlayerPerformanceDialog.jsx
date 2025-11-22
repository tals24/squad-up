import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Textarea } from "@/shared/ui/primitives/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/primitives/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/primitives/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/primitives/select";
import { Badge } from "@/shared/ui/primitives/badge";
import { AlertCircle, FileText, ShieldAlert, Plus, Trash2, Info } from "lucide-react";
import { FeatureGuard } from "@/components/FeatureGuard";
import { DetailedDisciplinarySection } from "../features/DetailedDisciplinarySection";

import { calculateTotalMatchDuration } from "../../../../utils/minutesValidation";
import {
  fetchPlayerDisciplinaryActions,
  createDisciplinaryAction,
  deleteDisciplinaryAction,
} from "../../../../api/disciplinaryActionsApi";
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
  // NEW: Pre-fetched stats (optional, for instant display)
  initialMinutes,
  initialGoals,
  initialAssists,
  // NEW: Loading state for stat fields
  isLoadingStats = false,
}) {
  const [errorMessage, setErrorMessage] = useState("");
  const [disciplinaryActions, setDisciplinaryActions] = useState([]);
  const [isLoadingActions, setIsLoadingActions] = useState(false);
  const [newAction, setNewAction] = useState({
    cardType: 'yellow',
    minute: '',
    reason: '',
    foulsCommitted: '',
    foulsReceived: ''
  });

  // Close dialog if it opens without a player (prevents React reconciliation errors)
  useEffect(() => {
    if (open && !player) {
      onOpenChange?.(false);
    }
  }, [open, player, onOpenChange]);

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
  const useCalculatedGA = isPlayedGame && (initialGoals !== undefined || initialAssists !== undefined);
  
  // Show loading indicator only if stats are being pre-fetched (not yet available)
  const showStatsLoading = isLoadingStats && isPlayedGame && initialMinutes === undefined;
  
  // Display logic: Pre-fetched stats > data prop > default (0)
  const displayMinutes = useCalculated 
    ? initialMinutes 
    : (isDoneGame && data?.minutesPlayed !== undefined 
        ? data.minutesPlayed 
        : (data?.minutesPlayed !== undefined ? data.minutesPlayed : minutesPlayed));

  // Display logic: Pre-fetched stats > data prop > default (0)
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
        fullData: data
      });
    }
  }, [isDoneGame, open, player, data, displayMinutes, displayGoals, displayAssists]);
  
  const showCalculatedIndicator = useCalculated || useCalculatedGA || isDoneGame;

  // Fetch disciplinary actions when dialog opens
  useEffect(() => {
    if (open && player && game?._id) {
      loadDisciplinaryActions();
    }
  }, [open, player, game]);

  const loadDisciplinaryActions = async () => {
    if (!game?._id || !player?._id) return;
    
    setIsLoadingActions(true);
    try {
      const actions = await fetchPlayerDisciplinaryActions(game._id, player._id);
      setDisciplinaryActions(actions);
    } catch (error) {
      console.error('Error loading disciplinary actions:', error);
    } finally {
      setIsLoadingActions(false);
    }
  };

  const handleAddDisciplinaryAction = async () => {
    if (!newAction.minute || !newAction.cardType) {
      setErrorMessage("Card type and minute are required");
      return;
    }

    try {
      const actionData = {
        playerId: player._id,
        cardType: newAction.cardType,
        minute: parseInt(newAction.minute),
        reason: newAction.reason || '',
        foulsCommitted: newAction.foulsCommitted ? newAction.foulsCommitted : '0',
        foulsReceived: newAction.foulsReceived ? newAction.foulsReceived : '0'
      };

      await createDisciplinaryAction(game._id, actionData);
      await loadDisciplinaryActions();
      
      // Reset form
      setNewAction({
        cardType: 'yellow',
        minute: '',
        reason: '',
        foulsCommitted: '',
        foulsReceived: ''
      });
      setErrorMessage("");
    } catch (error) {
      console.error('Error adding disciplinary action:', error);
      setErrorMessage(error.response?.data?.message || "Failed to add disciplinary action");
    }
  };

  const handleDeleteDisciplinaryAction = async (actionId) => {
    try {
      await deleteDisciplinaryAction(game._id, actionId);
      await loadDisciplinaryActions();
    } catch (error) {
      console.error('Error deleting disciplinary action:', error);
      setErrorMessage("Failed to delete disciplinary action");
    }
  };

  const handleSaveClick = () => {
    // Minutes are automatically calculated from game events (substitutions, red cards)
    // No validation needed - calculation ensures correctness
    setErrorMessage("");
    onSave();
  };

  const getCardBadgeColor = (cardType) => {
    switch (cardType) {
      case 'yellow': return 'bg-yellow-500 text-black';
      case 'red': return 'bg-red-500 text-white';
      case 'second-yellow': return 'bg-orange-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  // Extract teamId from game object (handles different property names)
  const getTeamId = () => {
    if (!game) return null;
    const teamObj = game.team || game.Team || game.teamId || game.TeamId;
    return typeof teamObj === "object" ? teamObj._id : teamObj;
  };

  const teamId = getTeamId();

  // Ensure player exists before rendering Dialog
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
            <TabsTrigger value="disciplinary" className="data-[state=active]:bg-slate-700">
              <ShieldAlert className="w-4 h-4 mr-2" />
              Disciplinary
              {disciplinaryActions.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {disciplinaryActions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4 mt-4">
          {/* Minutes Played */}
          <div>
            <label className="text-sm font-semibold text-slate-400 mb-1 block">
              Minutes Played
              <span className="text-xs text-slate-500 ml-2">(Max: {maxMinutes} min)</span>
            </label>
            <Input
              type="number"
              min="0"
              max={maxMinutes}
              value={displayMinutes ?? 0}
              onChange={(e) => {
                if (!useCalculated && !isDoneGame) {
                  onDataChange({ ...data, minutesPlayed: parseInt(e.target.value) || 0 });
                  setErrorMessage(""); // Clear error when user types
                }
              }}
              disabled={isReadOnly || useCalculated || isDoneGame}
              readOnly={useCalculated || isDoneGame}
              className={`bg-slate-800 border-slate-700 text-white ${
                (useCalculated || isDoneGame) ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              placeholder={showStatsLoading ? "Loading..." : undefined}
            />
            {showStatsLoading && (
              <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                <span className="animate-spin">⏳</span>
                Calculating minutes...
              </p>
            )}
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
          </div>

          {/* Goals and Assists - Calculated from Goals collection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-400 mb-1 block">
                Goals
              </label>
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
                  (useCalculatedGA || isDoneGame) ? 'opacity-75 cursor-not-allowed' : ''
                }`}
                placeholder={showStatsLoading ? "Loading..." : undefined}
              />
              {showStatsLoading && (
                <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                  <span className="animate-spin">⏳</span>
                  Calculating goals...
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-400 mb-1 block">
                Assists
              </label>
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
                  (useCalculatedGA || isDoneGame) ? 'opacity-75 cursor-not-allowed' : ''
                }`}
                placeholder={showStatsLoading ? "Loading..." : undefined}
              />
              {showStatsLoading && (
                <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                  <span className="animate-spin">⏳</span>
                  Calculating assists...
                </p>
              )}
            </div>
          </div>

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
                      ${(data.rating_physical || 3) >= star ? "text-yellow-400" : "text-slate-600"}
                      ${!isReadOnly ? "hover:text-yellow-400 hover:scale-110 cursor-pointer" : "cursor-not-allowed"}
                    `}
                  >
                    ★
                  </button>
                ))}
                <span className="ml-2 text-sm text-slate-400">
                  {data.rating_physical || 3}/5
                </span>
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
                      ${(data.rating_technical || 3) >= star ? "text-yellow-400" : "text-slate-600"}
                      ${!isReadOnly ? "hover:text-yellow-400 hover:scale-110 cursor-pointer" : "cursor-not-allowed"}
                    `}
                  >
                    ★
                  </button>
                ))}
                <span className="ml-2 text-sm text-slate-400">
                  {data.rating_technical || 3}/5
                </span>
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
                      ${(data.rating_tactical || 3) >= star ? "text-yellow-400" : "text-slate-600"}
                      ${!isReadOnly ? "hover:text-yellow-400 hover:scale-110 cursor-pointer" : "cursor-not-allowed"}
                    `}
                  >
                    ★
                  </button>
                ))}
                <span className="ml-2 text-sm text-slate-400">
                  {data.rating_tactical || 3}/5
                </span>
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
                      ${(data.rating_mental || 3) >= star ? "text-yellow-400" : "text-slate-600"}
                      ${!isReadOnly ? "hover:text-yellow-400 hover:scale-110 cursor-pointer" : "cursor-not-allowed"}
                    `}
                  >
                    ★
                  </button>
                ))}
                <span className="ml-2 text-sm text-slate-400">
                  {data.rating_mental || 3}/5
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-semibold text-slate-400 mb-1 block">Performance Notes</label>
            <Textarea
              value={data.notes}
              onChange={(e) => onDataChange({ ...data, notes: e.target.value })}
              disabled={isReadOnly}
              placeholder="Detailed observations about player performance..."
              className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
            />
          </div>
          </TabsContent>

          {/* Disciplinary Tab */}
          <TabsContent value="disciplinary" className="space-y-4 mt-4">
            {/* Existing Disciplinary Actions */}
            {isLoadingActions ? (
              <div className="text-center py-8 text-slate-400">Loading disciplinary actions...</div>
            ) : disciplinaryActions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <ShieldAlert className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No disciplinary actions recorded</p>
              </div>
            ) : (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Disciplinary Actions</h3>
                {disciplinaryActions.map((action) => (
                  <div
                    key={action._id}
                    className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Badge className={getCardBadgeColor(action.cardType)}>
                        {action.cardType === 'yellow' && '🟨'}
                        {action.cardType === 'red' && '🟥'}
                        {action.cardType === 'second-yellow' && '🟨🟥'}
                        {' '}
                        {action.cardType.replace('-', ' ').toUpperCase()}
                      </Badge>
                      <div className="flex-1">
                        <div className="text-sm text-white">
                          Minute {action.minute}'
                        </div>
                        {action.reason && (
                          <div className="text-xs text-slate-400">{action.reason}</div>
                        )}
                        <FeatureGuard feature="detailedDisciplinaryEnabled" teamId={teamId}>
                          {(action.foulsCommitted !== '0' || action.foulsReceived !== '0') && (
                            <div className="text-xs text-slate-500">
                              Fouls: {action.foulsCommitted} committed, {action.foulsReceived} received
                            </div>
                          )}
                        </FeatureGuard>
                      </div>
                    </div>
                    {!isReadOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDisciplinaryAction(action._id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add New Disciplinary Action Form */}
            {!isReadOnly && (
              <div className="border-t border-slate-700 pt-4 mt-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Disciplinary Action
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Card Type *</label>
                      <Select
                        value={newAction.cardType}
                        onValueChange={(value) => setNewAction(prev => ({ ...prev, cardType: value }))}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="yellow" className="text-white">🟨 Yellow</SelectItem>
                          <SelectItem value="red" className="text-white">🟥 Red</SelectItem>
                          <SelectItem value="second-yellow" className="text-white">🟨🟥 Second Yellow</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Minute *</label>
                      <Input
                        type="number"
                        min="1"
                        max={maxMinutes}
                        value={newAction.minute}
                        onChange={(e) => setNewAction(prev => ({ ...prev, minute: e.target.value }))}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="45"
                      />
                    </div>
                  </div>

                  <FeatureGuard feature="detailedDisciplinaryEnabled" teamId={teamId}>
                    <DetailedDisciplinarySection
                      foulsCommitted={newAction.foulsCommitted}
                      foulsReceived={newAction.foulsReceived}
                      onFoulsCommittedChange={(value) => setNewAction(prev => ({ ...prev, foulsCommitted: value }))}
                      onFoulsReceivedChange={(value) => setNewAction(prev => ({ ...prev, foulsReceived: value }))}
                      isReadOnly={isReadOnly}
                    />
                  </FeatureGuard>

                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Reason (Optional)</label>
                    <Textarea
                      value={newAction.reason}
                      onChange={(e) => setNewAction(prev => ({ ...prev, reason: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white min-h-[60px]"
                      placeholder="Brief description of the incident..."
                      maxLength={200}
                    />
                  </div>

                  <Button
                    onClick={handleAddDisciplinaryAction}
                    className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Disciplinary Action
                  </Button>
                </div>
              </div>
            )}
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
            <Button onClick={() => onOpenChange(false)} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white">
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-400">
                Cancel
              </Button>
              <Button onClick={handleSaveClick} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white">
                Save Report
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

