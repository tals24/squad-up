
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { User } from "@/api/entities";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  Calendar, // Used in header
  MapPin,   // Used in header
  Trophy,   // Used in dialogs, header, match stats
  Users,    // Used in header, player list
  Save,     // Used in dialogs, header button
  Star,     // Used in player performance dialog, match stats
  Shield,   // Used in final report dialog
  Zap,      // Used in final report dialog, match stats, AI summary
  Target,   // Used in final report dialog, match stats
  Edit,     // Used in header button
  Play,     // Used in header button
  Ban,      // Used in header button, player popover
  MoreVertical, // Used in player popover
  Check,    // Used in player list, formation, player popover
  RotateCcw, // Used in header buttons
  AlertCircle, // Used in loading, header button, formation
  // Search, // Not used in the component
  Armchair // Used in player list, player popover
  // The following from outline are not used in the component: Swords, Clock, Settings, Loader2, Trash2, Plus, Eye, Minus
} from "lucide-react";
import { 
  Button,
  Input,
  Label,
  Textarea,
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/design-system-components";
import CustomTooltip from "../components/CustomTooltip";
import { useData } from "../components/DataContext";
import { airtableSync } from "@/api/functions"; // Corrected import path
import { initializeGameRoster } from "@/api/functions"; // Corrected import path
import { formations } from "../components/formations";
import PlayerSelectionModal from "../components/PlayerSelectionModal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// CustomNumberInput is replaced with Input type="number", so this import is removed.
// import CustomNumberInput from "../components/CustomNumberInput";

const PlayerPerformanceDialog = ({ player, isOpen, onClose, onSave, isReadOnly, performanceData, setPerformanceData }) => {
  console.log('🟡 PlayerPerformanceDialog render - player:', player?.FullName, 'isOpen:', isOpen, 'isReadOnly:', isReadOnly, 'performanceData:', performanceData);
  if (!player) return null;

  const handleSave = () => {
    console.log('✅ PlayerPerformanceDialog: Saving performance for', player.FullName, performanceData);
    onSave(player.PlayerRecordID || player.id, performanceData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-800/95 backdrop-blur-sm border-slate-700 text-white">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-r ${
              player.Position === 'Goalkeeper' ? 'from-purple-500 to-purple-600' :
              player.Position === 'Defender' ? 'from-blue-500 to-blue-600' :
              player.Position === 'Midfielder' ? 'from-green-500 to-green-600' :
              'from-red-500 to-red-600'
            }`}>
              <span className="text-white font-bold text-lg">{player.KitNumber}</span>
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">{player.FullName}</DialogTitle>
              <p className="text-md text-slate-400">{player.Position}</p>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">Minutes</Label>
              <Input // Replaced CustomNumberInput
                type="number"
                value={performanceData.MinutesPlayed}
                onChange={(e) => setPerformanceData(prev => ({ ...prev, MinutesPlayed: e.target.value }))}
                min={0}
                max={120}
                disabled={isReadOnly}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">Goals</Label>
              <Input // Replaced CustomNumberInput
                type="number"
                value={performanceData.Goals}
                onChange={(e) => setPerformanceData(prev => ({ ...prev, Goals: e.target.value }))}
                min={0}
                disabled={isReadOnly}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">Assists</Label>
              <Input // Replaced CustomNumberInput
                type="number"
                value={performanceData.Assists}
                onChange={(e) => setPerformanceData(prev => ({ ...prev, Assists: e.target.value }))}
                min={0}
                disabled={isReadOnly}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">Rating</Label>
              <div className="flex gap-1 items-center">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => !isReadOnly && setPerformanceData(prev => ({ ...prev, GeneralRating: rating }))}
                    disabled={isReadOnly}
                    className={`w-7 h-7 transition-colors duration-200 ${
                      rating <= performanceData.GeneralRating ? 'text-yellow-400' : 'text-slate-500'
                    } ${!isReadOnly ? 'hover:text-yellow-300 cursor-pointer' : 'cursor-default'}`}
                  >
                    <Star className="w-full h-full fill-current" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-300">Notes</Label>
            <Textarea
              value={performanceData.GeneralNotes}
              onChange={(e) => setPerformanceData(prev => ({ ...prev, GeneralNotes: e.target.value }))}
              placeholder="Performance notes..."
              disabled={isReadOnly}
              className="h-24 text-sm resize-none bg-slate-700 border-slate-600 text-white focus:border-cyan-400 focus:ring-cyan-400/20"
            />
          </div>
        </div>
        {!isReadOnly && (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300 hover:bg-slate-700">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/20">
              <Save className="w-4 h-4 mr-2" />
              Save Report
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

const FinalReportDialog = ({ isOpen, onClose, onSubmit, teamSummary, setTeamSummary, finalScore, setFinalScore }) => {
  console.log('🟡 FinalReportDialog render - isOpen:', isOpen, 'finalScore:', finalScore, 'teamSummary:', teamSummary);
  const isFormValid =
    teamSummary.DefenseSummary?.trim() &&
    teamSummary.MidfieldSummary?.trim() &&
    teamSummary.AttackSummary?.trim() &&
    teamSummary.GeneralSummary?.trim() &&
    String(finalScore.ourScore).trim() !== "" &&
    String(finalScore.opponentScore).trim() !== "";
  console.log('🔍 FinalReportDialog - isFormValid:', isFormValid);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-800/95 backdrop-blur-sm border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Trophy className="w-5 h-5 text-green-500" />
            Submit & Lock Final Report
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg">
            <Label className="text-sm font-medium text-slate-300">Final Score:</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                value={finalScore.ourScore}
                onChange={(e) => setFinalScore('ourScore', e.target.value)}
                className="w-16 h-8 text-center bg-slate-700 border-slate-600 text-white focus:border-cyan-400 focus:ring-cyan-400/20"
                placeholder="0"
              />
              <span className="text-slate-500">-</span>
              <Input
                type="number"
                min="0"
                value={finalScore.opponentScore}
                onChange={(e) => setFinalScore('opponentScore', e.target.value)}
                className="w-16 h-8 text-center bg-slate-700 border-slate-600 text-white focus:border-cyan-400 focus:ring-cyan-400/20"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-slate-300">
                <Shield className="w-4 h-4 text-blue-400" />
                Defense Summary
              </Label>
              <Textarea
                value={teamSummary.DefenseSummary}
                onChange={(e) => setTeamSummary('DefenseSummary', e.target.value)}
                placeholder="How did the defense perform?"
                className="h-24 bg-slate-700 border-slate-600 text-white focus:border-cyan-400 focus:ring-cyan-400/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-slate-300">
                <Zap className="w-4 h-4 text-yellow-400" />
                Midfield Summary
              </Label>
              <Textarea
                value={teamSummary.MidfieldSummary}
                onChange={(e) => setTeamSummary('MidfieldSummary', e.target.value)}
                placeholder="How was ball control and midfield play?"
                className="h-24 bg-slate-700 border-slate-600 text-white focus:border-cyan-400 focus:ring-cyan-400/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-slate-300">
                <Target className="w-4 h-4 text-red-400" />
                Attack Summary
              </Label>
              <Textarea
                value={teamSummary.AttackSummary}
                onChange={(e) => setTeamSummary('AttackSummary', e.target.value)}
                placeholder="How effective was the attack?"
                className="h-24 bg-slate-700 border-slate-600 text-white focus:border-cyan-400 focus:ring-cyan-400/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-slate-300">
                <Trophy className="w-4 h-4 text-green-400" />
                General Summary
              </Label>
              <Textarea
                value={teamSummary.GeneralSummary}
                onChange={(e) => setTeamSummary('GeneralSummary', e.target.value)}
                placeholder="Overall game summary and key takeaways..."
                className="h-24 bg-slate-700 border-slate-600 text-white focus:border-cyan-400 focus:ring-cyan-400/20"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          {!isFormValid && (
            <p className="text-xs text-red-400 mr-auto">
              All summary fields and the final score are required to submit.
            </p>
          )}
          <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300 hover:bg-slate-700">
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!isFormValid}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white disabled:bg-slate-600 disabled:from-slate-600 disabled:to-slate-600"
          >
            <Save className="w-4 h-4 mr-2" />
            Submit & Lock Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function GameDetails() {
  console.log('🔵 GameDetails component render started');
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const gameId = searchParams.get('id');
  console.log('🔍 GameDetails - gameId from URL:', gameId);

  // RENAMED context data to avoid conflicts with local state
  const { 
    games: allGamesFromContext,
    players: allPlayersFromContext, 
    gameRosters: allGameRostersFromContext,
    reports: allReportsFromContext,
    teams: allTeamsFromContext,
    isLoading: isContextLoading, 
    error: contextError,
    refreshData // Retain refreshData for cases where full context refresh is absolutely necessary, though minimized here.
  } = useData();
  
  console.log('🔍 GameDetails - Context data received:', {
    gamesCount: allGamesFromContext?.length,
    playersCount: allPlayersFromContext?.length,
    gameRostersCount: allGameRostersFromContext?.length,
    reportsCount: allReportsFromContext?.length,
    teamsCount: allTeamsFromContext?.length,
    isContextLoading,
    contextError
  });

  // Add a state to track if the current game's data has been fully loaded and processed
  const [loadedGameId, setLoadedGameId] = useState(null);
  console.log('🔍 GameDetails - loadedGameId state initialized:', loadedGameId);

  // Core local states for the current game's data
  const [game, setGame] = useState(() => {
    console.log('🔍 GameDetails - Initializing game state');
    return null;
  });
  console.log('🔍 GameDetails - game state initialized:', game?.GameTitle);

  const [gamePlayers, setGamePlayers] = useState(() => {
    console.log('🔍 GameDetails - Initializing gamePlayers state');
    return [];
  });
  console.log('🔍 GameDetails - gamePlayers state initialized:', gamePlayers.length, 'players');

  const [localRosterStatuses, setLocalRosterStatuses] = useState(() => {
    console.log('🔍 GameDetails - Initializing localRosterStatuses state');
    return {};
  });
  console.log('🔍 GameDetails - localRosterStatuses state initialized:', Object.keys(localRosterStatuses).length, 'entries');

  const [formationType, setFormationType] = useState(() => {
    console.log('🔍 GameDetails - Initializing formationType state');
    return '1-4-4-2';
  });
  console.log('🔍 GameDetails - formationType state initialized:', formationType);

  const [positions, setPositions] = useState(() => {
    console.log('🔍 GameDetails - Initializing positions state');
    return formations['1-4-4-2'].positions;
  });
  console.log('🔍 GameDetails - positions state initialized (keys):', Object.keys(positions).length);

  const [formation, setFormation] = useState(() => {
    console.log('🔍 GameDetails - Initializing formation state');
    return {};
  });
  console.log('🔍 GameDetails - formation state initialized (keys):', Object.keys(formation).length);

  const [selectedPlayer, setSelectedPlayer] = useState(() => {
    console.log('🔍 GameDetails - Initializing selectedPlayer state');
    return null;
  });
  console.log('🔍 GameDetails - selectedPlayer state initialized:', selectedPlayer?.FullName);

  const [statusPopoverPlayerId, setStatusPopoverPlayerId] = useState(() => {
    console.log('🔍 GameDetails - Initializing statusPopoverPlayerId state');
    return null;
  });
  console.log('🔍 GameDetails - statusPopoverPlayerId state initialized:', statusPopoverPlayerId);

  const [showPlayerPerfPopover, setShowPlayerPerfPopover] = useState(() => {
    console.log('🔍 GameDetails - Initializing showPlayerPerfPopover state');
    return false;
  });
  console.log('🔍 GameDetails - showPlayerPerfPopover state initialized:', showPlayerPerfPopover);

  const [showFinalReportDialog, setShowFinalReportDialog] = useState(() => {
    console.log('🔍 GameDetails - Initializing showFinalReportDialog state');
    return false;
  });
  console.log('🔍 GameDetails - showFinalReportDialog state initialized:', showFinalReportDialog);

  const [isReadOnly, setIsReadOnly] = useState(() => {
    console.log('🔍 GameDetails - Initializing isReadOnly state');
    return false;
  });
  console.log('🔍 GameDetails - isReadOnly state initialized:', isReadOnly);

  const [draggedPlayer, setDraggedPlayer] = useState(() => {
    console.log('🔍 GameDetails - Initializing draggedPlayer state');
    return null;
  });
  console.log('🔍 GameDetails - draggedPlayer state initialized:', draggedPlayer?.FullName);

  const [isSaving, setIsSaving] = useState(() => {
    console.log('🔍 GameDetails - Initializing isSaving state');
    return false;
  });
  console.log('🔍 GameDetails - isSaving state initialized:', isSaving);

  const [isDragging, setIsDragging] = useState(() => {
    console.log('🔍 GameDetails - Initializing isDragging state');
    return false;
  });
  console.log('🔍 GameDetails - isDragging state initialized:', isDragging);

  const [finalScore, setFinalScore] = useState(() => {
    console.log('🔍 GameDetails - Initializing finalScore state');
    return { ourScore: '', opponentScore: '' };
  });
  console.log('🔍 GameDetails - finalScore state initialized:', finalScore);

  const [teamSummary, setTeamSummary] = useState(() => {
    console.log('🔍 GameDetails - Initializing teamSummary state');
    return {
      DefenseSummary: "",
      MidfieldSummary: "",
      AttackSummary: "",
      GeneralSummary: ""
    };
  });
  console.log('🔍 GameDetails - teamSummary state initialized:', teamSummary);

  const [localPlayerReports, setLocalPlayerReports] = useState(() => {
    console.log('🔍 GameDetails - Initializing localPlayerReports state');
    return {};
  });
  console.log('🔍 GameDetails - localPlayerReports state initialized (keys):', Object.keys(localPlayerReports).length);

  const [playerPerfData, setPlayerPerfData] = useState(() => {
    console.log('🔍 GameDetails - Initializing playerPerfData state');
    return {
      MinutesPlayed: 0,
      Goals: 0,
      Assists: 0,
      GeneralRating: 3,
      GeneralNotes: ""
    };
  });
  console.log('🔍 GameDetails - playerPerfData state initialized:', playerPerfData);

  const [showPlayerSelectionModal, setShowPlayerSelectionModal] = useState(() => {
    console.log('🔍 GameDetails - Initializing showPlayerSelectionModal state');
    return false;
  });
  console.log('🔍 GameDetails - showPlayerSelectionModal state initialized:', showPlayerSelectionModal);

  const [selectedPositionId, setSelectedPositionId] = useState(() => {
    console.log('🔍 GameDetails - Initializing selectedPositionId state');
    return null;
  });
  console.log('🔍 GameDetails - selectedPositionId state initialized:', selectedPositionId);

  const [selectedPositionData, setSelectedPositionData] = useState(() => {
    console.log('🔍 GameDetails - Initializing selectedPositionData state');
    return null;
  });
  console.log('🔍 GameDetails - selectedPositionData state initialized:', selectedPositionData);

  console.log('🔍 GameDetails - Initial states set and logged');

  // Memoized derived data - now based on local states and context data
  const allGameReports = useMemo(() => {
    console.log('✨ useMemo: allGameReports recomputing...');
    if (!allReportsFromContext || !gameId) {
      console.log('✨ useMemo: allGameReports - missing data, returning empty array');
      return [];
    }
    const filtered = allReportsFromContext.filter(r => r.Game?.includes(gameId));
    console.log('✨ useMemo: allGameReports computed. Count:', filtered.length);
    return filtered;
  }, [allReportsFromContext, gameId]);
  
  const matchStats = useMemo(() => {
    console.log('✨ useMemo: matchStats recomputing...');
    if (!allGameReports.length || !gamePlayers.length) {
      console.log('✨ useMemo: matchStats - no reports or players, returning defaults');
      return { scorers: [], assisters: [], mvp: null };
    }
    
    const scorers = allGameReports
        .filter(r => r.Goals && r.Goals > 0)
        .map(r => ({
            player: gamePlayers.find(p => p.id === r.Player?.[0]),
            count: r.Goals
        }))
        .filter(item => item.player);

    const assisters = allGameReports
        .filter(r => r.Assists && r.Assists > 0)
        .map(r => ({
            player: gamePlayers.find(p => p.id === r.Player?.[0]),
            count: r.Assists
        }))
        .filter(item => item.player);

    const mvp = allGameReports.reduce((best, current) => {
        if (!current.GeneralRating) return best;
        if (!best || current.GeneralRating > best.GeneralRating) {
            return current;
        }
        return best;
    }, null);

    const mvpPlayer = mvp ? gamePlayers.find(p => p.id === mvp.Player?.[0]) : null;
    console.log('✨ useMemo: matchStats computed. Scorers:', scorers.length, 'Assisters:', assisters.length, 'MVP:', mvpPlayer?.FullName);
    return { scorers, assisters, mvp: mvpPlayer ? { player: mvpPlayer, rating: mvp.GeneralRating } : null };
}, [allGameReports, gamePlayers]);

  const getPlayerReportForDisplay = useCallback((player) => {
    console.log('🔄 useCallback: getPlayerReportForDisplay called for player:', player?.FullName);
    if (!player || !(game?.Status === 'Played' || game?.Status === 'Finished')) {
      console.log('  - No report for display: player or game status not played/finished');
      return null;
    }
    if (game.Status === 'Finished') {
      const foundReport = allGameReports.find(r => {
        const isMatch = r.Player && Array.isArray(r.Player) && r.Player.includes(player.id);
        return isMatch;
      });
      console.log('  - Found report in allGameReports (Finished):', !!foundReport);
      return foundReport;
    }
    if (game.Status === 'Played') {
      const foundLocalReport = localPlayerReports[player.id];
      console.log('  - Found report in localPlayerReports (Played):', !!foundLocalReport);
      return foundLocalReport;
    }
    console.log('  - No report found for game status:', game.Status);
    return null;
  }, [game?.Status, allGameReports, localPlayerReports]);

  const getDraftKey = useCallback((gameId) => {
    console.log('🔄 useCallback: getDraftKey called for gameId:', gameId);
    return `squadup-game-draft-${gameId}`;
  }, []); // Removed unnecessary gameId dependency
  
  const saveDraftToLocalStorage = useCallback((gameId, draftData) => {
    console.log('🔄 useCallback: saveDraftToLocalStorage called for gameId:', gameId);
    try {
      localStorage.setItem(getDraftKey(gameId), JSON.stringify(draftData));
      console.log('  - Draft saved to localStorage for gameId:', gameId);
    } catch (error) {
      console.warn('[DRAFT] Failed to save to localStorage:', error);
    }
  }, [getDraftKey]);
  
  const loadDraftFromLocalStorage = useCallback((gameId) => {
    console.log('🔄 useCallback: loadDraftFromLocalStorage called for gameId:', gameId);
    try {
      const draftString = localStorage.getItem(getDraftKey(gameId));
      if (draftString) {
        console.log('  - Draft loaded from localStorage for gameId:', gameId);
        return JSON.parse(draftString);
      }
    } catch (error) {
      console.warn('[DRAFT] Failed to load from localStorage:', error);
    }
    console.log('  - No draft found in localStorage for gameId:', gameId);
    return null;
  }, [getDraftKey]);
  
  const clearDraftFromLocalStorage = useCallback((gameId) => {
    console.log('🔄 useCallback: clearDraftFromLocalStorage called for gameId:', gameId);
    try {
      localStorage.removeItem(getDraftKey(gameId));
      console.log('  - Draft cleared from localStorage for gameId:', gameId);
    } catch (error) {
      console.warn('[DRAFT] Failed to clear localStorage:', error);
    }
  }, [getDraftKey]);

  // Refined initializeRoster to not call refreshData()
  const initializeRoster = useCallback(async (currentGameId, playersFromContext, gameRostersFromContext) => {
    console.log('🔄 useCallback: initializeRoster called with gameId:', currentGameId);
    if (!currentGameId) {
        console.log('  - initializeRoster skipped: missing gameId.');
        return;
    }
    // Only proceed if roster is still empty for this game after initial load
    const currentRosterForGame = gameRostersFromContext?.filter(r => r.Game?.includes(currentGameId)) || [];
    if (currentRosterForGame.length > 0) {
        console.log('  - Roster already exists according to context, skipping initialization. Count:', currentRosterForGame.length);
        return;
    }

    try {
      console.log('  - Calling initializeGameRoster API for gameId:', currentGameId);
      const response = await initializeGameRoster({ gameId: currentGameId });
      console.log('  - initializeGameRoster response:', response);
      
      if (response.data?.success && response.data.playersCreated > 0) {
        console.log('  - Roster initialized successfully, players created:', response.data.playersCreated);
        
        // Instead of refreshData(), manually update local roster data if API returns created entries
        if (response.data.createdRosterEntries) {
          console.log('  - Updating local roster data with created entries:', response.data.createdRosterEntries.length);
          const updatedRosterEntries = response.data.createdRosterEntries.map(entry => ({
              id: entry.id,
              ...entry.fields
          }));
          
          // Update gamePlayers' roster status based on these new entries
          setGamePlayers(prevPlayers => {
            console.log('  - Updating gamePlayers with new roster entries');
            return prevPlayers.map(player => {
                const newlyCreatedEntry = updatedRosterEntries.find(entry => entry.Player?.includes(player.id));
                if (newlyCreatedEntry) {
                    console.log(`    - Updated player ${player.FullName} with roster entry ${newlyCreatedEntry.id}`);
                    return { 
                      ...player, 
                      rosterId: newlyCreatedEntry.id, 
                      rosterStatus: newlyCreatedEntry.Status || 'Not in Squad'
                    };
                }
                return player;
            });
          });

          // Update local roster statuses
          setLocalRosterStatuses(prevStatuses => {
            console.log('  - Updating localRosterStatuses with new entries');
            const newStatuses = { ...prevStatuses };
            updatedRosterEntries.forEach(entry => {
              if (entry.Player?.[0]) {
                newStatuses[entry.Player[0]] = entry.Status || 'Not in Squad';
                console.log(`    - Set status for player ${entry.Player[0]}: ${entry.Status || 'Not in Squad'}`);
              }
            });
            return newStatuses;
          });
        }
      } else {
        console.log('  - Roster initialization response (no creation needed):', response.data);
      }
    } catch (error) {
      console.error('[ROSTER_INIT] Error initializing roster:', error);
    }
  }, []);

  // Main data loading and initialization useEffect
  // This useEffect should only run when:
  // 1. The gameId changes.
  // 2. The global context data has finished loading (isContextLoading is false).
  // 3. The current game's data hasn't been fully processed into local state yet (loadedGameId !== gameId).
  useEffect(() => {
    console.log('🟢 GameDetails useEffect: Data loading/initialization triggered.');
    console.log('🟢 Dependencies:', {
      gameId,
      isContextLoading,
      allGamesFromContextCount: allGamesFromContext?.length,
      allPlayersFromContextCount: allPlayersFromContext?.length,
      allGameRostersFromContextCount: allGameRostersFromContext?.length,
      allReportsFromContextCount: allReportsFromContext?.length,
      allTeamsFromContextCount: allTeamsFromContext?.length,
      loadedGameId,
      positionsKeys: Object.keys(positions).length
    });

    // Only proceed if we have a gameId, context data is loaded, and this game hasn't been processed yet
    if (!gameId || isContextLoading || !allGamesFromContext || !allPlayersFromContext || !allGameRostersFromContext || !allReportsFromContext || !allTeamsFromContext || loadedGameId === gameId) {
        console.log('  - useEffect skipped: missing gameId, context still loading, or already loaded this game.');
        console.log('  - Conditions:', {
          hasGameId: !!gameId,
          contextNotLoading: !isContextLoading,
          hasGames: !!allGamesFromContext,
          hasPlayers: !!allPlayersFromContext,
          hasRosters: !!allGameRostersFromContext,
          hasReports: !!allReportsFromContext,
          hasTeams: !!allTeamsFromContext,
          gameNotAlreadyLoaded: loadedGameId !== gameId
        });
        return;
    }

    console.log('  - Proceeding with game data initialization for gameId:', gameId);

    const currentGame = allGamesFromContext.find(g => g.id === gameId);
    if (!currentGame) {
        console.log('  - Current game not found in context, resetting states.');
        setGame(null);
        setLoadedGameId(null);
        return;
    }

    console.log('  - Game found:', currentGame.GameTitle, 'Status:', currentGame.Status);
    setGame(currentGame);
    setIsReadOnly(currentGame.Status === 'Finished');
    console.log('  - Set game and isReadOnly states. isReadOnly:', currentGame.Status === 'Finished');

    const cleanGeneralSummary = currentGame.GeneralSummary?.startsWith('STARTING_LINEUP_JSON:') ? '' : currentGame.GeneralSummary || '';
    const initialAirtableTeamSummary = {
        DefenseSummary: currentGame.DefenseSummary || "",
        MidfieldSummary: currentGame.MidfieldSummary || "",
        AttackSummary: currentGame.AttackSummary || "",
        GeneralSummary: cleanGeneralSummary
    };
    const initialAirtableFinalScore = {
        ourScore: currentGame.OurScore || '',
        opponentScore: currentGame.OpponentScore || ''
    };
    console.log('  - Prepared initial team summary and final score from Airtable data');

    const gameTeamId = currentGame.Team?.[0];
    console.log('  - Game team ID:', gameTeamId);
    
    const teamPlayers = allPlayersFromContext.filter(player => player.Team?.includes(gameTeamId));
    console.log('  - Team players found:', teamPlayers.length);
    
    const rosterForThisGame = allGameRostersFromContext.filter(r => r.Game?.includes(gameId));
    console.log('  - Roster entries for this game:', rosterForThisGame.length);

    const initialAirtablePlayerReports = {};
    const playersForThisGame = teamPlayers.map(player => {
        const rosterEntry = rosterForThisGame.find(r => r.Player?.includes(player.id));
        const existingReport = allReportsFromContext.find(r => r.Game?.includes(gameId) && r.Player && Array.isArray(r.Player) && r.Player.includes(player.id));
        
        if (existingReport) {
            console.log(`  - Found existing report for player ${player.FullName}`);
            initialAirtablePlayerReports[player.id] = {
                MinutesPlayed: existingReport.MinutesPlayed || 0,
                Goals: existingReport.Goals || 0,
                Assists: existingReport.Assists || 0,
                GeneralRating: existingReport.GeneralRating || 3,
                GeneralNotes: existingReport.GeneralNotes || ""
            };
        }
        return {
            ...player,
            rosterId: rosterEntry?.id,
            rosterStatus: rosterEntry?.Status || 'Not in Squad',
            hasReportForThisGame: !!existingReport,
        };
    });

    console.log('  - Setting localPlayerReports with', Object.keys(initialAirtablePlayerReports).length, 'initial reports');
    setLocalPlayerReports(initialAirtablePlayerReports);
    
    console.log('  - Setting gamePlayers with', playersForThisGame.length, 'players');
    setGamePlayers(playersForThisGame);

    const initialStatuses = playersForThisGame.reduce((acc, p) => {
      acc[p.id] = p.rosterStatus;
      return acc;
    }, {});
    console.log('  - Setting localRosterStatuses with', Object.keys(initialStatuses).length, 'entries');
    setLocalRosterStatuses(initialStatuses);

    // Initialize formation based on game status and saved lineup
    const emptyFormation = {};
    Object.keys(positions).forEach(posId => emptyFormation[posId] = null);
    console.log('  - Created empty formation with', Object.keys(emptyFormation).length, 'positions');

    if ((currentGame.Status === 'Played' || currentGame.Status === 'Finished') && currentGame.GeneralSummary?.startsWith('STARTING_LINEUP_JSON:')) {
      console.log('  - Game has saved lineup, attempting to parse and load...');
      try {
        const lineupJson = currentGame.GeneralSummary.substring('STARTING_LINEUP_JSON:'.length);
        const savedLineup = JSON.parse(lineupJson);
        console.log('  - Parsed saved lineup with', Object.keys(savedLineup).length, 'positions');
        
        Object.keys(savedLineup).forEach(positionId => {
          if (savedLineup[positionId]) {
            const player = playersForThisGame.find(p => p.id === savedLineup[positionId].id);
            if (player) {
              emptyFormation[positionId] = player;
              console.log(`    - Assigned ${player.FullName} to position ${positionId}`);
            }
          }
        });
      } catch (e) {
        console.error('[EFFECT_DEBUG] Error parsing lineup from GeneralSummary:', e);
      }
    }
    
    console.log('  - Setting formation with', Object.keys(emptyFormation).filter(k => emptyFormation[k]).length, 'assigned positions');
    setFormation(emptyFormation);

    // Load draft from local storage if game status is 'Played'
    if (currentGame.Status === 'Played') {
      console.log('  - Game status is "Played", loading draft data...');
      const draftData = loadDraftFromLocalStorage(gameId);
      if (draftData) {
        console.log('  - Draft data loaded successfully, updating states...');
        
        if(draftData.localRosterStatuses) {
          console.log('    - Updating localRosterStatuses from draft with', Object.keys(draftData.localRosterStatuses).length, 'entries');
          setLocalRosterStatuses(draftData.localRosterStatuses);
        }
        
        if (draftData.localPlayerReports) {
          console.log('    - Updating localPlayerReports from draft with', Object.keys(draftData.localPlayerReports).length, 'reports');
          setLocalPlayerReports(prevReports => {
            const updatedReports = { ...initialAirtablePlayerReports, ...draftData.localPlayerReports };
            return updatedReports;
          });
          
          setGamePlayers(prevPlayers => prevPlayers.map(player => ({
            ...player,
            hasReportForThisGame: player.hasReportForThisGame || !!draftData.localPlayerReports[player.id]
          })));
          
          setFormation(prevFormation => {
            const updatedFormation = { ...prevFormation };
            Object.keys(updatedFormation).forEach(positionId => {
              const playerInFormation = updatedFormation[positionId];
              if (playerInFormation && draftData.localPlayerReports[playerInFormation.id]) {
                updatedFormation[positionId] = {
                  ...updatedFormation[positionId],
                  hasReportForThisGame: true
                };
              }
            });
            return updatedFormation;
          });
        }
        
        if (draftData.finalScore) {
          console.log('    - Setting finalScore from draft:', draftData.finalScore);
          setFinalScore(draftData.finalScore);
        } else {
          console.log('    - Setting finalScore from Airtable initial');
          setFinalScore(initialAirtableFinalScore);
        }
        
        if (draftData.teamSummary) {
          console.log('    - Setting teamSummary from draft');
          setTeamSummary(draftData.teamSummary);
        } else {
          console.log('    - Setting teamSummary from Airtable initial');
          setTeamSummary(initialAirtableTeamSummary);
        }
      } else {
        console.log('  - No draft data found, using Airtable initial values');
        setFinalScore(initialAirtableFinalScore);
        setTeamSummary(initialAirtableTeamSummary);
      }
    } else {
      console.log('  - Game status not "Played", using Airtable initial values');
      setFinalScore(initialAirtableFinalScore);
      setTeamSummary(initialAirtableTeamSummary);
      if(currentGame.Status !== 'Finished') {
        console.log('  - Game not finished, clearing any draft data');
        clearDraftFromLocalStorage(gameId);
      }
    }

    // Attempt to initialize roster if it's empty
    if (rosterForThisGame.length === 0) {
      console.log('  - Roster is empty, attempting to initialize...');
      initializeRoster(gameId, allPlayersFromContext, allGameRostersFromContext);
    }

    // Mark this game's data as loaded into local state
    setLoadedGameId(gameId);
    console.log('🟢 GameDetails useEffect: Data processing completed and loadedGameId set to:', gameId);

  }, [
    gameId,
    isContextLoading,
    allGamesFromContext,
    allPlayersFromContext,
    allGameRostersFromContext,
    allReportsFromContext,
    allTeamsFromContext,
    loadedGameId,
    positions,
    initializeRoster,
    loadDraftFromLocalStorage,
    clearDraftFromLocalStorage
  ]);

  // Watch for state changes with enhanced logging
  useEffect(() => {
    console.log('🔴 GameDetails - lineup/formation state changed:', Object.keys(formation).filter(k => formation[k]).length, 'assigned positions');
  }, [formation]);

  useEffect(() => {
    console.log('🔴 GameDetails - gamePlayers state changed:', gamePlayers?.length, 'players');
  }, [gamePlayers]);

  useEffect(() => {
    console.log('🔴 GameDetails - localRosterStatuses state changed:', Object.keys(localRosterStatuses).length, 'entries');
  }, [localRosterStatuses]);

  useEffect(() => {
    console.log('🔴 GameDetails - localPlayerReports state changed:', Object.keys(localPlayerReports).length, 'reports');
  }, [localPlayerReports]);

  useEffect(() => {
    console.log('🔴 GameDetails - game state changed:', game?.GameTitle, 'Status:', game?.Status);
  }, [game]);

  useEffect(() => {
    console.log('🔴 GameDetails - loadedGameId state changed:', loadedGameId);
  }, [loadedGameId]);

  const handleFormationChange = (newFormationType) => {
    console.log('⚡ handleFormationChange: newFormationType:', newFormationType, 'current:', formationType);
    setFormationType(newFormationType);
    setPositions(formations[newFormationType].positions);
    const emptyFormation = {};
    Object.keys(formations[newFormationType].positions).forEach(posId => emptyFormation[posId] = null);
    setFormation(emptyFormation);
    console.log('⚡ handleFormationChange: Formation and positions updated.');
  };

  const handleGamePlayed = async () => {
    console.log('⚡ handleGamePlayed: Triggered.');
    setIsSaving(true);
    try {
      const rosterUpdates = gamePlayers.map(player => {
        const currentStatus = localRosterStatuses[player.id] || 'Not in Squad';
        console.log(`  - Preparing roster update for ${player.FullName}: status ${currentStatus}`);
        if (player.rosterId) {
          return airtableSync({
            action: 'update',
            tableName: 'GameRoster',
            recordId: player.rosterId,
            recordData: { Status: currentStatus }
          });
        } else {
          return airtableSync({
            action: 'create',
            tableName: 'GameRoster',
            recordData: {
              Game: [gameId],
              Player: [player.id],
              Status: currentStatus
            }
          });
        }
      });

      console.log('  - Sending roster updates to Airtable...');
      await Promise.all(rosterUpdates);
      console.log('  - Roster updates completed.');

      const lineupJson = JSON.stringify(formation);
      const startingLineupString = `STARTING_LINEUP_JSON:${lineupJson}`;
      console.log('  - Preparing game status update to "Played" with lineup JSON.');

      const gameUpdateResponse = await airtableSync({
        action: 'update',
        tableName: 'Games',
        recordId: gameId,
        recordData: {
          Status: 'Played',
          GeneralSummary: startingLineupString
        }
      });
      console.log('  - Game status updated to "Played" in Airtable. Response:', gameUpdateResponse);

      // Instead of refreshData(), update local game state
      console.log('  - Updating local game state instead of calling refreshData()');
      setGame(prev => ({ 
        ...prev, 
        Status: 'Played', 
        GeneralSummary: startingLineupString 
      }));
      setIsReadOnly(false);
      console.log('⚡ handleGamePlayed: Game status changed to Played, local state updated.');
    } catch (error) {
      console.error("Error updating game to played:", error);
    }
    setIsSaving(false);
    console.log('⚡ handleGamePlayed: Finished.');
  };

  const handleGamePostponed = async () => {
    console.log('⚡ handleGamePostponed: Triggered.');
    try {
      await airtableSync({
        action: 'update',
        tableName: 'Games',
        recordId: gameId,
        recordData: { Status: 'Postponed' }
      });
      console.log('  - Game status updated to "Postponed" in Airtable. Navigating away.');
      navigate(createPageUrl("GamesSchedule"));
    } catch (error) {
      console.error("Error postponing game:", error);
    }
    console.log('⚡ handleGamePostponed: Finished.');
  };

  const handlePlayerClick = (player) => {
    console.log('⚡ handlePlayerClick: Player clicked:', player.FullName);
    const rosterStatus = localRosterStatuses[player.id];
    const canReport = rosterStatus === 'Starting Lineup' || rosterStatus === 'Bench';
    console.log('  - Roster status:', rosterStatus, 'Can report:', canReport);

    if (game?.Status === 'Played' && !isReadOnly && canReport) {
      const existingReport = localPlayerReports[player.id];
      console.log('  - Game is Played, not read-only, and player can be reported. Existing report:', !!existingReport);
      
      const perfData = existingReport || {
        MinutesPlayed: 0,
        Goals: 0,
        Assists: 0,
        GeneralRating: 3,
        GeneralNotes: ""
      };
      
      setPlayerPerfData(perfData);
      setSelectedPlayer(player);
      setShowPlayerPerfPopover(true);
      console.log('  - Player performance dialog opened for:', player.FullName);
    } else {
      console.log('  - Player click ignored based on conditions.');
    }
  };

  const handleRosterStatusChange = (player, status) => {
    console.log('⚡ handleRosterStatusChange: Player:', player.FullName, 'New status:', status);
    const updatedStatuses = { ...localRosterStatuses, [player.id]: status };
    setLocalRosterStatuses(updatedStatuses);
    setStatusPopoverPlayerId(null);
    console.log('  - Local roster statuses updated. Saving draft.');

    saveDraftToLocalStorage(gameId, {
      localPlayerReports,
      finalScore,
      teamSummary,
      localRosterStatuses: updatedStatuses
    });
    console.log('⚡ handleRosterStatusChange: Finished.');
  };

  const handleSavePlayerPerformance = (playerId, performanceData) => {
    console.log('⚡ handleSavePlayerPerformance: PlayerId:', playerId, 'Performance data:', performanceData);
    const updatedReports = { ...localPlayerReports, [playerId]: performanceData };
    setLocalPlayerReports(updatedReports);
    console.log('  - Local player reports updated.');
    
    setGamePlayers(prev => prev.map(player => 
      player.id === playerId 
        ? { ...player, hasReportForThisGame: true }
        : player
    ));
    console.log('  - gamePlayers updated for hasReportForThisGame status.');

    setFormation(prev => {
      const updatedFormation = { ...prev };
      Object.keys(updatedFormation).forEach(positionId => {
        if (updatedFormation[positionId]?.id === playerId) {
          updatedFormation[positionId] = {
            ...updatedFormation[positionId],
            hasReportForThisGame: true
          };
        }
      });
      console.log('  - Formation players updated for hasReportForThisGame status.');
      return updatedFormation;
    });

    saveDraftToLocalStorage(gameId, {
      localPlayerReports: updatedReports,
      finalScore,
      teamSummary,
      localRosterStatuses
    });
    console.log('⚡ handleSavePlayerPerformance: Draft saved. Finished.');
  };

  const handleFinalScoreChange = (field, value) => {
    console.log('⚡ handleFinalScoreChange: Field:', field, 'Value:', value);
    const updatedScore = { ...finalScore, [field]: value };
    setFinalScore(updatedScore);
    console.log('  - Final score updated. Saving draft.');
    
    saveDraftToLocalStorage(gameId, {
      localPlayerReports,
      finalScore: updatedScore,
      teamSummary,
      localRosterStatuses
    });
    console.log('⚡ handleFinalScoreChange: Finished.');
  };

  const handleTeamSummaryChange = (field, value) => {
    console.log('⚡ handleTeamSummaryChange: Field:', field, 'Value:', value);
    const updatedSummary = { ...teamSummary, [field]: value };
    setTeamSummary(updatedSummary);
    console.log('  - Team summary updated. Saving draft.');
    
    saveDraftToLocalStorage(gameId, {
      localPlayerReports,
      finalScore,
      teamSummary: updatedSummary,
      localRosterStatuses
    });
    console.log('⚡ handleTeamSummaryChange: Finished.');
  };

  const handleFinalReportSubmit = async () => {
    console.log('⚡ handleFinalReportSubmit: Triggered.');
    setIsSaving(true);
    try {
      const timelinePromises = Object.entries(localPlayerReports).map(([playerId, reportData]) => {
        const formattedDate = game.Date ? new Date(game.Date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        console.log(`  - Preparing timeline event for player ${playerId}`);
        const submissionPayload = {
            Player: [playerId],
            Game: [gameId],
            Date: formattedDate,
            MinutesPlayed: parseInt(reportData.MinutesPlayed) || 0,
            Goals: parseInt(reportData.Goals) || 0,
            Assists: parseInt(reportData.Assists) || 0,
            GeneralRating: parseInt(reportData.GeneralRating) || 3,
            GeneralNotes: reportData.GeneralNotes,
            EventType: 'Game Report',
        };

        return airtableSync({
          action: 'create',
          tableName: 'TimelineEvents',
          recordData: submissionPayload
        });
      });

      console.log('  - Submitting player performance reports to TimelineEvents...');
      await Promise.all(timelinePromises);
      console.log('  - Player performance reports submitted.');

      let finalGeneralSummary = teamSummary.GeneralSummary;
      
      if (game.GeneralSummary?.startsWith('STARTING_LINEUP_JSON:')) {
        finalGeneralSummary = game.GeneralSummary;
        console.log('  - Preserving existing lineup JSON in GeneralSummary.');
      }
      console.log('  - Submitting final game report to Games table.');

      await airtableSync({
        action: 'update',
        tableName: 'Games',
        recordId: gameId,
        recordData: {
          Status: 'Finished',
          OurScore: parseInt(finalScore.ourScore) || 0,
          OpponentScore: parseInt(finalScore.opponentScore) || 0,
          DefenseSummary: teamSummary.DefenseSummary,
          MidfieldSummary: teamSummary.MidfieldSummary,
          AttackSummary: teamSummary.AttackSummary,
          GeneralSummary: finalGeneralSummary
        }
      });
      console.log('  - Game record updated to "Finished".');

      clearDraftFromLocalStorage(gameId);
      console.log('  - Draft cleared from local storage.');

      setShowFinalReportDialog(false);
      setIsReadOnly(true);
      
      // Instead of refreshData(), update local game state
      console.log('  - Updating local game state instead of calling refreshData()');
      setGame(prev => ({
        ...prev,
        Status: 'Finished',
        OurScore: parseInt(finalScore.ourScore) || 0,
        OpponentScore: parseInt(finalScore.opponentScore) || 0,
        DefenseSummary: teamSummary.DefenseSummary,
        MidfieldSummary: teamSummary.MidfieldSummary,
        AttackSummary: teamSummary.AttackSummary,
        GeneralSummary: finalGeneralSummary
      }));
      
      console.log('⚡ handleFinalReportSubmit: Final report submitted, local state updated.');
    } catch (error) {
      console.error("Error submitting final report:", error);
    }
    setIsSaving(false);
    console.log('⚡ handleFinalReportSubmit: Finished.');
  };

  const handleDragStart = (e, player) => {
    console.log('⚡ handleDragStart: Player:', player.FullName);
    setDraggedPlayer(player);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    
    const dragImage = document.createElement('div');
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.left = '-1000px';
    dragImage.style.width = '40px';
    dragImage.style.height = '40px';
    dragImage.style.borderRadius = '50%';
    dragImage.style.display = 'flex';
    dragImage.style.alignItems = 'center';
    dragImage.style.justifyContent = 'center';
    dragImage.style.color = 'white';
    dragImage.style.fontSize = '12px';
    dragImage.style.fontWeight = 'bold';
    dragImage.style.border = '2px solid white';
    dragImage.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    
    const positionColors = {
      'Goalkeeper': '#8b5cf6',
      'Defender': '#3b82f6',
      'Midfielder': '#10b981',
      'Forward': '#ef4444'
    };
    dragImage.style.backgroundColor = positionColors[player.Position] || '#6b7280';
    
    dragImage.textContent = player.KitNumber || '?';
    
    document.body.appendChild(dragImage);
    
    e.dataTransfer.setDragImage(dragImage, 20, 20);
    
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 0);
    console.log('⚡ handleDragStart: Drag image set.');
  };

  const handleDragEnd = () => {
    console.log('⚡ handleDragEnd: Triggered.');
    setDraggedPlayer(null);
    setIsDragging(false);
    console.log('⚡ handleDragEnd: Dragged player and dragging state reset.');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, positionId) => {
    console.log('⚡ handleDrop: Triggered. Dropped on position:', positionId);
    e.preventDefault();
    if (draggedPlayer && game?.Status === 'Scheduled') {
      console.log('  - Valid drop: draggedPlayer:', draggedPlayer.FullName, 'Game status:', game.Status);
      const newFormation = { ...formation };
      Object.keys(newFormation).forEach(posId => {
        if (newFormation[posId]?.id === draggedPlayer.id) {
          newFormation[posId] = null;
          console.log(`  - Removed ${draggedPlayer.FullName} from old position ${posId}`);
        }
      });

      newFormation[positionId] = draggedPlayer;
      setFormation(newFormation);
      const updatedStatuses = { ...localRosterStatuses, [draggedPlayer.id]: 'Starting Lineup' };
      setLocalRosterStatuses(updatedStatuses);
      console.log('  - Player assigned to new position and status updated to "Starting Lineup". Saving draft.');

      saveDraftToLocalStorage(gameId, {
          localPlayerReports,
          finalScore,
          teamSummary,
          localRosterStatuses: updatedStatuses
      });
      setDraggedPlayer(null);
      console.log('⚡ handleDrop: Finished.');
    } else {
      console.log('  - Invalid drop: draggedPlayer:', !!draggedPlayer, 'Game status:', game?.Status);
    }
  };

  const removeFromFormation = (positionId) => {
    console.log('⚡ removeFromFormation: Position:', positionId);
    if (game?.Status === 'Scheduled') {
      const playerToRemove = formation[positionId];
      if (playerToRemove) {
        setFormation(prev => ({ ...prev, [positionId]: null }));
        const updatedStatuses = { ...localRosterStatuses, [playerToRemove.id]: 'Not in Squad' };
        setLocalRosterStatuses(updatedStatuses);
        console.log(`  - Player ${playerToRemove.FullName} removed from formation and status set to "Not in Squad". Saving draft.`);

        saveDraftToLocalStorage(gameId, {
          localPlayerReports,
          finalScore,
          teamSummary,
          localRosterStatuses: updatedStatuses
        });
      }
      console.log('⚡ removeFromFormation: Finished.');
    } else {
      console.log('  - Cannot remove from formation, game status not "Scheduled".');
    }
  };

  const handleEditReport = () => {
    console.log('⚡ handleEditReport: Triggered.');
    setIsReadOnly(false);
    setGame(prev => ({ ...prev, Status: 'Played' }));
    console.log('⚡ handleEditReport: isReadOnly set to false, game status forced to "Played".');
  };

  const handlePositionClick = (positionId, positionData) => {
    console.log('⚡ handlePositionClick: Position:', positionId, 'Data:', positionData);
    if (game?.Status === 'Scheduled' && !formation[positionId]) {
      setSelectedPositionId(positionId);
      setSelectedPositionData(positionData);
      setShowPlayerSelectionModal(true);
      console.log('  - Player selection modal opened for position:', positionId);
    } else {
      console.log('  - Position click ignored based on conditions.');
    }
  };

  const handlePlayerSelection = (player) => {
    console.log('⚡ handlePlayerSelection: Selected player:', player.FullName, 'for position:', selectedPositionId);
    if (selectedPositionId) {
      const newFormation = { ...formation };
      Object.keys(newFormation).forEach(posId => {
        if (newFormation[posId]?.id === player.id) {
          newFormation[posId] = null;
          console.log(`  - Removed ${player.FullName} from old position ${posId}`);
        }
      });

      newFormation[selectedPositionId] = player;
      setFormation(newFormation);
      const updatedStatuses = { ...localRosterStatuses, [player.id]: 'Starting Lineup' };
      setLocalRosterStatuses(updatedStatuses);
      console.log('  - Player assigned to selected position and status updated to "Starting Lineup". Saving draft.');

      saveDraftToLocalStorage(gameId, {
        localPlayerReports,
        finalScore,
        teamSummary,
        localRosterStatuses: updatedStatuses
      });

      setShowPlayerSelectionModal(false);
      setSelectedPositionId(null);
      setSelectedPositionData(null);
      console.log('⚡ PlayerSelectionModal: Closed. Finished.');
    } else {
      console.log('  - No selected position ID, player selection ignored.');
    }
  };

  const availablePlayers = useMemo(() => {
    console.log('✨ useMemo: availablePlayers recomputing...');
    const playersNotInFormation = gamePlayers.filter(
      (player) => !Object.values(formation).some((p) => p?.id === player.id)
    );
    console.log('  - Players not in formation (raw):', playersNotInFormation.length);

    if (game?.Status === 'Played' || game?.Status === 'Finished') {
      const benchPlayers = playersNotInFormation
        .filter(player => {
          const status = localRosterStatuses[player.id] || 'Not in Squad';
          return status === 'Bench';
        })
        .sort((a, b) => {
          const aStatus = localRosterStatuses[a.id] || 'Not in Squad';
          const bStatus = localRosterStatuses[b.id] || 'Not in Squad';
          if (aStatus === 'Unavailable' && bStatus === 'Not in Squad') return 1; // Unavailable last
          if (bStatus === 'Unavailable' && aStatus === 'Not in Squad') return -1;
          if (aStatus === 'Not in Squad' && bStatus === 'Bench') return 1; // Bench before Not in Squad
          if (bStatus === 'Not in Squad' && aStatus === 'Bench') return -1;
          return 0;
        });
      console.log('  - Available players (game Played/Finished - bench only):', benchPlayers.length);
      return benchPlayers;
    }
    
    const sortedAvailable = playersNotInFormation.sort((a, b) => {
      const aStatus = localRosterStatuses[a.id] || 'Not in Squad';
      const bStatus = localRosterStatuses[b.id] || 'Not in Squad';
      // Sort order: Bench, Not in Squad, Unavailable
      if (aStatus === 'Bench' && bStatus !== 'Bench') return -1;
      if (bStatus === 'Bench' && aStatus !== 'Bench') return 1;
      if (aStatus === 'Not in Squad' && bStatus === 'Unavailable') return -1;
      if (bStatus === 'Not in Squad' && aStatus === 'Unavailable') return 1;
      return 0;
    });
    console.log('  - Available players (game Scheduled - not in formation):', sortedAvailable.length);
    return sortedAvailable;
  }, [gamePlayers, formation, localRosterStatuses, game?.Status]);

  const unreportedPlayersCount = useMemo(() => {
    console.log('✨ useMemo: unreportedPlayersCount recomputing...');
    if (!gamePlayers || !game || game.Status !== 'Played') {
      console.log('  - Unreported players count skipped: gamePlayers or game not ready, or status not "Played".');
      return 0;
    }

    const count = gamePlayers.filter(player => {
      const rosterStatus = localRosterStatuses[player.id];
      const isInSquad = rosterStatus === 'Starting Lineup' || rosterStatus === 'Bench';
      
      const report = getPlayerReportForDisplay(player);
      
      return isInSquad && !report;
    }).length;
    console.log('  - Unreported players count:', count);
    return count;
  }, [gamePlayers, game, localRosterStatuses, getPlayerReportForDisplay]);

  const playersOnPitch = useMemo(() => {
    console.log('✨ useMemo: playersOnPitch recomputing...');
    const result = gamePlayers.filter(player => Object.values(formation).some(p => p?.id === player.id));
    console.log('  - Players on pitch count:', result.length);
    return result;
  }, [gamePlayers, formation]);

  const ourTeamName = useMemo(() => {
    console.log('✨ useMemo: ourTeamName recomputing...');
    if (!game || !allTeamsFromContext || !game.Team) return "Our Team";
    const team = allTeamsFromContext.find(t => t.id === game.Team[0]);
    console.log('  - Our team name:', team?.Name);
    return team?.Name || "Our Team";
  }, [game, allTeamsFromContext]);

  console.log('🔵 GameDetails component render completed');

  if (isContextLoading) return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/30"></div>
          <div className="absolute inset-0 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin"></div>
          <div className="absolute inset-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
        </div>
        <p className="text-slate-300 font-medium text-lg">Initializing Tactical System...</p>
      </div>
    </div>
  );
  
  if (!game) return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-white" />
        </div>
        <p className="text-slate-300 font-medium text-lg">Game data not found.</p>
      </div>
    </div>
  );

  return (
    <>
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
        
        {/* Enhanced Header */}
        <div className="flex-shrink-0 bg-slate-900/95 backdrop-blur-xl border-b border-cyan-500/20 relative">
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-cyan-400/0 via-cyan-400/50 to-cyan-400/0"></div>
          
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to={createPageUrl("GamesSchedule")}>
                  <Button variant="outline" size="icon" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-cyan-500 transition-all duration-300">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
                
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    {game.GameTitle || 'Game Details'}
                  </h1>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="w-3 h-3 text-cyan-400" />
                      <span className="font-mono">{new Date(game.Date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric' 
                      })}</span>
                    </div>
                    {game.Location && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <MapPin className="w-3 h-3 text-blue-400" />
                        <span>{game.Location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-400">
                      <Users className="w-3 h-3 text-purple-400" />
                      <span>vs {game.Opponent || 'TBD'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(game.Status === 'Played' || game.Status === 'Finished') && (
                  <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600 rounded-xl p-3 min-w-[200px]">
                    <div className="text-center">
                      <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-1">Final Score</div>
                      <div className="flex items-center justify-center gap-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{finalScore.ourScore || game.OurScore || '0'}</div>
                          <div className="text-xs text-cyan-400 font-medium truncate max-w-24">{ourTeamName}</div>
                        </div>
                        <div className="text-lg text-slate-500">-</div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{finalScore.opponentScore || game.OpponentScore || '0'}</div>
                          <div className="text-xs text-red-400 font-medium truncate max-w-24">{game.Opponent}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className={`w-3 h-3 rounded-full relative ${
                  game.Status === 'Scheduled' ? 'bg-blue-500' :
                  game.Status === 'Played' ? 'bg-yellow-400' :
                  game.Status === 'Finished' ? 'bg-green-500' : 'bg-gray-500'
                }`}>
                  {game.Status === 'Played' && (
                    <div className={`absolute inset-0 rounded-full bg-yellow-400 animate-pulse`}></div>
                  )}
                </div>
                <span className={`font-bold text-xs ${
                  game.Status === 'Scheduled' ? 'text-blue-400' :
                  game.Status === 'Played' ? 'text-yellow-400' :
                  game.Status === 'Finished' ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {game.Status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {(game.Status === 'Played' && !isReadOnly) && (
                  <div className="flex items-center gap-3 bg-slate-800/80 backdrop-blur-sm border border-slate-600 rounded-xl px-4 py-2">
                    <Label className="text-sm font-medium text-slate-300">Score:</Label>
                    <div className="flex items-center gap-2">
                      <Input // Replaced CustomNumberInput
                          type="number"
                          value={finalScore.ourScore}
                          onChange={(e) => handleFinalScoreChange('ourScore', e.target.value)}
                          min={0}
                          max={99}
                          placeholder="0"
                          className="w-24"
                      />
                      <span className="text-slate-400 font-bold text-lg">-</span>
                      <Input // Replaced CustomNumberInput
                          type="number"
                          value={finalScore.opponentScore}
                          onChange={(e) => handleFinalScoreChange('opponentScore', e.target.value)}
                          min={0}
                          max={99}
                          placeholder="0"
                          className="w-24"
                      />
                    </div>
                  </div>
                )}

                {game.Status === 'Scheduled' && (
                  <Button
                    onClick={handleGamePlayed}
                    disabled={isSaving}
                    size="sm"
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold shadow-lg shadow-green-500/25 transition-all duration-300"
                  >
                    {isSaving ? (
                      <>
                        <RotateCcw className="w-4 h-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Game Was Played
                      </>
                    )}
                  </Button>
                )}
                {game.Status === 'Scheduled' && (
                  <Button
                    onClick={handleGamePostponed}
                    size="sm"
                    variant="outline"
                    className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 hover:border-orange-400 transition-all duration-300"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Postpone
                  </Button>
                )}

                {game.Status === 'Played' && !isReadOnly && (
                  <Button
                    onClick={() => setShowFinalReportDialog(true)}
                    disabled={isSaving || unreportedPlayersCount > 0}
                    size="sm"
                    className={`font-bold shadow-lg transition-all duration-300 ${
                      unreportedPlayersCount > 0 
                        ? 'bg-gradient-to-r from-gray-500 to-gray-600 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-500/25'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <RotateCcw className="w-4 h-4 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : unreportedPlayersCount > 0 ? (
                      <>
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {unreportedPlayersCount} Reports Missing
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Submit Final Report
                      </>
                    )}
                  </Button>
                )}

                {game.Status === 'Finished' && isReadOnly && (
                  <Button 
                    onClick={handleEditReport} 
                    size="sm"
                    variant="outline"
                    className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all duration-300"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Report
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area: 2-column Grid */}
        <div className="flex-1 grid grid-cols-[280px_1fr] overflow-hidden">
          
          {/* LEFT SIDEBAR: Players List */}
          <div className="bg-slate-900/90 backdrop-blur-xl border-r border-cyan-500/20 flex flex-col relative overflow-hidden">
            <div className="absolute left-0 top-0 w-px h-full bg-gradient-to-b from-cyan-400/0 via-cyan-400/50 to-cyan-400/0"></div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-4 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-600">
              
              {/* Players on Pitch Section */}
              <div>
                <h3 className="font-bold text-white text-md flex items-center gap-2 mb-2 px-1">
                  <Users className="w-4 h-4 text-purple-400" />
                  Players on Pitch
                  <Badge variant="outline" className="text-purple-400 border-purple-400/50 bg-purple-400/10 ml-auto">{playersOnPitch.length}</Badge>
                </h3>
                <div className="space-y-1">
                  {playersOnPitch.length > 0 ? (
                    playersOnPitch.map((player) => (
                      <Link 
                        key={player.id} 
                        to={createPageUrl(`Player?id=${player.id}`)}
                        className="group flex items-center gap-2 p-2 rounded-lg transition-colors duration-200 border border-transparent hover:bg-slate-700/50 hover:border-cyan-500/50"
                      >
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${
                          player.Position === 'Goalkeeper' ? 'from-purple-500 to-purple-600' :
                          player.Position === 'Defender' ? 'from-blue-500 to-blue-600' :
                          player.Position === 'Midfielder' ? 'from-green-500 to-green-600' :
                          'from-red-500 to-red-600'
                        } flex items-center justify-center shadow-sm`}>
                          <span className="text-white font-bold text-xs">
                            {player.KitNumber || '?'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate text-xs">
                            {player.FullName}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs h-4 px-1 rounded-sm ${
                              player.Position === 'Goalkeeper' ? 'text-purple-400 border-purple-400/50' :
                              player.Position === 'Defender' ? 'text-blue-400 border-blue-400/50' :
                              player.Position === 'Midfielder' ? 'text-green-400 border-green-400/50' :
                              'text-red-400 border-red-400/50'
                            }`}
                          >
                            {player.Position}
                          </Badge>
                        </div>
                        {getPlayerReportForDisplay(player) && (
                          <Check className="w-3 h-3 text-green-400 ml-auto flex-shrink-0" />
                        )}
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-4 text-slate-500 text-xs">
                      No players assigned
                    </div>
                  )}
                </div>
              </div>

              {/* Squad Players Section */}
              <div>
                <h3 className="font-bold text-white text-md flex items-center gap-2 mb-2 px-1">
                  <Users className="w-4 h-4 text-cyan-400" />
                  Squad Players
                  <Badge variant="outline" className="text-cyan-400 border-cyan-400/50 bg-cyan-400/10 ml-auto">{availablePlayers.length}</Badge>
                </h3>
                <div className="text-xs text-slate-400 font-mono px-1 mb-2">{game?.Status === 'Scheduled' ? 'Drag to position' : 'Bench Players'}</div>
                <div className="space-y-1">
                  {availablePlayers.map((player) => {
                    const playerStatus = localRosterStatuses[player.id] || 'Not in Squad';
                    const isUnavailable = playerStatus === 'Unavailable';
                    const isDraggablePlayer = game.Status === 'Scheduled' && !isUnavailable;
                    const canBeReported = playerStatus === 'Starting Lineup' || playerStatus === 'Bench';
                    const isClickableForPerformance = game.Status === 'Played' && !isReadOnly && canBeReported;
                    const isStatusSelectable = (game.Status === 'Scheduled');
                    const reportForDisplay = getPlayerReportForDisplay(player);

                    const playerItemContent = (
                      <div
                        className={`group flex items-center gap-2 p-2 rounded-lg transition-all duration-200 border border-transparent ${
                          isUnavailable ? 'opacity-60' : 'hover:bg-slate-700/50 hover:border-cyan-500/50'
                        } ${isClickableForPerformance && 'cursor-pointer'} ${isDraggablePlayer && 'cursor-grab active:cursor-grabbing'}`}
                        draggable={isDraggablePlayer}
                        onDragStart={(e) => isDraggablePlayer && handleDragStart(e, player)}
                        onDragEnd={handleDragEnd}
                        onClick={() => isClickableForPerformance && handlePlayerClick(player)}
                      >
                        <div className="relative">
                          <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${
                            player.Position === 'Goalkeeper' ? 'from-purple-500 to-purple-600' :
                            player.Position === 'Defender' ? 'from-blue-500 to-blue-600' :
                            player.Position === 'Midfielder' ? 'from-green-500 to-green-600' :
                            'from-red-500 to-red-600'
                          } flex items-center justify-center shadow-sm`}>
                            <span className="text-white font-bold text-xs">{player.KitNumber || '?'}</span>
                          </div>
                          {reportForDisplay && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-800"></div>}
                        </div>
                        
                        <Link 
                            to={createPageUrl(`Player?id=${player.id}`)}
                            className="flex-1 min-w-0"
                        >
                          <p className="font-semibold text-white truncate text-xs">{player.FullName}</p>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className={`text-xs h-4 px-1 rounded-sm ${
                              player.Position === 'Goalkeeper' ? 'text-purple-400 border-purple-400/50' :
                              player.Position === 'Defender' ? 'text-blue-400 border-blue-400/50' :
                              player.Position === 'Midfielder' ? 'text-green-400 border-green-400/50' :
                              'text-red-400 border-red-400/50'
                            }`}>
                              {player.Position}
                            </Badge>
                          </div>
                        </Link>

                        <div className="ml-auto flex items-center gap-2">
                          {playerStatus === 'Bench' && (
                            <Armchair className="w-4 h-4 text-yellow-400" />
                          )}
                          
                          {reportForDisplay && <Check className="w-3 h-3 text-green-400" />}

                          {isStatusSelectable && (
                            <Popover open={statusPopoverPlayerId === player.id} onOpenChange={(open) => setStatusPopoverPlayerId(open ? player.id : null)}>
                              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50">
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-48 p-1.5 bg-slate-800 border-slate-600" align="end">
                                <div className="grid gap-0.5">
                                  {playerStatus !== 'Bench' && (
                                      <Button variant="ghost" className="w-full justify-start items-center gap-2 text-white hover:bg-slate-700 text-sm h-8 px-2" onClick={() => handleRosterStatusChange(player, 'Bench')}>
                                          <Armchair className="w-4 h-4 text-yellow-400" />
                                          Add to Bench
                                      </Button>
                                  )}
                                  {playerStatus === 'Bench' && (
                                      <Button variant="ghost" className="w-full justify-start items-center gap-2 text-white hover:bg-slate-700 text-sm h-8 px-2" onClick={() => handleRosterStatusChange(player, 'Not in Squad')}>
                                          <Armchair className="w-4 h-4 text-slate-400" />
                                          Remove from Bench
                                      </Button>
                                  )}
                                  
                                  {playerStatus !== 'Unavailable' ? (
                                      <Button variant="ghost" className="w-full justify-start items-center gap-2 text-white hover:bg-slate-700 text-sm h-8 px-2" onClick={() => handleRosterStatusChange(player, 'Unavailable')}>
                                          <Ban className="w-4 h-4 text-red-400" />
                                          Mark Unavailable
                                      </Button>
                                  ) : (
                                      <Button variant="ghost" className="w-full justify-start items-center gap-2 text-white hover:bg-slate-700 text-sm h-8 px-2" onClick={() => handleRosterStatusChange(player, 'Not in Squad')}>
                                          <Check className="w-4 h-4 text-green-400" />
                                          Mark as Available
                                      </Button>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </div>
                    );

                    // Removed CustomTooltip wrapper as per requirement
                    return <div key={player.id}>{playerItemContent}</div>;
                  })}
                  
                  {availablePlayers.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="font-medium text-slate-400 text-sm">{game?.Status === 'Scheduled' ? 'All players are positioned' : 'No bench players'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CENTRAL PANE + RIGHT PANE WRAPPER */}
          <div className="grid grid-cols-[1fr_280px] overflow-hidden gap-4 p-4">

            {/* CENTRAL PANE: Tactical Board */}
            <div className="flex flex-col gap-4 overflow-hidden">
              <Card className="flex-shrink-0 bg-slate-800/70 backdrop-blur-sm border border-slate-700 h-48">
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400"/>
                    Match Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 text-slate-300 text-sm overflow-y-auto max-h-32 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600 hover:scrollbar-thumb-slate-500">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <p className="text-slate-500 font-bold flex items-center gap-1"><Target className="w-3 h-3"/>Scorers</p>
                      {matchStats.scorers && matchStats.scorers.length > 0 ? (
                        matchStats.scorers.map(({ player, count }) => (
                          <p key={player.id} className="font-medium text-white">{player.FullName} ({count})</p>
                        ))
                      ) : <p className="text-slate-400 italic">None</p>}
                    </div>
                     <div className="space-y-2">
                      <p className="text-slate-500 font-bold flex items-center gap-1"><Zap className="w-3 h-3"/>Assists</p>
                      {matchStats.assisters && matchStats.assisters.length > 0 ? (
                        matchStats.assisters.map(({ player, count }) => (
                          <p key={player.id} className="font-medium text-white">{player.FullName} ({count})</p>
                        ))
                      ) : <p className="text-slate-400 italic">None</p>}
                    </div>
                     <div className="space-y-2">
                      <p className="text-slate-500 font-bold flex items-center gap-1"><Star className="w-3 h-3"/>Top Rated (MVP)</p>
                      {matchStats.mvp ? (
                         <p className="font-medium text-white">{matchStats.mvp.player.FullName} ({matchStats.mvp.rating}/5)</p>
                      ) : <p className="text-slate-400 italic">None</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tactical Board */}
              <div className="w-full flex-grow relative bg-gradient-to-br from-green-700 via-green-600 to-green-800 rounded-xl overflow-hidden" style={{ minHeight: '400px' }}>
                <div className="absolute inset-0" style={{
                  backgroundImage: `
                    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                    linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px'
                }}></div>
                
                {(game.Status === 'Scheduled' || isReadOnly) && (
                  <div className="absolute top-4 left-4 z-20">
                    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-600 rounded-xl p-2">
                      <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-1">Formation</div>
                      <Select value={formationType} onValueChange={handleFormationChange} disabled={isReadOnly}>
                        <SelectTrigger className="w-32 bg-slate-800 text-white border-slate-600 hover:border-cyan-500 transition-colors h-8 text-xs [&>svg]:text-slate-400 hover:[&>svg]:text-cyan-400 focus:[&>svg]:text-cyan-400">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          {Object.keys(formations).map(f => (
                            <SelectItem key={f} value={f} className="text-white hover:bg-slate-700 focus:bg-slate-700">{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/80 rounded-full"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/80 rounded-full"></div>
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-white/80"></div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2/5 h-24 border-2 border-white/80 border-b-0 rounded-t-xl"></div>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2/5 h-24 border-2 border-white/80 border-t-0 rounded-b-xl"></div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/4 h-12 border-2 border-white/80 border-b-0 rounded-t-lg"></div>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/4 h-12 border-2 border-white/80 border-t-0 rounded-b-lg"></div>
                </div>

                {Object.entries(positions).map(([positionId, pos]) => {
                  const player = formation[positionId];
                  const playerObj = player ? gamePlayers.find(p => p.id === player.id) || player : null;
                  
                  const reportForDisplay = getPlayerReportForDisplay(playerObj);
                  const isClickablePosition = game?.Status === 'Scheduled' && !playerObj;

                  const PlayerOnPitchVisual = playerObj ? (
                    <div className="relative group text-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white/80 cursor-pointer transform transition-all duration-300 hover:scale-110 hover:shadow-cyan-500/50 ${
                          playerObj.Position === 'Goalkeeper' ? 'bg-purple-500' :
                          playerObj.Position === 'Defender' ? 'bg-blue-500' :
                          playerObj.Position === 'Midfielder' ? 'bg-green-500' :
                          'bg-red-500'
                        }`}
                        onClick={() => handlePlayerClick(playerObj)}
                      >
                        {playerObj.KitNumber || '?'}
                      </div>
                      
                      {/* UNREPORTED Player Indicator (Orange) */}
                      {game.Status === 'Played' && !isReadOnly && !reportForDisplay && (localRosterStatuses[playerObj.id] === 'Starting Lineup' || localRosterStatuses[playerObj.id] === 'Bench') && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center animate-pulse shadow-md">
                          <AlertCircle className="w-2 h-2 text-white" />
                        </div>
                      )}
                      
                      {/* REPORTED Player Indicator (Green) */}
                      {game.Status === 'Played' && reportForDisplay && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                          <Check className="w-2 h-2 text-white" />
                        </div>
                      )}
                      
                      {game?.Status === 'Scheduled' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromFormation(positionId);
                          }}
                          className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-600 shadow-sm"
                        >
                          ×
                        </button>
                      )}
                      
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1">
                        <div className="bg-slate-900/80 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded-full border border-white/20 whitespace-nowrap shadow-sm">
                          {playerObj.FullName}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className={`w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center text-white font-bold transition-all duration-300 relative ${
                        isClickablePosition 
                          ? 'border-white/70 hover:border-cyan-400 hover:bg-cyan-500/20 cursor-pointer hover:scale-110' 
                          : draggedPlayer 
                            ? 'border-blue-400 bg-blue-500/30' 
                            : 'border-white/30'
                      }`}
                      onClick={isClickablePosition ? () => handlePositionClick(positionId, pos) : undefined}
                      title={isClickablePosition ? `Click to assign ${pos.type?.toLowerCase() || 'player'}` : undefined}
                    >
                      <span className="text-xs opacity-70 font-mono">{pos.label}</span>
                      {isClickablePosition && (
                        <div className="absolute inset-0 rounded-full bg-white/10 animate-pulse"></div>
                      )}
                    </div>
                  );

                  return (
                    <div
                      key={positionId}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, positionId)}
                    >
                      {reportForDisplay ? (
                        <CustomTooltip content={(
                          <div className="p-2 max-w-xs text-left">
                            <div className="flex items-center mb-1">
                              {[1, 2, 3, 4, 5].map(rating => (
                                <Star key={rating} className={`w-3 h-3 ${rating <= reportForDisplay.GeneralRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                              ))}
                              <span className="text-xs font-bold ml-1.5 text-white">{reportForDisplay.GeneralRating}/5</span>
                            </div>
                            {reportForDisplay.Goals > 0 && (
                              <div className="text-xs text-green-400">⚽ Goals: {reportForDisplay.Goals}</div>
                            )}
                            {reportForDisplay.Assists > 0 && (
                              <div className="text-xs text-blue-400">🅰️ Assists: {reportForDisplay.Assists}</div>
                            )}
                            {reportForDisplay.MinutesPlayed > 0 && (
                              <div className="text-xs text-slate-400">⏱️ Mins: {reportForDisplay.MinutesPlayed}</div>
                            )}
                            {reportForDisplay.GeneralNotes && (
                              <p className="text-xs text-gray-300 leading-tight mt-1">
                                {reportForDisplay.GeneralNotes}
                              </p>
                            )}
                          </div>
                        )}>
                          {PlayerOnPitchVisual}
                        </CustomTooltip>
                      ) : PlayerOnPitchVisual}
                    </div>
                  );
                })}

                {isDragging && draggedPlayer && (
                  <div className="fixed pointer-events-none z-50" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold animate-pulse shadow-2xl shadow-cyan-500/50">
                      {draggedPlayer.KitNumber || '?'}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* RIGHT SIDEBAR: AI Summary */}
            <div className="flex flex-col gap-4 overflow-hidden">
              <Card className="flex-1 flex flex-col bg-slate-800/70 backdrop-blur-sm border border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400"/>
                    AI Match Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 text-slate-300 text-sm">
                  <p className="mb-2">
                    The AI will analyze all player reports and team summaries to generate a concise, three-sentence summary of the match.
                  </p>
                  <p className="text-xs text-slate-500 italic">
                    (This component will be implemented in a future step, integrating with an LLM.)
                  </p>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>

        {selectedPlayer && (
          <PlayerPerformanceDialog
            player={selectedPlayer}
            isOpen={showPlayerPerfPopover}
            onClose={() => {
              setShowPlayerPerfPopover(false);
              setSelectedPlayer(null);
              console.log('⚡ PlayerPerformanceDialog: Closed.');
            }}
            onSave={handleSavePlayerPerformance}
            isReadOnly={isReadOnly}
            performanceData={playerPerfData}
            setPerformanceData={setPlayerPerfData}
          />
        )}

        <FinalReportDialog
          isOpen={showFinalReportDialog}
          onClose={() => {
            setShowFinalReportDialog(false);
            console.log('⚡ FinalReportDialog: Closed.');
          }}
          onSubmit={handleFinalReportSubmit}
          teamSummary={teamSummary}
          setTeamSummary={handleTeamSummaryChange}
          finalScore={finalScore}
          setFinalScore={handleFinalScoreChange}
        />

        <PlayerSelectionModal
          isOpen={showPlayerSelectionModal}
          onClose={() => {
            setShowPlayerSelectionModal(false);
            setSelectedPositionId(null);
            setSelectedPositionData(null);
            console.log('⚡ PlayerSelectionModal: Closed.');
          }}
          onSelectPlayer={handlePlayerSelection}
          players={availablePlayers}
          positionType={selectedPositionData?.type}
          positionLabel={selectedPositionData?.label}
        />
      </div>
    </>
  );
}
