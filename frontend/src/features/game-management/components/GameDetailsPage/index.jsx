import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useData } from "@/app/providers/DataProvider";
import { useAutosave } from "@/shared/hooks";
import { useToast } from "@/shared/ui/primitives/use-toast";
import { useFeature } from "@/shared/hooks";

// Import formation configurations
import { formations } from "./formations";

// Import validation utilities
import { 
  validateSquad, 
  validatePlayerPosition, 
  validateReportCompleteness,
  validateStartingLineup,
  validateGoalkeeper
} from "../../utils/squadValidation";

// Import shared components
import { ConfirmationModal } from "@/shared/components";
import PageLoader from "@/shared/components/PageLoader";

// Import UI modules (composition wrappers)
import {
  GameHeaderModule,
  RosterSidebarModule,
  TacticalBoardModule,
  MatchAnalysisModule,
  DialogsModule
} from "./modules";

// Import custom hooks
import { useGameDetailsData } from "./hooks";

// Import API functions
import { fetchGoals, createGoal, updateGoal, deleteGoal } from "../../api/goalsApi";
import { fetchSubstitutions, createSubstitution, updateSubstitution, deleteSubstitution } from "../../api/substitutionsApi";
import { fetchCards, createCard, updateCard, deleteCard } from "../../api/cardsApi";
import { fetchPlayerStats } from "../../api/playerStatsApi";
import { fetchMatchTimeline } from "../../api/timelineApi";
import { fetchPlayerMatchStats, upsertPlayerMatchStats } from "../../api/playerMatchStatsApi";
import { fetchDifficultyAssessment, updateDifficultyAssessment, deleteDifficultyAssessment } from "../../api/difficultyAssessmentApi";

export default function GameDetails() {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("id");
  const { games, players, teams, gameRosters, gameReports, refreshData, isLoading, error, updateGameInCache, updateGameRostersInCache } = useData();
  const { toast } = useToast();

  // Custom hook: Game data loading + initialization
  const {
    game,
    gamePlayers,
    isFetchingGame,
    matchDuration,
    finalScore,
    teamSummary,
    isReadOnly,
    setGame,
    setMatchDuration,
    setFinalScore,
    setTeamSummary,
  } = useGameDetailsData(gameId, { games, players, teams });

  // Roster & formation state
  const [localRosterStatuses, setLocalRosterStatuses] = useState({});
  const [formationType, setFormationType] = useState("1-4-4-2");
  const [formation, setFormation] = useState({});
  const [localPlayerReports, setLocalPlayerReports] = useState({});
  const [localPlayerMatchStats, setLocalPlayerMatchStats] = useState({}); // Fouls and other match stats
  
  // Player stats pre-fetched for Played games (for instant dialog display)
  const [teamStats, setTeamStats] = useState({});
  const [isLoadingTeamStats, setIsLoadingTeamStats] = useState(false);
  
  // Goals state
  const [goals, setGoals] = useState([]);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  
  // Substitutions state
  const [substitutions, setSubstitutions] = useState([]);
  const [showSubstitutionDialog, setShowSubstitutionDialog] = useState(false);
  const [selectedSubstitution, setSelectedSubstitution] = useState(null);
  
  // Cards state
  const [cards, setCards] = useState([]);
  const [showCardDialog, setShowCardDialog] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  
  // Difficulty assessment state
  const [difficultyAssessment, setDifficultyAssessment] = useState(null);
  
  // Timeline state (unified events for state reconstruction)
  const [timeline, setTimeline] = useState([]);
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [showPlayerPerfDialog, setShowPlayerPerfDialog] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerPerfData, setPlayerPerfData] = useState({});
  const [showFinalReportDialog, setShowFinalReportDialog] = useState(false);
  const [showPlayerSelectionDialog, setShowPlayerSelectionDialog] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [selectedPositionData, setSelectedPositionData] = useState(null);
  const [draggedPlayer, setDraggedPlayer] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [manualFormationMode, setManualFormationMode] = useState(false);
  
  // Team Summary Dialog state
  const [showTeamSummaryDialog, setShowTeamSummaryDialog] = useState(false);
  const [selectedSummaryType, setSelectedSummaryType] = useState(null);
  
  // Validation state
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    onConfirm: null,
    onCancel: null,
    type: "warning"
  });
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingPlayerPosition, setPendingPlayerPosition] = useState(null);

  // Autosave state
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [autosaveError, setAutosaveError] = useState(null);

  // Finalizing game state (for blocking modal)
  const [isFinalizingGame, setIsFinalizingGame] = useState(false);

  // Get current formation positions
  const positions = useMemo(() => formations[formationType]?.positions || {}, [formationType]);

  // Check if difficulty assessment feature is enabled
  const isDifficultyAssessmentEnabled = useFeature('gameDifficultyAssessmentEnabled', game?.team);

  // Load difficulty assessment
  useEffect(() => {
    if (!gameId || !isDifficultyAssessmentEnabled) return;

    const loadDifficultyAssessment = async () => {
      try {
        const assessment = await fetchDifficultyAssessment(gameId);
        setDifficultyAssessment(assessment);
      } catch (error) {
        console.error('Error fetching difficulty assessment:', error);
        // Silently fail - assessment might not exist yet
        setDifficultyAssessment(null);
      }
    };

    loadDifficultyAssessment();
  }, [gameId, isDifficultyAssessmentEnabled]);

  // Create efficient lookup map for player data
  const playerMap = useMemo(() => {
    const map = new Map();
    gamePlayers.forEach(player => {
      map.set(player._id, player);
    });
    return map;
  }, [gamePlayers]);

  // Load existing roster statuses (with draft priority)
  useEffect(() => {
    if (!gameId || !game || gamePlayers.length === 0) return;

    // 🔍 DEBUG: Log draft loading check
    console.log('🔍 [Draft Loading] Checking for draft:', {
      gameId,
      gameStatus: game.status,
      hasLineupDraft: !!game.lineupDraft,
      lineupDraft: game.lineupDraft,
      lineupDraftType: typeof game.lineupDraft,
      isScheduled: game.status === 'Scheduled',
      hasGamePlayers: gamePlayers.length > 0
    });

    // Priority 1: Check for draft (only for Scheduled games)
    if (game.status === 'Scheduled' && game.lineupDraft && typeof game.lineupDraft === 'object') {
      console.log('📋 Loading draft lineup:', game.lineupDraft);
      
      // Extract rosters and formation from draft
      const draftRosters = game.lineupDraft.rosters || game.lineupDraft; // Support both old and new format
      const draftFormation = game.lineupDraft.formation || {};
      const draftFormationType = game.lineupDraft.formationType || formationType;
      
      // Merge draft rosters with all players (ensure all players have a status)
      const draftStatuses = { ...draftRosters };
      gamePlayers.forEach((player) => {
        if (!draftStatuses[player._id]) {
          draftStatuses[player._id] = 'Not in Squad';
        }
      });
      
      // Restore formation from draft
      if (Object.keys(draftFormation).length > 0) {
        // Set manual mode FIRST to prevent auto-rebuild from interfering
        setManualFormationMode(true);
        
        // Rebuild formation object with full player objects from gamePlayers
        const restoredFormation = {};
        Object.keys(draftFormation).forEach((posId) => {
          const draftPlayer = draftFormation[posId];
          if (draftPlayer && draftPlayer._id) {
            // Find full player object from gamePlayers
            const fullPlayer = gamePlayers.find(p => p._id === draftPlayer._id);
            if (fullPlayer) {
              restoredFormation[posId] = fullPlayer;
            } else {
              console.warn(`⚠️ [Draft Loading] Player not found for position ${posId}:`, draftPlayer._id);
            }
          }
        });
        
        console.log('✅ Draft loaded, restoring formation:', {
          restoredFormation,
          positionCount: Object.keys(restoredFormation).length,
          playerIds: Object.values(restoredFormation).map(p => p._id)
        });
        setFormation(restoredFormation);
        setFormationType(draftFormationType);
      }
      
      console.log('✅ Draft loaded, setting roster statuses:', draftStatuses);
      setLocalRosterStatuses(draftStatuses);
      return; // Draft loaded, skip gameRosters
    }

    // 🔍 DEBUG: Log why draft wasn't loaded
    if (game.status === 'Scheduled') {
      console.log('⚠️ [Draft Loading] Scheduled game but no draft found:', {
        hasLineupDraft: !!game.lineupDraft,
        lineupDraft: game.lineupDraft,
        fallingBackTo: 'gameRosters or default'
      });
    }

    // Priority 2: Load from gameRosters (for Played/Done games, or if no draft)
    if (gameRosters && gameRosters.length > 0) {
      const rosterForGame = gameRosters.filter(
        (roster) => {
          const rosterGameId = typeof roster.game === "object" && roster.game !== null ? roster.game._id : roster.game;
          return rosterGameId === gameId;
        }
      );

      if (rosterForGame.length > 0) {
        const statuses = {};
        rosterForGame.forEach((roster) => {
          const playerId = typeof roster.player === "object" && roster.player !== null ? roster.player._id : roster.player;
          statuses[playerId] = roster.status;
        });
        setLocalRosterStatuses(statuses);
        return; // gameRosters loaded
      }
    }

    // Priority 3: Initialize all to "Not in Squad" (fallback)
    const initialStatuses = {};
    gamePlayers.forEach((player) => {
      initialStatuses[player._id] = "Not in Squad";
    });
    setLocalRosterStatuses(initialStatuses);
  }, [gameId, game, gameRosters, gamePlayers]);

  // Debounced autosave for roster statuses and formation
  useEffect(() => {
    // CRITICAL: Don't autosave if game is being finalized (prevents write conflicts)
    if (isFinalizingGame) {
      console.log('⏸️ [Autosave] Skipping - game is being finalized');
      return;
    }
    
    // Only autosave for Scheduled games
    if (!game || game.status !== 'Scheduled') return;
    
    // Don't autosave on initial load (wait for user changes)
    if (Object.keys(localRosterStatuses).length === 0) return;
    
    // Set autosaving state
    setIsAutosaving(true);
    setAutosaveError(null);
    
    // Debounce: Wait 2.5 seconds after last change
    const autosaveTimer = setTimeout(async () => {
      try {
        // Prepare formation data for draft (only include player IDs and basic info)
        const formationForDraft = {};
        Object.keys(formation).forEach((posId) => {
          const player = formation[posId];
          if (player && player._id) {
            formationForDraft[posId] = {
              _id: player._id,
              fullName: player.fullName,
              kitNumber: player.kitNumber
            };
          }
        });

        const response = await fetch(`http://localhost:3001/api/games/${gameId}/draft`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({
            rosters: localRosterStatuses,
            formation: formationForDraft,
            formationType: formationType
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `Failed to save draft: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Draft autosaved successfully:', result);
        setIsAutosaving(false);
      } catch (error) {
        console.error('❌ Error autosaving draft:', error);
        setAutosaveError(error.message);
        setIsAutosaving(false);
      }
    }, 2500); // 2.5 second debounce

    // Cleanup: Cancel timer if localRosterStatuses, formation, or finalization status changes
    return () => {
      clearTimeout(autosaveTimer);
    };
  }, [localRosterStatuses, formation, formationType, gameId, game, isFinalizingGame]);

  // Memoize report data for autosave to prevent unnecessary re-renders
  const reportDataForAutosave = useMemo(() => ({
    teamSummary,
    finalScore,
    matchDuration,
    playerReports: localPlayerReports,
    playerMatchStats: localPlayerMatchStats
  }), [teamSummary, finalScore, matchDuration, localPlayerReports, localPlayerMatchStats]);

  // NEW: Autosave for Played games (report draft)
  const { 
    isAutosaving: isAutosavingReport, 
    autosaveError: reportAutosaveError 
  } = useAutosave({
    data: reportDataForAutosave,
    endpoint: `http://localhost:3001/api/games/${gameId}/draft`,
    enabled: game?.status === 'Played' && !isFinalizingGame,
    debounceMs: 2500,
    shouldSkip: (data) => {
      // Skip if no meaningful data to save (use the data parameter passed to the hook)
      if (!data) return true;
      
      const hasTeamSummary = data.teamSummary && Object.values(data.teamSummary).some(v => v && v.trim());
      const hasFinalScore = data.finalScore && (data.finalScore.ourScore > 0 || data.finalScore.opponentScore > 0);
      const hasMatchDuration = data.matchDuration && (
        data.matchDuration.regularTime !== 90 || 
        data.matchDuration.firstHalfExtraTime > 0 || 
        data.matchDuration.secondHalfExtraTime > 0
      );
      const hasPlayerReports = data.playerReports && Object.keys(data.playerReports).length > 0;
      const hasPlayerMatchStats = data.playerMatchStats && Object.keys(data.playerMatchStats).length > 0;
      
      return !hasTeamSummary && !hasFinalScore && !hasMatchDuration && !hasPlayerReports && !hasPlayerMatchStats;
    }
  });

  // Load goals for the game
  useEffect(() => {
    if (!gameId || !game) return;
    
    const loadGoals = async () => {
      try {
        const goalsData = await fetchGoals(gameId);
        setGoals(goalsData);
      } catch (error) {
        console.error('Error fetching goals:', error);
      }
    };
    
    const loadSubstitutions = async () => {
      try {
        const subsData = await fetchSubstitutions(gameId);
        setSubstitutions(subsData);
      } catch (error) {
        console.error('Error fetching substitutions:', error);
      }
    };
    
    const loadCards = async () => {
      try {
        const cardsData = await fetchCards(gameId);
        setCards(cardsData);
      } catch (error) {
        console.error('Error fetching cards:', error);
      }
    };
    
    const loadTimeline = async () => {
      try {
        const timelineData = await fetchMatchTimeline(gameId);
        setTimeline(timelineData);
      } catch (error) {
        console.error('Error fetching timeline:', error);
        // Fallback: Build timeline from individual arrays if API fails
        setTimeline([]);
      }
    };
    
    loadGoals();
    loadSubstitutions();
    loadCards();
    loadTimeline();
  }, [gameId, game]);

  // Helper function to refresh team stats (used after goal/substitution changes)
  const refreshTeamStats = async () => {
    if (!gameId || !game || game.status !== 'Played') {
      return; // Only refresh for Played games
    }

    try {
      const stats = await fetchPlayerStats(gameId);
      setTeamStats(stats);
      console.log('✅ Refreshed team stats for', Object.keys(stats).length, 'players');
    } catch (error) {
      console.error('Error refreshing team stats:', error);
      // Don't set error state - dialog will fallback to existing stats
    }
  };

  // Pre-fetch player stats for Played and Done games (for instant dialog display)
  useEffect(() => {
    if (!gameId || !game || (game.status !== 'Played' && game.status !== 'Done')) {
      // Clear stats if game is not Played or Done
      setTeamStats({});
      setLocalPlayerMatchStats({});
      return;
    }

    const loadTeamStats = async () => {
      setIsLoadingTeamStats(true);
      try {
        const stats = await fetchPlayerStats(gameId);
        setTeamStats(stats);
        console.log('✅ Pre-fetched team stats for', Object.keys(stats).length, 'players');
      } catch (error) {
        console.error('Error pre-fetching team stats:', error);
        // Don't set error state - dialog will fallback to 0/0/0
        setTeamStats({});
      } finally {
        setIsLoadingTeamStats(false);
      }
    };

    const loadPlayerMatchStats = async () => {
      try {
        console.log(`🔍 [loadPlayerMatchStats] Loading stats for game ${gameId} (status: ${game.status})`);
        const matchStats = await fetchPlayerMatchStats(gameId);
        console.log(`📊 [loadPlayerMatchStats] Received ${matchStats.length} stat records from API`);
        const statsMap = {};
        matchStats.forEach(stat => {
          const playerId = typeof stat.playerId === 'object' ? stat.playerId._id : stat.playerId;
          // Map to new nested structure with ratings (direct mapping, no conversion needed)
          statsMap[playerId] = {
            fouls: {
              committedRating: stat.fouls?.committedRating || 0,
              receivedRating: stat.fouls?.receivedRating || 0
            },
            shooting: {
              volumeRating: stat.shooting?.volumeRating || 0,
              accuracyRating: stat.shooting?.accuracyRating || 0
            },
            passing: {
              volumeRating: stat.passing?.volumeRating || 0,
              accuracyRating: stat.passing?.accuracyRating || 0,
              keyPassesRating: stat.passing?.keyPassesRating || 0
            },
            duels: {
              involvementRating: stat.duels?.involvementRating || 0,
              successRating: stat.duels?.successRating || 0
            }
          };
          // Debug: Log non-zero stats
          const hasNonZeroStats = 
            (stat.fouls?.committedRating || 0) > 0 ||
            (stat.fouls?.receivedRating || 0) > 0 ||
            (stat.shooting?.volumeRating || 0) > 0 ||
            (stat.shooting?.accuracyRating || 0) > 0 ||
            (stat.passing?.volumeRating || 0) > 0 ||
            (stat.passing?.accuracyRating || 0) > 0 ||
            (stat.passing?.keyPassesRating || 0) > 0 ||
            (stat.duels?.involvementRating || 0) > 0 ||
            (stat.duels?.successRating || 0) > 0;
          if (hasNonZeroStats) {
            console.log(`  ✅ Player ${playerId}:`, statsMap[playerId]);
          }
        });
        // MERGE with existing stats instead of replacing (preserve draft data)
        setLocalPlayerMatchStats(prev => ({
          ...prev, // Keep existing draft stats
          ...statsMap // API stats override for players that have saved stats
        }));
      } catch (error) {
        console.error('❌ Error pre-fetching player match stats:', error);
        setLocalPlayerMatchStats({});
      }
    };

    loadTeamStats();
    loadPlayerMatchStats();
  }, [gameId, game?.status]); // Re-fetch if game status changes

  // Calculate score from goals when goals are loaded or changed
  useEffect(() => {
    if (!goals || goals.length === 0) {
      // If no goals, keep the score from game data or default to 0-0
      return;
    }

    // Calculate score from goals array
    let teamGoalsCount = 0;
    let opponentGoalsCount = 0;

    goals.forEach(goal => {
      // Check if it's an opponent goal by checking goalCategory discriminator
      if (goal.goalCategory === 'OpponentGoal' || goal.isOpponentGoal) {
        opponentGoalsCount++;
      } else {
        // It's a team goal
        teamGoalsCount++;
      }
    });

    // Update score state
    setFinalScore(prev => {
      // Only update if the calculated score is different from current
      // This prevents unnecessary re-renders
      if (prev.ourScore !== teamGoalsCount || prev.opponentScore !== opponentGoalsCount) {
        return {
          ourScore: teamGoalsCount,
          opponentScore: opponentGoalsCount
        };
      }
      return prev;
    });
  }, [goals]);

  // Load existing game reports
  useEffect(() => {
    // 🔍 DEBUG: Log gameReports loading
    console.log('🔍 [GameDetails] Loading game reports:', {
      hasGameId: !!gameId,
      gameId,
      hasGameReports: !!gameReports,
      gameReportsLength: gameReports?.length || 0,
      gameReportsType: typeof gameReports,
      isLoading,
      isArray: Array.isArray(gameReports)
    });
    
    // Wait for data to load
    if (isLoading) {
      console.log('🔍 [GameDetails] Still loading data, skipping reports load');
      return;
    }
    
    if (!gameId) {
      console.log('🔍 [GameDetails] Skipping game reports load - no gameId');
      return;
    }
    
    // gameReports might be empty array, which is valid (no reports exist yet)
    // But it must be an array, not undefined
    if (!gameReports || !Array.isArray(gameReports)) {
      console.log('🔍 [GameDetails] Skipping game reports load - gameReports not available or not array');
      return;
    }

    const reportsForGame = gameReports.filter((report) => {
      const reportGameId = typeof report.game === "object" && report.game !== null ? report.game._id : report.game;
      return reportGameId === gameId;
    });

    // 🔍 DEBUG: Log filtered reports
    console.log('🔍 [GameDetails] Reports for game:', {
      totalReports: gameReports.length,
      reportsForGame: reportsForGame.length,
      reportIds: reportsForGame.map(r => r._id)
    });

    if (reportsForGame.length > 0) {
      const reports = {};
      reportsForGame.forEach((report) => {
        const playerId = typeof report.player === "object" && report.player !== null ? report.player._id : report.player;
        reports[playerId] = {
          // User-editable fields
          rating_physical: report.rating_physical !== undefined ? report.rating_physical : (report.rating || 3),
          rating_technical: report.rating_technical !== undefined ? report.rating_technical : (report.rating || 3),
          rating_tactical: report.rating_tactical !== undefined ? report.rating_tactical : (report.rating || 3),
          rating_mental: report.rating_mental !== undefined ? report.rating_mental : (report.rating || 3),
          notes: report.notes !== undefined ? report.notes : "",
          // Server-calculated fields (for display only, not sent to server)
          // Use !== undefined to preserve 0 values
          minutesPlayed: report.minutesPlayed !== undefined ? report.minutesPlayed : 0,
          goals: report.goals !== undefined ? report.goals : 0,
          assists: report.assists !== undefined ? report.assists : 0,
        };
      });
      
      // 🔍 DEBUG: Log loaded reports
      const sampleReport = Object.values(reports)[0];
      console.log('🔍 [GameDetails] Setting localPlayerReports:', {
        reportCount: Object.keys(reports).length,
        playerIds: Object.keys(reports),
        sampleReport,
        sampleReportKeys: sampleReport ? Object.keys(sampleReport) : [],
        sampleReportMinutesPlayed: sampleReport?.minutesPlayed,
        sampleReportGoals: sampleReport?.goals,
        sampleReportAssists: sampleReport?.assists,
        rawReportData: reportsForGame[0] // Show raw data from database
      });
      
      setLocalPlayerReports(reports);
    } else {
      console.log('🔍 [GameDetails] No reports found for this game');
    }
  }, [gameId, gameReports, isLoading]);

  // Load report draft for Played games (similar to lineup draft loading)
  // Note: Done games don't have drafts, but we still need to load saved stats
  useEffect(() => {
    if (!gameId || !game || (game.status !== 'Played' && game.status !== 'Done')) return;

    console.log('🔍 [Report Draft Loading] Checking for draft:', {
      gameId,
      gameStatus: game.status,
      hasReportDraft: !!game.reportDraft,
      reportDraft: game.reportDraft,
      reportDraftType: typeof game.reportDraft
    });

    // Priority 1: Check for draft
    if (game.reportDraft && typeof game.reportDraft === 'object') {
      const draft = game.reportDraft;
      console.log('📋 Loading report draft:', draft);

      // Merge draft with existing state (draft overrides saved)
      if (draft.teamSummary) {
        setTeamSummary(prev => ({
          ...prev,
          ...draft.teamSummary // Draft fields override saved fields
        }));
      }

      if (draft.finalScore) {
        setFinalScore(prev => ({
          ...prev,
          ...draft.finalScore // Draft fields override saved fields
        }));
      }

      if (draft.matchDuration) {
        setMatchDuration(prev => ({
          ...prev,
          ...draft.matchDuration // Draft fields override saved fields
        }));
      }

      if (draft.playerReports) {
        setLocalPlayerReports(prev => ({
          ...prev,
          ...draft.playerReports // Draft reports override saved reports
        }));
      }

      if (draft.playerMatchStats) {
        // Merge draft stats with existing stats (draft overrides saved stats for each player)
        setLocalPlayerMatchStats(prev => ({
          ...prev,
          ...draft.playerMatchStats // Draft match stats override saved stats
        }));
      }

      console.log('✅ Report draft loaded and merged with saved data');
      return; // Draft loaded
    }

    // Priority 2: For Done games, stats are loaded from PlayerMatchStat collection via loadPlayerMatchStats
    // For Played games without draft, stats will be loaded by loadPlayerMatchStats
    if (game.status === 'Done') {
      console.log('✅ [Done Game] Stats will be loaded from PlayerMatchStat collection (via loadPlayerMatchStats)');
    } else {
      console.log('⚠️ [Report Draft Loading] No draft found, stats will be loaded from PlayerMatchStat collection');
    }
  }, [gameId, game]);

  // Auto-build formation from roster (only when NOT in manual mode)
  useEffect(() => {
    console.log('🔍 [Formation Rebuild] Effect triggered:', {
      hasGamePlayers: !!gamePlayers,
      gamePlayersCount: gamePlayers?.length || 0,
      hasRosterStatuses: !!localRosterStatuses,
      rosterStatusesCount: localRosterStatuses ? Object.keys(localRosterStatuses).length : 0,
      manualFormationMode,
      currentFormationCount: Object.values(formation).filter(p => p !== null).length
    });

    if (!gamePlayers || gamePlayers.length === 0) {
      console.log('⚠️ [Formation Rebuild] Skipping - no game players');
      return;
    }
    if (!localRosterStatuses || Object.keys(localRosterStatuses).length === 0) {
      console.log('⚠️ [Formation Rebuild] Skipping - no roster statuses');
      return;
    }
    
    // Only skip auto-build if we already have a formation with players AND we're in manual mode
    // OR if we're in manual mode (which means we're restoring from draft or user manually set it)
    const hasFormationWithPlayers = Object.values(formation).some(p => p !== null);
    if (manualFormationMode) {
      if (hasFormationWithPlayers) {
        console.log('⚠️ [Formation Rebuild] Manual formation mode with existing formation - skipping auto-build');
      } else {
        console.log('⚠️ [Formation Rebuild] Manual formation mode active (likely restoring from draft) - skipping auto-build');
      }
      return;
    }

    console.log('🤖 [Formation Rebuild] Auto-building formation from roster...');
    const newFormation = {};
    const startingPlayers = gamePlayers.filter(player => localRosterStatuses[player._id] === "Starting Lineup");
    
    console.log('🔍 [Formation Rebuild] Starting players:', {
      count: startingPlayers.length,
      players: startingPlayers.map(p => ({ name: p.fullName, position: p.position, id: p._id }))
    });
    
    Object.entries(positions).forEach(([posId, posData]) => {
      const matchingPlayer = startingPlayers.find((player) => {
        const notYetPlaced = !Object.values(newFormation).some((p) => p?._id === player._id);
        const positionMatch = player.position === posData.type || player.position === posData.label;
        return notYetPlaced && positionMatch;
      });

      if (matchingPlayer) {
        newFormation[posId] = matchingPlayer;
        console.log(`✅ [Formation Rebuild] Assigned ${matchingPlayer.fullName} to ${posId} (${posData.label})`);
      } else {
        newFormation[posId] = null;
      }
    });

    const assignedCount = Object.values(newFormation).filter(p => p !== null).length;
    console.log(`✅ [Formation Rebuild] Complete - ${assignedCount} players assigned to positions`);
    setFormation(newFormation);
    // Reset manual mode after rebuilding so it can rebuild again if needed
    if (hasFormationWithPlayers) {
      setManualFormationMode(false);
    }
  }, [positions, gamePlayers, localRosterStatuses]);

  // Helper: Get player status
  const getPlayerStatus = (playerId) => {
    return localRosterStatuses[playerId] || "Not in Squad";
  };

  // Helper: Update player status (local state only - autosave handled by useEffect)
  const updatePlayerStatus = (playerId, newStatus) => {
    // ✅ Only update local state - no API call
    // Autosave will be triggered by useEffect watching localRosterStatuses
    setLocalRosterStatuses((prev) => ({ ...prev, [playerId]: newStatus }));
  };

  // Helper: Players grouped by status
  const playersOnPitch = useMemo(() => {
    return Object.values(formation).filter((player) => player !== null);
  }, [formation]);

  const benchPlayers = useMemo(() => {
    return gamePlayers.filter((player) => {
      const status = getPlayerStatus(player._id);
      return status === "Bench";
    });
  }, [gamePlayers, localRosterStatuses]);

  const squadPlayers = useMemo(() => {
    return gamePlayers.filter((player) => {
      const status = getPlayerStatus(player._id);
      const isOnPitch = playersOnPitch.some((p) => p._id === player._id);
      const isBench = status === "Bench";
      return !isOnPitch && !isBench;
    });
  }, [gamePlayers, playersOnPitch, localRosterStatuses]);

  // Active game players (lineup + bench) - only these can score/assist
  const activeGamePlayers = useMemo(() => {
    return [...playersOnPitch, ...benchPlayers];
  }, [playersOnPitch, benchPlayers]);

  // Build starting lineup map for game state reconstruction
  const startingLineupMap = useMemo(() => {
    const map = {};
    gamePlayers.forEach(player => {
      const status = getPlayerStatus(player._id);
      if (status === 'Starting Lineup') {
        map[player._id] = true;
      }
    });
    return map;
  }, [gamePlayers, localRosterStatuses]);

  // Build squad players map for game state reconstruction
  const squadPlayersMap = useMemo(() => {
    const map = {};
    gamePlayers.forEach(player => {
      const status = getPlayerStatus(player._id);
      if (status === 'Starting Lineup' || status === 'Bench') {
        map[player._id] = status;
      }
    });
    return map;
  }, [gamePlayers, localRosterStatuses]);

  // Helper: Check if player has report
  const hasReport = (playerId) => {
    return localPlayerReports[playerId] !== undefined && localPlayerReports[playerId].rating_physical !== undefined;
  };

  // Helper: Check if player needs report
  const needsReport = (playerId) => {
    const status = getPlayerStatus(playerId);
    return (status === "Starting Lineup" || status === "Bench") && !hasReport(playerId);
  };

  // Helper: Count missing reports
  const missingReportsCount = useMemo(() => {
    let count = 0;
    gamePlayers.forEach((player) => {
      if (needsReport(player._id)) count++;
    });
    return count;
  }, [gamePlayers, localRosterStatuses, localPlayerReports]);

  // Helper: Match stats from reports
  const matchStats = useMemo(() => {
    const scorerMap = new Map();
    const assisterMap = new Map();
    let topRated = null;
    let maxRating = 0;

    // Calculate scorers and assists from goals array (excluding opponent goals)
    (goals || []).forEach((goal) => {
      // Skip opponent goals
      if (goal.goalCategory === 'OpponentGoal' || goal.isOpponentGoal) return;

      // Count scorers
      if (goal.scorerId && goal.scorerId._id) {
        const scorerId = goal.scorerId._id;
        const scorerName = goal.scorerId.fullName || goal.scorerId.name || 'Unknown';
        scorerMap.set(scorerId, {
          name: scorerName,
          count: (scorerMap.get(scorerId)?.count || 0) + 1
        });
      }

      // Count assisters
      if (goal.assistedById && goal.assistedById._id) {
        const assisterId = goal.assistedById._id;
        const assisterName = goal.assistedById.fullName || goal.assistedById.name || 'Unknown';
        assisterMap.set(assisterId, {
          name: assisterName,
          count: (assisterMap.get(assisterId)?.count || 0) + 1
        });
      }
    });

    // Calculate top rated player from reports (using average of four ratings)
    Object.entries(localPlayerReports).forEach(([playerId, report]) => {
      const player = gamePlayers.find((p) => p._id === playerId);
      if (!player) return;

      const avgRating = (report.rating_physical + report.rating_technical + report.rating_tactical + report.rating_mental) / 4;
      if (avgRating > maxRating) {
        maxRating = avgRating;
        topRated = player.fullName;
      }
    });

    return { 
      scorers: Array.from(scorerMap.values()),
      assists: Array.from(assisterMap.values()),
      topRated 
    };
  }, [goals, localPlayerReports, gamePlayers]);

  // Handlers
  // Validation handlers
  const showConfirmation = (config) => {
    setConfirmationConfig(config);
    setShowConfirmationModal(true);
  };

  const handleConfirmation = () => {
    if (confirmationConfig.onConfirm) {
      confirmationConfig.onConfirm();
    }
    setShowConfirmationModal(false);
  };

  const handleConfirmationCancel = () => {
    if (confirmationConfig.onCancel) {
      confirmationConfig.onCancel();
    }
    setShowConfirmationModal(false);
  };

  // Difficulty assessment handlers
  const handleSaveDifficultyAssessment = async (assessment) => {
    try {
      const updated = await updateDifficultyAssessment(gameId, assessment);
      setDifficultyAssessment(updated);
      toast({
        title: "Success",
        description: "Difficulty assessment saved successfully",
      });
    } catch (error) {
      console.error('Error saving difficulty assessment:', error);
      toast({
        title: "Error",
        description: "Failed to save difficulty assessment",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteDifficultyAssessment = async () => {
    try {
      await deleteDifficultyAssessment(gameId);
      setDifficultyAssessment(null);
      toast({
        title: "Success",
        description: "Difficulty assessment deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting difficulty assessment:', error);
      toast({
        title: "Error",
        description: "Failed to delete difficulty assessment",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Helper function to check bench validation and proceed
  const checkBenchAndProceed = async (squadValidation) => {
    // Check bench size and show confirmation if needed
    if (squadValidation.needsConfirmation) {
      setPendingAction(() => executeGameWasPlayed);
      showConfirmation({
        title: "Bench Size Warning",
        message: squadValidation.bench.confirmationMessage,
        confirmText: "Continue",
        cancelText: "Go Back",
        onConfirm: () => executeGameWasPlayed(),
        onCancel: () => {},
        type: "warning"
      });
      return;
    }
    
    // If no bench warning needed, proceed directly
    await executeGameWasPlayed();
  };

  // Validated game was played handler
  const handleGameWasPlayed = async () => {
    if (!game) return;
    
    // Run squad validation
    console.log('🔍 Validation inputs:', {
      formation: Object.keys(formation).length,
      benchPlayers: benchPlayers.length,
      benchPlayersList: benchPlayers.map(p => p.fullName)
    });
    const squadValidation = validateSquad(formation, benchPlayers, localRosterStatuses);
    console.log('🔍 Validation result:', squadValidation);
    
    // Check if starting lineup is valid (mandatory 11 players)
    if (!squadValidation.startingLineup.isValid) {
      showConfirmation({
        title: "Invalid Starting Lineup",
        message: `❌ Cannot mark game as played: ${squadValidation.startingLineup.message}`,
        confirmText: "OK",
        cancelText: null,
        onConfirm: () => setShowConfirmationModal(false),
        onCancel: null,
        type: "warning"
      });
      return;
    }
    
    // Check if goalkeeper is assigned
    if (!squadValidation.goalkeeper.hasGoalkeeper) {
      showConfirmation({
        title: "Missing Goalkeeper",
        message: `❌ Cannot mark game as played: ${squadValidation.goalkeeper.message}`,
        confirmText: "OK",
        cancelText: null,
        onConfirm: () => setShowConfirmationModal(false),
        onCancel: null,
        type: "warning"
      });
      return;
    }
    
    // Check if difficulty assessment is incomplete (if feature is enabled)
    if (isDifficultyAssessmentEnabled && (!difficultyAssessment || !difficultyAssessment.overallScore)) {
      showConfirmation({
        title: "Difficulty Assessment Not Completed",
        message: "⚠️ You haven't completed the difficulty assessment for this game. The assessment helps analyze team performance relative to game difficulty.\n\nDo you want to continue without completing it?",
        confirmText: "Continue Anyway",
        cancelText: "Go Back",
        onConfirm: () => checkBenchAndProceed(squadValidation),
        onCancel: () => {},
        type: "warning"
      });
      return;
    }
    
    // If difficulty assessment is complete (or feature disabled), check bench validation
    await checkBenchAndProceed(squadValidation);
  };

  // Execute the actual game was played logic (atomic operation)
  const executeGameWasPlayed = async () => {
    setIsFinalizingGame(true); // Show blocking modal
    setIsSaving(true);
    try {
      // ✅ Single atomic call: Start game with lineup
      // Backend expects rosters as object: { playerId: status }
      const rostersObject = {};
      gamePlayers.forEach((player) => {
        const status = getPlayerStatus(player._id);
        if (status !== 'Not in Squad') {
          rostersObject[player._id] = status;
        }
      });

      // Clean formation: remove null/empty positions and keep only valid player IDs
      const cleanFormation = {};
      Object.entries(formation).forEach(([position, player]) => {
        if (player && player._id && player._id !== '0') {
          cleanFormation[position] = player._id;
        }
      });

      console.log('🔍 Starting game with roster:', {
        gameId,
        rosterCount: Object.keys(rostersObject).length,
        startingLineupCount: Object.values(rostersObject).filter(s => s === 'Starting Lineup').length,
        benchCount: Object.values(rostersObject).filter(s => s === 'Bench').length,
        formationPositions: Object.keys(cleanFormation).length
      });

      const response = await fetch(`http://localhost:3001/api/games/${gameId}/start-game`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ 
          rosters: rostersObject,
          formation: cleanFormation,
          formationType: formationType
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to start game: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Game started successfully:', result);

      // ✅ Step 1: Update game state from response (DEFENSIVE MERGE - preserve all existing fields)
      // The backend only returns minimal game data (_id, status, gameTitle, lineupDraft)
      // We must preserve other fields like reports, teamSummary, finalScore, matchDuration, etc.
      if (result.data?.game) {
        // Prepare the updated game object for both local and global state
        const updatedGameData = {
          _id: result.data.game._id,
          status: result.data.game.status, // Explicitly set status to "Played"
          lineupDraft: result.data.game.lineupDraft ?? null, // Clear draft
        };
        
        // Only include gameTitle if provided
        if (result.data.game.gameTitle) {
          updatedGameData.gameTitle = result.data.game.gameTitle;
        }

        // Update local state (defensive merge)
        setGame((prev) => {
          if (!prev) {
            console.warn('⚠️ [State Update] No previous game state, using response data only');
            return updatedGameData;
          }

          const updated = {
            ...prev, // Preserve all existing fields (reports, teamSummary, etc.)
            ...updatedGameData, // Override with new data
          };
          
          console.log('✅ [State Update] Local game state updated (defensive merge):', {
            status: updated.status,
            lineupDraft: updated.lineupDraft,
            preservedFields: {
              hasReports: !!prev.reports,
              hasTeamSummary: !!prev.teamSummary,
              hasFinalScore: !!prev.finalScore,
              hasMatchDuration: !!prev.matchDuration,
            }
          });
          
          return updated;
        });

        // ✅ NEW: Update global DataProvider cache immediately (without full refresh)
        const existingGameInCache = games.find(g => g._id === result.data.game._id);
        updateGameInCache({
          ...(existingGameInCache || {}), // Preserve existing fields from cache if available
          ...updatedGameData, // Override with new data
        });
        console.log('✅ [State Update] Global cache updated via updateGameInCache');
      } else {
        // Fallback: If response missing game data, just update status and clear draft
        console.warn('⚠️ Response missing game data, updating status and draft only');
        setGame((prev) => {
          const fallbackUpdate = { 
            ...prev, 
            status: "Played",
            lineupDraft: null // Clear draft
          };
          
          // Also update global cache
          if (prev?._id) {
            const existingGameInCache = games.find(g => g._id === prev._id);
            updateGameInCache({
              ...(existingGameInCache || {}), // Preserve existing fields from cache if available
              _id: prev._id,
              status: "Played",
              lineupDraft: null,
            });
          }
          
          return fallbackUpdate;
        });
      }

      // ✅ Step 2: Update localRosterStatuses directly from response rosters
      if (result.data?.rosters && Array.isArray(result.data.rosters)) {
        const statuses = {};
        
        // Extract statuses from response rosters
        result.data.rosters.forEach((roster) => {
          const playerId = typeof roster.player === "object" 
            ? roster.player._id 
            : roster.player;
          statuses[playerId] = roster.status;
        });
        
        // Ensure all gamePlayers have a status (default to "Not in Squad" if missing)
        gamePlayers.forEach((player) => {
          if (!statuses[player._id]) {
            statuses[player._id] = "Not in Squad";
          }
        });
        
        console.log('✅ Updated roster statuses from response:', {
          rosterCount: result.data.rosters.length,
          statusesCount: Object.keys(statuses).length,
          statuses
        });
        
        setLocalRosterStatuses(statuses);

        // ✅ NEW: Update global gameRosters cache immediately
        updateGameRostersInCache(result.data.rosters, gameId);
        console.log('✅ [State Update] Global gameRosters cache updated');
      } else {
        // Fallback: If response missing rosters, initialize all to "Not in Squad"
        console.warn('⚠️ Response missing rosters data, initializing all to "Not in Squad"');
        const initialStatuses = {};
        gamePlayers.forEach((player) => {
          initialStatuses[player._id] = "Not in Squad";
        });
        setLocalRosterStatuses(initialStatuses);
      }
    } catch (error) {
      console.error("Error starting game:", error);
      showConfirmation({
        title: "Error",
        message: error.message || "Failed to start game. Please try again.",
        confirmText: "OK",
        cancelText: null,
        onConfirm: () => setShowConfirmationModal(false),
        onCancel: null,
        type: "error"
      });
    } finally {
      setIsSaving(false);
      setIsFinalizingGame(false); // Hide blocking modal
    }
  };

  const handlePostpone = async () => {
    if (!game) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`http://localhost:3001/api/games/${gameId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ status: "Postponed" }),
      });

      if (!response.ok) throw new Error("Failed to postpone game");

      await refreshData();
      window.location.href = "/GamesSchedule";
    } catch (error) {
      console.error("Error postponing game:", error);
      showConfirmation({
        title: "Error",
        message: "Failed to postpone game",
        confirmText: "OK",
        cancelText: null,
        onConfirm: () => setShowConfirmationModal(false),
        onCancel: null,
        type: "warning"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPerformanceDialog = (player) => {
    setSelectedPlayer(player);
    const existingReport = localPlayerReports[player._id] || {};
    
    // Get pre-fetched stats for this player (if available)
    const playerStats = teamStats[player._id] || {};
    
    // Debug logging for "Done" games
    if (game?.status === 'Done') {
      console.log('🔍 [GameDetails] Opening dialog for Done game:', {
        playerId: player._id,
        playerName: player.fullName,
        existingReport,
        existingReportKeys: Object.keys(existingReport),
        minutesPlayedValue: existingReport.minutesPlayed,
        goalsValue: existingReport.goals,
        assistsValue: existingReport.assists,
        hasMinutesPlayed: existingReport.minutesPlayed !== undefined,
        hasGoals: existingReport.goals !== undefined,
        hasAssists: existingReport.assists !== undefined,
        localPlayerReportsKeys: Object.keys(localPlayerReports),
        sampleLocalReport: localPlayerReports[Object.keys(localPlayerReports)[0]],
        sampleLocalReportKeys: localPlayerReports[Object.keys(localPlayerReports)[0]] ? Object.keys(localPlayerReports[Object.keys(localPlayerReports)[0]]) : []
      });
    }
    
    // Get stats from localPlayerMatchStats (draft or saved)
    const playerMatchStat = localPlayerMatchStats[player._id] || {};
    
    console.log('🔍 [handleOpenPerformanceDialog] Stats check:', {
      playerId: player._id,
      playerName: player.fullName,
      hasLocalPlayerMatchStats: Object.keys(localPlayerMatchStats).length > 0,
      playerMatchStatKeys: Object.keys(playerMatchStat),
      playerMatchStat,
      gameStatus: game?.status
    });
    
    const playerPerfDataToSet = {
      // User-editable fields
      rating_physical: existingReport.rating_physical || 3,
      rating_technical: existingReport.rating_technical || 3,
      rating_tactical: existingReport.rating_tactical || 3,
      rating_mental: existingReport.rating_mental || 3,
      notes: existingReport.notes || "",
      // Stats from PlayerMatchStat (draftable) - nested structure
      stats: {
        fouls: {
          committedRating: playerMatchStat.fouls?.committedRating || 0,
          receivedRating: playerMatchStat.fouls?.receivedRating || 0
        },
        shooting: {
          volumeRating: playerMatchStat.shooting?.volumeRating || 0,
          accuracyRating: playerMatchStat.shooting?.accuracyRating || 0
        },
        passing: {
          volumeRating: playerMatchStat.passing?.volumeRating || 0,
          accuracyRating: playerMatchStat.passing?.accuracyRating || 0,
          keyPassesRating: playerMatchStat.passing?.keyPassesRating || 0
        },
        duels: {
          involvementRating: playerMatchStat.duels?.involvementRating || 0,
          successRating: playerMatchStat.duels?.successRating || 0
        }
      },
      // Server-calculated fields (from pre-fetched stats or existing report)
      minutesPlayed: playerStats.minutes !== undefined 
        ? playerStats.minutes 
        : (existingReport.minutesPlayed !== undefined ? existingReport.minutesPlayed : 0),
      goals: playerStats.goals !== undefined 
        ? playerStats.goals 
        : (existingReport.goals !== undefined ? existingReport.goals : 0),
      assists: playerStats.assists !== undefined 
        ? playerStats.assists 
        : (existingReport.assists !== undefined ? existingReport.assists : 0),
    };
    
    console.log('🔍 [GameDetails] Opening dialog with pre-fetched stats:', {
      playerId: player._id,
      playerName: player.fullName,
      playerStats,
      playerPerfData: playerPerfDataToSet
    });
    
    setPlayerPerfData(playerPerfDataToSet);
    setShowPlayerPerfDialog(true);
  };

  const handleSavePerformanceReport = async () => {
    if (!selectedPlayer) return;

    // Save ratings and notes to localPlayerReports
    setLocalPlayerReports((prev) => ({
      ...prev,
      [selectedPlayer._id]: {
        rating_physical: playerPerfData.rating_physical,
        rating_technical: playerPerfData.rating_technical,
        rating_tactical: playerPerfData.rating_tactical,
        rating_mental: playerPerfData.rating_mental,
        notes: playerPerfData.notes || null,
      },
    }));

    // Save stats to localPlayerMatchStats (will be autosaved to draft)
    setLocalPlayerMatchStats((prev) => ({
      ...prev,
      [selectedPlayer._id]: playerPerfData.stats || {},
    }));

    try {
      // Build payload: ONLY user-editable fields
      const reportPayload = {
        playerId: selectedPlayer._id,
        rating_physical: playerPerfData.rating_physical,
        rating_technical: playerPerfData.rating_technical,
        rating_tactical: playerPerfData.rating_tactical,
        rating_mental: playerPerfData.rating_mental,
        notes: playerPerfData.notes || null,
      };
      
      // DO NOT send: minutesPlayed, goals, assists (server calculates)
      // DO NOT send: foulsCommitted, foulsReceived (saved to draft, will be saved on final submission)

      const response = await fetch(`http://localhost:3001/api/game-reports/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          gameId,
          reports: [reportPayload],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to save performance report:", errorData.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error saving performance report:", error);
    }

    setShowPlayerPerfDialog(false);
    setSelectedPlayer(null);
  };

  // Calculate remaining players without reports (for Auto-Fill button)
  const remainingReportsCount = useMemo(() => {
    if (!gamePlayers || gamePlayers.length === 0) return 0;
    if (game?.status !== 'Played') return 0; // Only show for Played games
    
    const playersWithReports = Object.keys(localPlayerReports).length;
    const totalPlayers = gamePlayers.length;
    return Math.max(0, totalPlayers - playersWithReports);
  }, [gamePlayers, localPlayerReports, game?.status]);

  // Auto-fill remaining reports with default values
  const handleAutoFillRemaining = () => {
    if (!gamePlayers || gamePlayers.length === 0) return;
    if (game?.status !== 'Played') return;

    // Identify players without reports
    const playersWithoutReports = gamePlayers.filter(
      player => !localPlayerReports[player._id]
    );

    if (playersWithoutReports.length === 0) {
      toast({
        title: "No players to fill",
        description: "All players already have reports.",
        variant: "default",
      });
      return;
    }

    // Define default report object
    const defaultReport = {
      rating_physical: 3,
      rating_technical: 3,
      rating_tactical: 3,
      rating_mental: 3,
      notes: "Did not play / No specific observations.",
    };

    // Create reports for all missing players
    const newReports = {};
    playersWithoutReports.forEach(player => {
      newReports[player._id] = defaultReport;
    });

    // Merge with existing reports
    setLocalPlayerReports(prev => ({
      ...prev,
      ...newReports
    }));

    // Show success toast
    toast({
      title: "Reports auto-filled",
      description: `Applied default reports to ${playersWithoutReports.length} player${playersWithoutReports.length > 1 ? 's' : ''}.`,
      variant: "default",
    });
  };

  const handleSubmitFinalReport = async () => {
    // Use comprehensive validation for "Played" status
    const validation = validatePlayedStatus();
    
    if (validation.hasErrors) {
      showConfirmation({
        title: "Validation Errors",
        message: validation.messages.join("\n\n"),
        confirmText: "OK",
        cancelText: null,
        onConfirm: () => setShowConfirmationModal(false),
        onCancel: null,
        type: "error"
      });
      return;
    }

    if (validation.needsConfirmation) {
      showConfirmation({
        title: "Confirmation Required",
        message: validation.confirmationMessage,
        confirmText: "Continue",
        cancelText: "Cancel",
        onConfirm: () => {
          setShowConfirmationModal(false);
          setShowFinalReportDialog(true);
        },
        onCancel: () => setShowConfirmationModal(false),
        type: "warning"
      });
      return;
    }

    setShowFinalReportDialog(true);
  };

  const handleConfirmFinalSubmission = async () => {
    setIsSaving(true);
    try {
      // 🔍 DEBUG: Log what we're sending
      const requestBody = {
        status: "Done",
        ourScore: finalScore.ourScore,
        opponentScore: finalScore.opponentScore,
        matchDuration: matchDuration,
        defenseSummary: teamSummary.defenseSummary,
        midfieldSummary: teamSummary.midfieldSummary,
        attackSummary: teamSummary.attackSummary,
        generalSummary: teamSummary.generalSummary,
      };
      
      console.log('🔍 [GameDetails] Sending final report submission:', {
        gameId,
        matchDuration: requestBody.matchDuration,
        matchDurationType: typeof requestBody.matchDuration,
        matchDurationKeys: requestBody.matchDuration ? Object.keys(requestBody.matchDuration) : null,
        matchDurationValue: JSON.stringify(requestBody.matchDuration),
        fullRequestBody: requestBody
      });
      
      const gameResponse = await fetch(`http://localhost:3001/api/games/${gameId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(requestBody),
      });

      // 🔍 DEBUG: Log response
      const responseData = await gameResponse.json();
      console.log('🔍 [GameDetails] Backend response:', {
        ok: gameResponse.ok,
        status: gameResponse.status,
        responseData: responseData,
        gameMatchDuration: responseData?.data?.matchDuration,
        savedMatchDuration: responseData?.data?.matchDuration
      });
      
      if (!gameResponse.ok) {
        // Try to extract error message from response
        let errorMessage = "Failed to update game";
        try {
          const errorData = responseData;
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = `Failed to update game: ${gameResponse.status} ${gameResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Build report updates: ONLY user-editable fields
      const reportUpdates = Object.entries(localPlayerReports).map(([playerId, report]) => ({
        playerId,
        rating_physical: report.rating_physical || 3,
        rating_technical: report.rating_technical || 3,
        rating_tactical: report.rating_tactical || 3,
        rating_mental: report.rating_mental || 3,
        notes: report.notes || null,
        // DO NOT send: minutesPlayed, goals, assists (server calculates)
      }));

      const reportsResponse = await fetch(`http://localhost:3001/api/game-reports/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ gameId, reports: reportUpdates }),
      });

      if (!reportsResponse.ok) {
        // Try to extract error message from response
        let errorMessage = "Failed to update reports";
        try {
          const errorData = await reportsResponse.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = `Failed to update reports: ${reportsResponse.status} ${reportsResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Save player match stats from draft to PlayerMatchStat collection
      if (localPlayerMatchStats && Object.keys(localPlayerMatchStats).length > 0) {
        try {
          const statsPromises = Object.entries(localPlayerMatchStats).map(async ([playerId, stats]) => {
            // Check if any stat has a non-zero rating
            const hasStats = 
              (stats.fouls?.committedRating || 0) > 0 ||
              (stats.fouls?.receivedRating || 0) > 0 ||
              (stats.shooting?.volumeRating || 0) > 0 ||
              (stats.shooting?.accuracyRating || 0) > 0 ||
              (stats.passing?.volumeRating || 0) > 0 ||
              (stats.passing?.accuracyRating || 0) > 0 ||
              (stats.passing?.keyPassesRating || 0) > 0 ||
              (stats.duels?.involvementRating || 0) > 0 ||
              (stats.duels?.successRating || 0) > 0;
            
            if (hasStats) {
              // Stats are already in the correct format (nested structure with ratings)
              await upsertPlayerMatchStats(gameId, playerId, stats);
            }
          });
          await Promise.all(statsPromises);
          console.log('✅ Saved player match stats (fouls) to PlayerMatchStat collection');
        } catch (error) {
          console.error('Error saving player match stats:', error);
          // Don't throw - allow game to be finalized even if stats save fails
        }
      }

      await refreshData();
      setIsReadOnly(true);
      setShowFinalReportDialog(false);
      // Preserve matchDuration when updating game status
      setGame((prev) => ({ 
        ...prev, 
        status: "Done",
        matchDuration: matchDuration // Preserve the matchDuration state
      }));
      showConfirmation({
        title: "Success",
        message: "Final report submitted successfully!",
        confirmText: "OK",
        cancelText: null,
        onConfirm: () => setShowConfirmationModal(false),
        onCancel: null,
        type: "success"
      });
    } catch (error) {
      console.error("Error submitting final report:", error);
      // Extract error message from error object
      const errorMessage = error.message || error.toString() || "Failed to submit final report";
      showConfirmation({
        title: "Error",
        message: errorMessage,
        confirmText: "OK",
        cancelText: null,
        onConfirm: () => setShowConfirmationModal(false),
        onCancel: null,
        type: "warning"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditReport = () => {
    setIsReadOnly(false);
    setGame((prev) => ({ ...prev, status: "Played" }));
  };

  // Team Summary handlers
  const handleTeamSummaryClick = (summaryType) => {
    setSelectedSummaryType(summaryType);
    setShowTeamSummaryDialog(true);
  };

  const handleTeamSummarySave = (summaryType, value) => {
    setTeamSummary((prev) => ({
      ...prev,
      [`${summaryType}Summary`]: value
    }));
  };

  const getCurrentSummaryValue = () => {
    if (!selectedSummaryType) return "";
    return teamSummary[`${selectedSummaryType}Summary`] || "";
  };

  // Check if all team summaries are filled
  const areAllTeamSummariesFilled = () => {
    return (
      teamSummary.defenseSummary && teamSummary.defenseSummary.trim() &&
      teamSummary.midfieldSummary && teamSummary.midfieldSummary.trim() &&
      teamSummary.attackSummary && teamSummary.attackSummary.trim() &&
      teamSummary.generalSummary && teamSummary.generalSummary.trim()
    );
  };

  // Goal handlers
  const handleAddGoal = () => {
    setSelectedGoal(null);
    setShowGoalDialog(true);
  };

  const handleEditGoal = (goal) => {
    setSelectedGoal(goal);
    setShowGoalDialog(true);
    
    // If editing an opponent goal, we need to set the active tab in GoalDialog
    // This will be handled by GoalDialog checking goal.goalCategory or isOpponentGoal
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    try {
      await deleteGoal(gameId, goalId);
      setGoals(prevGoals => prevGoals.filter(g => g._id !== goalId));
      // Refresh team stats after goal deletion (affects goals/assists)
      refreshTeamStats();
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Failed to delete goal: ' + error.message);
    }
  };

  const handleSaveGoal = async (goalData) => {
    try {
      if (selectedGoal) {
        // Update existing goal
        const updatedGoal = await updateGoal(gameId, selectedGoal._id, goalData);
        setGoals(prevGoals => prevGoals.map(g => g._id === updatedGoal._id ? updatedGoal : g));
        
        // Recalculate score from goals
        const updatedGoals = await fetchGoals(gameId);
        setGoals(updatedGoals);
      } else {
        // Create new goal
        const newGoal = await createGoal(gameId, goalData);
        setGoals(prevGoals => [...prevGoals, newGoal]);
        
        // Increment team score when team goal is recorded
        setFinalScore(prev => ({
          ...prev,
          ourScore: prev.ourScore + 1
        }));
      }
      
      // Refresh goals list to ensure consistency
      const updatedGoals = await fetchGoals(gameId);
      setGoals(updatedGoals);
      
      // Refresh team stats after goal save (affects goals/assists)
      refreshTeamStats();
      
      // Refresh timeline to update player states
      try {
        const timelineData = await fetchMatchTimeline(gameId);
        setTimeline(timelineData);
      } catch (error) {
        console.error('Error refreshing timeline:', error);
      }
      
      setShowGoalDialog(false);
      setSelectedGoal(null);
    } catch (error) {
      console.error('Error saving goal:', error);
      throw error; // Re-throw to let GoalDialog handle it
    }
  };

  // Opponent Goal handler
  const handleSaveOpponentGoal = async (opponentGoalData) => {
    try {
      // Save opponent goal to database
      const goalData = {
        minute: opponentGoalData.minute,
        goalType: opponentGoalData.goalType || 'open-play',
        isOpponentGoal: true
      };
      
      await createGoal(gameId, goalData);
      
      // Increment opponent score when opponent goal is recorded
      const newOpponentScore = finalScore.opponentScore + 1;
      setFinalScore(prev => ({
        ...prev,
        opponentScore: newOpponentScore
      }));
      
      // Refresh goals list to include the new opponent goal
      const updatedGoals = await fetchGoals(gameId);
      setGoals(updatedGoals);
      
      // Refresh team stats after opponent goal save (no player stats change, but keep consistency)
      refreshTeamStats();
    } catch (error) {
      console.error('Error saving opponent goal:', error);
      throw error;
    }
  };

  // Substitution handlers
  const handleAddSubstitution = () => {
    setSelectedSubstitution(null);
    setShowSubstitutionDialog(true);
  };

  const handleEditSubstitution = (substitution) => {
    setSelectedSubstitution(substitution);
    setShowSubstitutionDialog(true);
  };

  const handleDeleteSubstitution = async (subId) => {
    if (!window.confirm('Are you sure you want to delete this substitution?')) {
      return;
    }

    try {
      await deleteSubstitution(gameId, subId);
      setSubstitutions(prevSubs => prevSubs.filter(s => s._id !== subId));
      // Refresh team stats after substitution deletion (affects minutes)
      refreshTeamStats();
    } catch (error) {
      console.error('Error deleting substitution:', error);
      alert('Failed to delete substitution: ' + error.message);
    }
  };

  const handleSaveSubstitution = async (subData) => {
    try {
      if (selectedSubstitution) {
        // Update existing substitution
        const updatedSub = await updateSubstitution(gameId, selectedSubstitution._id, subData);
        setSubstitutions(prevSubs => prevSubs.map(s => s._id === updatedSub._id ? updatedSub : s));
      } else {
        // Create new substitution
        const newSub = await createSubstitution(gameId, subData);
        setSubstitutions(prevSubs => [...prevSubs, newSub]);
      }
      
      // Refresh team stats after substitution save (affects minutes)
      refreshTeamStats();
      
      // Refresh timeline to update player states
      try {
        const timelineData = await fetchMatchTimeline(gameId);
        setTimeline(timelineData);
      } catch (error) {
        console.error('Error refreshing timeline:', error);
      }
      
      setShowSubstitutionDialog(false);
      setSelectedSubstitution(null);
    } catch (error) {
      console.error('Error saving substitution:', error);
      throw error; // Re-throw to let SubstitutionDialog handle it
    }
  };

  // Card handlers
  const handleAddCard = () => {
    setSelectedCard(null);
    setShowCardDialog(true);
  };

  const handleEditCard = (card) => {
    console.log('🔍 [GameDetailsPage] handleEditCard called:', {
      card: card ? {
        _id: card._id,
        cardType: card.cardType,
        playerId: card.playerId?._id || card.playerId,
        minute: card.minute
      } : null,
      cardsArrayLength: cards.length,
      cardInArray: cards.find(c => c._id === card?._id)
    });
    setSelectedCard(card);
    setShowCardDialog(true);
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Are you sure you want to delete this card?')) {
      return;
    }

    try {
      await deleteCard(gameId, cardId);
      setCards(prevCards => prevCards.filter(c => c._id !== cardId));
      // Refresh team stats if red card was deleted (affects minutes)
      refreshTeamStats();
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('Failed to delete card: ' + error.message);
    }
  };

  const handleSaveCard = async (cardData) => {
    try {
      console.log('🔍 [GameDetailsPage] handleSaveCard called:', {
        isEditing: !!selectedCard,
        selectedCardId: selectedCard?._id,
        cardData
      });
      
      const wasEditing = !!selectedCard;
      const editingCardId = selectedCard?._id;
      const cardToUpdate = selectedCard; // Save reference before clearing
      
      if (cardToUpdate) {
        // Update existing card
        const updatedCard = await updateCard(gameId, cardToUpdate._id, cardData);
        console.log('🔍 [GameDetailsPage] Card updated:', {
          oldCardId: cardToUpdate._id,
          updatedCardId: updatedCard._id,
          updatedCard
        });
        setCards(prevCards => prevCards.map(c => c._id === updatedCard._id ? updatedCard : c));
      } else {
        // Create new card
        const newCard = await createCard(gameId, cardData);
        setCards(prevCards => [...prevCards, newCard]);
      }
      
      // Close dialog AFTER successful save to prevent re-render issues during card refresh
      setShowCardDialog(false);
      setSelectedCard(null);
      
      // Refresh cards list (after dialog is closed)
      const updatedCards = await fetchCards(gameId);
      console.log('🔍 [GameDetailsPage] Cards refreshed:', {
        updatedCardsCount: updatedCards.length,
        wasEditing,
        editingCardId,
        updatedCardExists: wasEditing ? updatedCards.find(c => c._id === editingCardId) ? 'YES' : 'NO' : 'N/A'
      });
      setCards(updatedCards);
      
      // Refresh team stats if red card (affects minutes)
      if (cardData.cardType === 'red' || cardData.cardType === 'second-yellow') {
        refreshTeamStats();
      }
      
      // Refresh timeline to update player states
      try {
        const timelineData = await fetchMatchTimeline(gameId);
        setTimeline(timelineData);
      } catch (error) {
        console.error('Error refreshing timeline:', error);
      }
    } catch (error) {
      // On error, keep dialog open so user can see the error
      console.error('Error saving card:', error);
      throw error; // Re-throw so CardDialog can handle it
    }
  };

  // Comprehensive validation for "Played" status (final report submission)
  const validatePlayedStatus = () => {
    const validations = [];
    let hasErrors = false;
    let needsConfirmation = false;
    let confirmationMessage = "";

    // 1. Basic squad validation (no bench validation for "Played" status)
    // Bench validation only applies when marking game as "Played", not for final submission
    const startingLineupValidation = validateStartingLineup(formation);
    if (!startingLineupValidation.isValid) {
      hasErrors = true;
      validations.push(startingLineupValidation.message);
    }
    
    const goalkeeperValidation = validateGoalkeeper(formation);
    if (!goalkeeperValidation.hasGoalkeeper) {
      hasErrors = true;
      validations.push(goalkeeperValidation.message);
    }

    // 2. Goals are calculated from Goals collection, not from player reports
    // No validation needed - goals are tracked in Goals collection with scorerId, assistedById, etc.

    // 3. Team summaries validation
    if (!areAllTeamSummariesFilled()) {
      hasErrors = true;
      validations.push("All team summary reports must be completed");
    }

    return {
      isValid: !hasErrors,
      hasErrors,
      needsConfirmation,
      confirmationMessage,
      messages: validations
    };
  };

  // Drag and drop handlers
  const handleDragStart = (e, player) => {
    console.log('🚀 DRAG START:', {
      playerName: player.fullName,
      playerId: player._id,
      playerKitNumber: player.kitNumber
    });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", player._id);
    setDraggedPlayer(player);
    setIsDragging(true);
    setManualFormationMode(true);
    console.log('🎯 Manual formation mode ENABLED');
  };

  const handleDragEnd = () => {
    console.log('🏁 DRAG END');
    setDraggedPlayer(null);
    setIsDragging(false);
  };

  const handlePositionDrop = (e, posId) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('📍 DROP EVENT FIRED:', {
      posId,
      draggedPlayer: draggedPlayer ? draggedPlayer.fullName : 'NULL',
      eventTarget: e.target.className,
      currentTarget: e.currentTarget.className
    });
    
    if (!draggedPlayer) {
      console.error('❌ No dragged player in state!');
      return;
    }
    
    // Get position data for validation
    const positionData = positions[posId];
    
    // Validate player position
    const positionValidation = validatePlayerPosition(draggedPlayer, positionData);
    
    // If player is being placed out of position, show confirmation
    if (!positionValidation.isNaturalPosition) {
      setPendingPlayerPosition({ player: draggedPlayer, position: posId, positionData });
      showConfirmation({
        title: "Out of Position Warning",
        message: `${draggedPlayer.fullName} is being placed out of their natural position. Are you sure you want to place them here?`,
        confirmText: "Confirm",
        cancelText: "Cancel",
        onConfirm: () => executePositionDrop(draggedPlayer, posId),
        onCancel: () => {
          setIsDragging(false);
          setDraggedPlayer(null);
        },
        type: "warning"
      });
      return;
    }
    
    // If position is natural, proceed directly
    executePositionDrop(draggedPlayer, posId);
  };

  // Execute the actual position drop logic
  const executePositionDrop = (player, posId) => {
    console.log(`✅ Assigning player ${player.fullName} to position ${posId}`);
    
    setFormation((prev) => {
      const updated = { ...prev };
      
      Object.keys(updated).forEach((key) => {
        if (updated[key]?._id === player._id) {
          console.log(`🧹 Removing ${player.fullName} from position ${key}`);
          updated[key] = null;
        }
      });
      
      updated[posId] = player;
      
      console.log('🔄 Formation updated:', Object.entries(updated).filter(([_, p]) => p !== null).map(([pos, p]) => ({ pos, player: p.fullName })));
      return updated;
    });
    
    updatePlayerStatus(player._id, "Starting Lineup");
    
    setIsDragging(false);
    setDraggedPlayer(null);
  };

  const handleRemovePlayerFromPosition = (posId) => {
    const player = formation[posId];
    if (!player) return;

    setFormation((prev) => ({ ...prev, [posId]: null }));
    updatePlayerStatus(player._id, "Not in Squad");
  };

  const handleFormationChange = (newFormationType) => {
    if (window.confirm("Changing formation will clear all current position assignments. Continue?")) {
      setFormationType(newFormationType);
      setFormation({});
    }
  };

  const handlePositionClick = (posId, posData) => {
    console.log('🎯 Position clicked:', { posId, posData });
    setSelectedPosition(posId);
    setSelectedPositionData(posData);
    setShowPlayerSelectionDialog(true);
  };

  const handleSelectPlayerForPosition = (player) => {
    if (!selectedPosition) return;
    
    console.log('✅ Assigning player to position:', {
      posId: selectedPosition,
      player: player.fullName
    });

    // Remove player from any existing position first
    const newFormation = { ...formation };
    Object.keys(newFormation).forEach((posId) => {
      if (newFormation[posId]?._id === player._id) {
        newFormation[posId] = null;
      }
    });

    // Assign to new position
    newFormation[selectedPosition] = player;
    setFormation(newFormation);
    
    // Update player status
    updatePlayerStatus(player._id, "Starting Lineup");
    setManualFormationMode(true);

    // Close dialog and reset
    setShowPlayerSelectionDialog(false);
    setSelectedPosition(null);
    setSelectedPositionData(null);
  };

  // Prevent navigation during game finalization (MUST be before any early returns)
  useEffect(() => {
    if (isFinalizingGame) {
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = 'Game finalization in progress. Are you sure you want to leave?';
        return e.returnValue;
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [isFinalizingGame]);

  // Render loading/error states
  // Show loading if DataProvider is loading OR if we're fetching the game directly
  if (isLoading || isFetchingGame) {
    return <PageLoader message="Loading game details..." />;
  }

  // This check now runs *after* we are sure we are not loading
  if (error || !game) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-red-400 text-lg">
          {error || "Game not found"}
        </div>
      </div>
    );
  }

  const isScheduled = game?.status === "Scheduled";
  const isPlayed = game?.status === "Played";
  const isDone = game?.status === "Done" || isReadOnly;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Blocking Modal for Game Finalization */}
      {isFinalizingGame && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-md mx-4 text-center border border-cyan-500/30 shadow-2xl">
            <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Finalizing Game</h2>
            <p className="text-slate-300 mb-4">
              Please do not navigate away. This may take a few moments...
            </p>
            <div className="text-sm text-slate-400">
              Saving lineup, updating game status, and clearing draft...
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <GameHeaderModule
        game={game}
        finalScore={finalScore}
        setFinalScore={setFinalScore}
        matchDuration={matchDuration}
        setMatchDuration={setMatchDuration}
        missingReportsCount={missingReportsCount}
        teamSummary={teamSummary}
        isSaving={isSaving}
        isScheduled={isScheduled}
        isPlayed={isPlayed}
        isDone={isDone}
        handleGameWasPlayed={handleGameWasPlayed}
        handlePostpone={handlePostpone}
        handleSubmitFinalReport={handleSubmitFinalReport}
        handleEditReport={handleEditReport}
        playerReports={localPlayerReports}
        matchStats={matchStats}
      />

      {/* Main Content - 3 Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Game Day Roster */}
        <RosterSidebarModule
          playersOnPitch={playersOnPitch}
          benchPlayers={benchPlayers}
          squadPlayers={squadPlayers}
          hasReport={hasReport}
          needsReport={needsReport}
          getPlayerStatus={getPlayerStatus}
          handleOpenPerformanceDialog={handleOpenPerformanceDialog}
          updatePlayerStatus={updatePlayerStatus}
          handleDragStart={handleDragStart}
          handleDragEnd={handleDragEnd}
          isScheduled={isScheduled}
          isPlayed={isPlayed}
          isDone={isDone}
        />

        {/* Center - Tactical Board */}
        <TacticalBoardModule
          tacticalBoardProps={{
            formations,
            formationType,
            positions,
            formation,
            onFormationChange: handleFormationChange,
            onPositionDrop: handlePositionDrop,
            onRemovePlayer: handleRemovePlayerFromPosition,
            onPlayerClick: handleOpenPerformanceDialog,
            onPositionClick: handlePositionClick,
            isDragging,
            isScheduled,
            isPlayed,
            isReadOnly: isDone,
            isDone,
            hasReport,
            needsReport,
          }}
          autoFillProps={{
            showAutoFill: isPlayed,
            remainingCount: remainingReportsCount,
            onAutoFill: handleAutoFillRemaining,
            disabled: remainingReportsCount === 0 || isDone,
          }}
        />

        {/* Right Sidebar - Match Analysis */}
        <MatchAnalysisModule
          isScheduled={isScheduled}
          isPlayed={isPlayed}
          isDone={isDone}
          teamSummary={teamSummary}
          setTeamSummary={setTeamSummary}
          onTeamSummaryClick={handleTeamSummaryClick}
          goals={goals}
          onAddGoal={handleAddGoal}
          onEditGoal={handleEditGoal}
          onDeleteGoal={handleDeleteGoal}
          substitutions={substitutions}
          onAddSubstitution={handleAddSubstitution}
          onEditSubstitution={handleEditSubstitution}
          onDeleteSubstitution={handleDeleteSubstitution}
          cards={cards}
          onAddCard={handleAddCard}
          onEditCard={handleEditCard}
          onDeleteCard={handleDeleteCard}
          matchDuration={matchDuration}
          setMatchDuration={setMatchDuration}
          game={game}
          difficultyAssessment={difficultyAssessment}
          onSaveDifficultyAssessment={handleSaveDifficultyAssessment}
          onDeleteDifficultyAssessment={handleDeleteDifficultyAssessment}
          isDifficultyAssessmentEnabled={isDifficultyAssessmentEnabled}
        />
      </div>

      {/* Dialogs */}
      <DialogsModule
        dialogs={{
          finalReport: {
            open: showFinalReportDialog,
            onOpenChange: setShowFinalReportDialog,
            finalScore,
            teamSummary,
            onConfirm: handleConfirmFinalSubmission,
            isSaving,
          },
          playerPerformance: {
            open: showPlayerPerfDialog,
            onOpenChange: setShowPlayerPerfDialog,
            player: selectedPlayer,
            data: playerPerfData,
            onDataChange: setPlayerPerfData,
            onSave: handleSavePerformanceReport,
            isReadOnly: isDone,
            isStarting: !!(selectedPlayer && playersOnPitch.some(p => p._id === selectedPlayer._id)),
            game,
            matchDuration,
            substitutions,
            playerReports: localPlayerReports,
            goals,
            cards,
            initialMinutes: teamStats[selectedPlayer?._id]?.minutes,
            initialGoals: teamStats[selectedPlayer?._id]?.goals,
            initialAssists: teamStats[selectedPlayer?._id]?.assists,
            isLoadingStats: isLoadingTeamStats,
            onAddSubstitution: () => {
              setShowPlayerPerfDialog(false);
              setShowSubstitutionDialog(true);
            },
          },
          playerSelection: {
            open: showPlayerSelectionDialog,
            onClose: () => {
              setShowPlayerSelectionDialog(false);
              setSelectedPosition(null);
              setSelectedPositionData(null);
            },
            position: selectedPosition,
            positionData: selectedPositionData,
            availablePlayers: squadPlayers,
            onSelectPlayer: handleSelectPlayerForPosition,
          },
          teamSummary: {
            open: showTeamSummaryDialog,
            onOpenChange: setShowTeamSummaryDialog,
            summaryType: selectedSummaryType,
            currentValue: getCurrentSummaryValue(),
            onSave: handleTeamSummarySave,
            isSaving,
          },
          goal: {
            isOpen: showGoalDialog,
            onClose: () => {
              setShowGoalDialog(false);
              setSelectedGoal(null);
            },
            onSave: handleSaveGoal,
            onSaveOpponentGoal: handleSaveOpponentGoal,
            goal: selectedGoal,
            gamePlayers: activeGamePlayers,
            existingGoals: goals,
            matchDuration: matchDuration.regularTime + matchDuration.firstHalfExtraTime + matchDuration.secondHalfExtraTime,
            isReadOnly: isDone,
            game,
            timeline,
            startingLineup: startingLineupMap,
            squadPlayers: squadPlayersMap,
          },
          substitution: {
            isOpen: showSubstitutionDialog,
            onClose: () => {
              setShowSubstitutionDialog(false);
              setSelectedSubstitution(null);
            },
            onSave: handleSaveSubstitution,
            substitution: selectedSubstitution,
            playersOnPitch: Object.values(formation).filter(player => player && player._id),
            benchPlayers,
            matchDuration: matchDuration.regularTime + matchDuration.firstHalfExtraTime + matchDuration.secondHalfExtraTime,
            isReadOnly: isDone,
            playerReports: localPlayerReports,
            timeline,
            startingLineup: startingLineupMap,
            squadPlayers: squadPlayersMap,
          },
          card: {
            isOpen: showCardDialog,
            onClose: () => {
              console.log('🔍 [GameDetailsPage] Closing CardDialog:', {
                selectedCard: selectedCard ? {
                  _id: selectedCard._id,
                  cardType: selectedCard.cardType,
                  playerId: selectedCard.playerId?._id || selectedCard.playerId
                } : null
              });
              setShowCardDialog(false);
              setSelectedCard(null);
            },
            onSave: handleSaveCard,
            card: selectedCard,
            gamePlayers: activeGamePlayers,
            cards,
            matchDuration: matchDuration.regularTime + matchDuration.firstHalfExtraTime + matchDuration.secondHalfExtraTime,
            isReadOnly: isDone,
            game,
          },
          confirmation: {
            isOpen: showConfirmationModal,
            onClose: () => setShowConfirmationModal(false),
            title: confirmationConfig.title,
            message: confirmationConfig.message,
            confirmText: confirmationConfig.confirmText,
            cancelText: confirmationConfig.cancelText,
            onConfirm: handleConfirmation,
            onCancel: handleConfirmationCancel,
            type: confirmationConfig.type,
            isLoading: isSaving,
          },
        }}
      />
    </div>
  );
}

