import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useData } from '@/app/providers/DataProvider';
import { useAutosave } from '@/shared/hooks';
import { ConfirmationModal } from '@/shared/components';
import PageLoader from '@/shared/components/PageLoader';

// Import custom hooks
import {
  useGameCore,
  useRosterManagement,
  useFormationManagement,
  useGameEvents,
  usePlayerReports,
  useDifficultyAssessment,
  useGameValidation,
  useTeamSummary,
  useDragAndDrop,
} from './hooks';

// Import modular components
import GameDetailsHeader from './components/GameDetailsHeader';
import GameDayRosterSidebar from './components/GameDayRosterSidebar';
import TacticalBoard from './components/TacticalBoard';
import MatchAnalysisSidebar from './components/MatchAnalysisSidebar';
import PlayerPerformanceDialog from './components/dialogs/PlayerPerformanceDialog';
import FinalReportDialog from './components/dialogs/FinalReportDialog';
import PlayerSelectionDialog from './components/dialogs/PlayerSelectionDialog';
import TeamSummaryDialog from './components/dialogs/TeamSummaryDialog';
import GoalDialog from './components/dialogs/GoalDialog';
import SubstitutionDialog from './components/dialogs/SubstitutionDialog';
import CardDialog from './components/dialogs/CardDialog';
import AutoFillReportsButton from './components/AutoFillReportsButton';

// Import API functions for game finalization
import { upsertPlayerMatchStats } from '../../api/playerMatchStatsApi';

export default function GameDetailsPage() {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('id');
  const { games, refreshData, updateGameInCache } = useData();

  // ========================================
  // HOOKS & DATA
  // ========================================
  
  // Core game state
  const {
    game,
    setGame,
    gamePlayers,
    matchDuration,
    setMatchDuration,
    finalScore,
    setFinalScore,
    isFetchingGame,
    isScheduled,
    isPlayed,
    isDone,
    playerMap,
    isLoading,
    error,
  } = useGameCore(gameId);

  // Finalization state (prevents autosave during finalization)
  const [isFinalizingGame, setIsFinalizingGame] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Roster management
  const {
    localRosterStatuses,
    setLocalRosterStatuses,
    getPlayerStatus,
    updatePlayerStatus,
    isAutosaving,
    updateGameRostersInCache,
  } = useRosterManagement(gameId, game, gamePlayers, isFinalizingGame);

  // Formation management
  const {
    formationType,
    formation,
    setFormation,
    positions,
    manualFormationMode,
    setManualFormationMode,
    handleFormationChange,
  } = useFormationManagement(gamePlayers, localRosterStatuses, game, gameId, isFinalizingGame);

  // Game events (goals, subs, cards)
  const {
    goals,
    setGoals,
    substitutions,
    cards,
    timeline,
    handleSaveGoal,
    handleDeleteGoal,
    handleSaveSubstitution,
    handleDeleteSubstitution,
    handleSaveCard,
    handleDeleteCard,
    refreshTeamStats,
  } = useGameEvents(gameId, game, setFinalScore);

  // Player reports
  const {
    localPlayerReports,
    setLocalPlayerReports,
    localPlayerMatchStats,
    setLocalPlayerMatchStats,
    teamStats,
    isLoadingTeamStats,
    hasReport,
    needsReport,
    missingReportsCount,
    remainingReportsCount,
    handleAutoFillRemaining,
  } = usePlayerReports(gameId, game, gamePlayers, localRosterStatuses);

  // Difficulty assessment
  const {
    difficultyAssessment,
    isDifficultyAssessmentEnabled,
    handleSaveDifficultyAssessment,
    handleDeleteDifficultyAssessment,
  } = useDifficultyAssessment(gameId, game);

  // Team summary
  const {
    teamSummary,
    setTeamSummary,
    showTeamSummaryDialog,
    setShowTeamSummaryDialog,
    selectedSummaryType,
    handleTeamSummaryClick,
    handleTeamSummarySave,
    getCurrentSummaryValue,
  } = useTeamSummary(game);

  // Validation
  const {
    showConfirmationModal,
    setShowConfirmationModal,
    confirmationConfig,
    showConfirmation,
    handleConfirmation,
    handleConfirmationCancel,
    validateSquadForPlayed,
    validatePlayedStatus,
    areAllTeamSummariesFilled,
  } = useGameValidation(formation, [], teamSummary, localRosterStatuses);

  // Drag and drop
  const {
    draggedPlayer,
    isDragging,
    handleDragStart,
    handleDragEnd,
    handlePositionDrop,
    handleRemovePlayerFromPosition,
  } = useDragAndDrop(
    formation,
    setFormation,
    updatePlayerStatus,
    positions,
    setManualFormationMode,
    showConfirmation
  );

  // ========================================
  // DERIVED STATE
  // ========================================
  
  const playersOnPitch = useMemo(() => {
    return Object.values(formation).filter((player) => player !== null);
  }, [formation]);

  const benchPlayers = useMemo(() => {
    return gamePlayers.filter((player) => {
      const status = getPlayerStatus(player._id);
      return status === "Bench";
    });
  }, [gamePlayers, getPlayerStatus]);

  const squadPlayers = useMemo(() => {
    return gamePlayers.filter((player) => {
      const status = getPlayerStatus(player._id);
      const isOnPitch = playersOnPitch.some((p) => p._id === player._id);
      const isBench = status === "Bench";
      return !isOnPitch && !isBench;
    });
  }, [gamePlayers, playersOnPitch, getPlayerStatus]);

  const activeGamePlayers = useMemo(() => {
    return [...playersOnPitch, ...benchPlayers];
  }, [playersOnPitch, benchPlayers]);

  const startingLineupMap = useMemo(() => {
    const map = {};
    gamePlayers.forEach(player => {
      const status = getPlayerStatus(player._id);
      if (status === 'Starting Lineup') {
        map[player._id] = true;
      }
    });
    return map;
  }, [gamePlayers, getPlayerStatus]);

  const squadPlayersMap = useMemo(() => {
    const map = {};
    gamePlayers.forEach(player => {
      const status = getPlayerStatus(player._id);
      if (status === 'Starting Lineup' || status === 'Bench') {
        map[player._id] = status;
      }
    });
    return map;
  }, [gamePlayers, getPlayerStatus]);

  const matchStats = useMemo(() => {
    const scorerMap = new Map();
    const assisterMap = new Map();
    let topRated = null;
    let maxRating = 0;

    (goals || []).forEach((goal) => {
      if (goal.goalCategory === 'OpponentGoal' || goal.isOpponentGoal) return;

      if (goal.scorerId && goal.scorerId._id) {
        const scorerId = goal.scorerId._id;
        const scorerName = goal.scorerId.fullName || goal.scorerId.name || 'Unknown';
        scorerMap.set(scorerId, {
          name: scorerName,
          count: (scorerMap.get(scorerId)?.count || 0) + 1
        });
      }

      if (goal.assistedById && goal.assistedById._id) {
        const assisterId = goal.assistedById._id;
        const assisterName = goal.assistedById.fullName || goal.assistedById.name || 'Unknown';
        assisterMap.set(assisterId, {
          name: assisterName,
          count: (assisterMap.get(assisterId)?.count || 0) + 1
        });
      }
    });

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

  // ========================================
  // REPORT AUTOSAVE (Played games)
  // ========================================
  
  const reportDataForAutosave = useMemo(() => ({
    teamSummary,
    finalScore,
    matchDuration,
    playerReports: localPlayerReports,
    playerMatchStats: localPlayerMatchStats
  }), [teamSummary, finalScore, matchDuration, localPlayerReports, localPlayerMatchStats]);

  const { 
    isAutosaving: isAutosavingReport, 
    autosaveError: reportAutosaveError 
  } = useAutosave({
    data: reportDataForAutosave,
    endpoint: `http://localhost:3001/api/games/${gameId}/draft`,
    enabled: game?.status === 'Played' && !isFinalizingGame,
    debounceMs: 2500,
    shouldSkip: (data) => {
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

  // ========================================
  // DIALOG STATE
  // ========================================
  
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showSubstitutionDialog, setShowSubstitutionDialog] = useState(false);
  const [selectedSubstitution, setSelectedSubstitution] = useState(null);
  const [showCardDialog, setShowCardDialog] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showPlayerPerfDialog, setShowPlayerPerfDialog] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerPerfData, setPlayerPerfData] = useState({});
  const [showFinalReportDialog, setShowFinalReportDialog] = useState(false);
  const [showPlayerSelectionDialog, setShowPlayerSelectionDialog] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [selectedPositionData, setSelectedPositionData] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  useEffect(() => {
    if (game) {
      setIsReadOnly(game.status === "Done");
    }
  }, [game]);

  // ========================================
  // EVENT HANDLERS
  // ========================================
  
  // Game state transitions
  const handleGameWasPlayed = async () => {
    if (!game) return;
    
    const validation = validateSquadForPlayed();
    
    if (!validation.isValid) {
      showConfirmation({
        title: "Invalid Squad",
        message: validation.error,
        confirmText: "OK",
        cancelText: null,
        onConfirm: () => setShowConfirmationModal(false),
        onCancel: null,
        type: "warning"
      });
      return;
    }
    
    if (isDifficultyAssessmentEnabled && (!difficultyAssessment || !difficultyAssessment.overallScore)) {
      showConfirmation({
        title: "Difficulty Assessment Not Completed",
        message: "⚠️ You haven't completed the difficulty assessment for this game. Do you want to continue without completing it?",
        confirmText: "Continue Anyway",
        cancelText: "Go Back",
        onConfirm: () => executeGameWasPlayed(),
        onCancel: () => {},
        type: "warning"
      });
      return;
    }

    if (validation.needsConfirmation) {
      showConfirmation({
        title: "Bench Size Warning",
        message: validation.confirmationMessage,
        confirmText: "Continue",
        cancelText: "Go Back",
        onConfirm: () => executeGameWasPlayed(),
        onCancel: () => {},
        type: "warning"
      });
      return;
    }
    
    await executeGameWasPlayed();
  };

  const executeGameWasPlayed = async () => {
    setIsFinalizingGame(true);
    setIsSaving(true);
    
    try {
      const rostersObject = {};
      gamePlayers.forEach((player) => {
        const status = getPlayerStatus(player._id);
        if (status !== 'Not in Squad') {
          rostersObject[player._id] = status;
        }
      });

      const cleanFormation = {};
      Object.entries(formation).forEach(([position, player]) => {
        if (player && player._id && player._id !== '0') {
          cleanFormation[position] = player._id;
        }
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
      
      if (result.data?.game) {
        const updatedGameData = {
          _id: result.data.game._id,
          status: result.data.game.status,
          lineupDraft: result.data.game.lineupDraft ?? null,
        };
        
        if (result.data.game.gameTitle) {
          updatedGameData.gameTitle = result.data.game.gameTitle;
        }

        setGame((prev) => ({
          ...prev,
          ...updatedGameData,
        }));

        const existingGameInCache = games.find(g => g._id === result.data.game._id);
        updateGameInCache({
          ...(existingGameInCache || {}),
          ...updatedGameData,
        });
      }

      if (result.data?.rosters && Array.isArray(result.data.rosters)) {
        const statuses = {};
        result.data.rosters.forEach((roster) => {
          const playerId = typeof roster.player === "object" 
            ? roster.player._id 
            : roster.player;
          statuses[playerId] = roster.status;
        });
        
        gamePlayers.forEach((player) => {
          if (!statuses[player._id]) {
            statuses[player._id] = "Not in Squad";
          }
        });
        
        setLocalRosterStatuses(statuses);
        updateGameRostersInCache(result.data.rosters, gameId);
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
      setIsFinalizingGame(false);
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

  const handleSubmitFinalReport = async () => {
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

    setShowFinalReportDialog(true);
  };

  const handleConfirmFinalSubmission = async () => {
    setIsSaving(true);
    try {
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
      
      const gameResponse = await fetch(`http://localhost:3001/api/games/${gameId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!gameResponse.ok) {
        const errorData = await gameResponse.json();
        throw new Error(errorData.error || errorData.message || "Failed to update game");
      }

      const reportUpdates = Object.entries(localPlayerReports).map(([playerId, report]) => ({
        playerId,
        rating_physical: report.rating_physical || 3,
        rating_technical: report.rating_technical || 3,
        rating_tactical: report.rating_tactical || 3,
        rating_mental: report.rating_mental || 3,
        notes: report.notes || null,
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
        const errorData = await reportsResponse.json();
        throw new Error(errorData.error || errorData.message || "Failed to update reports");
      }

      if (localPlayerMatchStats && Object.keys(localPlayerMatchStats).length > 0) {
        try {
          const statsPromises = Object.entries(localPlayerMatchStats).map(async ([playerId, stats]) => {
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
              await upsertPlayerMatchStats(gameId, playerId, stats);
            }
          });
          await Promise.all(statsPromises);
        } catch (error) {
          console.error('Error saving player match stats:', error);
        }
      }

      await refreshData();
      setIsReadOnly(true);
      setShowFinalReportDialog(false);
      setGame((prev) => ({ 
        ...prev, 
        status: "Done",
        matchDuration: matchDuration
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

  // Player performance dialog
  const handleOpenPerformanceDialog = (player) => {
    setSelectedPlayer(player);
    const existingReport = localPlayerReports[player._id] || {};
    const playerStats = teamStats[player._id] || {};
    const playerMatchStat = localPlayerMatchStats[player._id] || {};
    
    const playerPerfDataToSet = {
      rating_physical: existingReport.rating_physical || 3,
      rating_technical: existingReport.rating_technical || 3,
      rating_tactical: existingReport.rating_tactical || 3,
      rating_mental: existingReport.rating_mental || 3,
      notes: existingReport.notes || "",
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
    
    setPlayerPerfData(playerPerfDataToSet);
    setShowPlayerPerfDialog(true);
  };

  const handleSavePerformanceReport = async () => {
    if (!selectedPlayer) return;

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

    setLocalPlayerMatchStats((prev) => ({
      ...prev,
      [selectedPlayer._id]: playerPerfData.stats || {},
    }));

    try {
      const reportPayload = {
        playerId: selectedPlayer._id,
        rating_physical: playerPerfData.rating_physical,
        rating_technical: playerPerfData.rating_technical,
        rating_tactical: playerPerfData.rating_tactical,
        rating_mental: playerPerfData.rating_mental,
        notes: playerPerfData.notes || null,
      };

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
        console.error("Failed to save performance report");
      }
    } catch (error) {
      console.error("Error saving performance report:", error);
    }

    setShowPlayerPerfDialog(false);
    setSelectedPlayer(null);
  };

  // Goal/Sub/Card dialog handlers
  const handleAddGoal = () => {
    setSelectedGoal(null);
    setShowGoalDialog(true);
  };

  const handleEditGoal = (goal) => {
    setSelectedGoal(goal);
    setShowGoalDialog(true);
  };

  const handleAddSubstitution = () => {
    setSelectedSubstitution(null);
    setShowSubstitutionDialog(true);
  };

  const handleEditSubstitution = (substitution) => {
    setSelectedSubstitution(substitution);
    setShowSubstitutionDialog(true);
  };

  const handleAddCard = () => {
    setSelectedCard(null);
    setShowCardDialog(true);
  };

  const handleEditCard = (card) => {
    setSelectedCard(card);
    setShowCardDialog(true);
  };

  // Position selection
  const handlePositionClick = (posId, posData) => {
    setSelectedPosition(posId);
    setSelectedPositionData(posData);
    setShowPlayerSelectionDialog(true);
  };

  const handleSelectPlayerForPosition = (player) => {
    if (!selectedPosition) return;

    const newFormation = { ...formation };
    Object.keys(newFormation).forEach((posId) => {
      if (newFormation[posId]?._id === player._id) {
        newFormation[posId] = null;
      }
    });

    newFormation[selectedPosition] = player;
    setFormation(newFormation);
    updatePlayerStatus(player._id, "Starting Lineup");
    setManualFormationMode(true);

    setShowPlayerSelectionDialog(false);
    setSelectedPosition(null);
    setSelectedPositionData(null);
  };

  // Prevent navigation during game finalization
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

  // ========================================
  // EARLY RETURNS (Loading/Error)
  // ========================================
  
  if (isLoading || isFetchingGame) {
    return <PageLoader message="Loading game details..." />;
  }

  if (error || !game) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-red-400 text-lg">
          {error || "Game not found"}
        </div>
      </div>
    );
  }

  // ========================================
  // RENDER
  // ========================================
  
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
      <GameDetailsHeader
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
        <GameDayRosterSidebar
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
        <div className="flex-1 bg-slate-900/95 backdrop-blur-sm relative">
          <TacticalBoard
            formations={formations}
            formationType={formationType}
            positions={positions}
            formation={formation}
            onFormationChange={handleFormationChange}
            onPositionDrop={handlePositionDrop}
            onRemovePlayer={handleRemovePlayerFromPosition}
            onPlayerClick={handleOpenPerformanceDialog}
            onPositionClick={handlePositionClick}
            isDragging={isDragging}
            isScheduled={isScheduled}
            isPlayed={isPlayed}
            isReadOnly={isDone}
            isDone={isDone}
            hasReport={hasReport}
            needsReport={needsReport}
          />
          {isPlayed && (
            <AutoFillReportsButton
              remainingCount={remainingReportsCount}
              onAutoFill={handleAutoFillRemaining}
              disabled={remainingReportsCount === 0 || isDone}
            />
          )}
        </div>

        {/* Right Sidebar - Match Analysis */}
        <MatchAnalysisSidebar
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
      <FinalReportDialog
        open={showFinalReportDialog}
        onOpenChange={setShowFinalReportDialog}
        finalScore={finalScore}
        teamSummary={teamSummary}
        onConfirm={handleConfirmFinalSubmission}
        isSaving={isSaving}
      />

      <PlayerPerformanceDialog
        open={showPlayerPerfDialog}
        onOpenChange={setShowPlayerPerfDialog}
        player={selectedPlayer}
        data={playerPerfData}
        onDataChange={setPlayerPerfData}
        onSave={handleSavePerformanceReport}
        isReadOnly={isDone}
        isStarting={!!(selectedPlayer && playersOnPitch.some(p => p._id === selectedPlayer._id))}
        game={game}
        matchDuration={matchDuration}
        substitutions={substitutions}
        playerReports={localPlayerReports}
        goals={goals}
        cards={cards}
        initialMinutes={teamStats[selectedPlayer?._id]?.minutes}
        initialGoals={teamStats[selectedPlayer?._id]?.goals}
        initialAssists={teamStats[selectedPlayer?._id]?.assists}
        isLoadingStats={isLoadingTeamStats}
        onAddSubstitution={() => {
          setShowPlayerPerfDialog(false);
          setShowSubstitutionDialog(true);
        }}
      />

      <PlayerSelectionDialog
        open={showPlayerSelectionDialog}
        onClose={() => {
          setShowPlayerSelectionDialog(false);
          setSelectedPosition(null);
          setSelectedPositionData(null);
        }}
        position={selectedPosition}
        positionData={selectedPositionData}
        availablePlayers={squadPlayers}
        onSelectPlayer={handleSelectPlayerForPosition}
      />

      <TeamSummaryDialog
        open={showTeamSummaryDialog}
        onOpenChange={setShowTeamSummaryDialog}
        summaryType={selectedSummaryType}
        currentValue={getCurrentSummaryValue()}
        onSave={handleTeamSummarySave}
        isSaving={isSaving}
      />

      <GoalDialog
        isOpen={showGoalDialog}
        onClose={() => {
          setShowGoalDialog(false);
          setSelectedGoal(null);
        }}
        onSave={handleSaveGoal}
        onSaveOpponentGoal={handleSaveGoal}
        goal={selectedGoal}
        gamePlayers={activeGamePlayers}
        existingGoals={goals}
        matchDuration={matchDuration.regularTime + matchDuration.firstHalfExtraTime + matchDuration.secondHalfExtraTime}
        isReadOnly={isDone}
        game={game}
        timeline={timeline}
        startingLineup={startingLineupMap}
        squadPlayers={squadPlayersMap}
      />

      <SubstitutionDialog
        isOpen={showSubstitutionDialog}
        onClose={() => {
          setShowSubstitutionDialog(false);
          setSelectedSubstitution(null);
        }}
        onSave={handleSaveSubstitution}
        substitution={selectedSubstitution}
        playersOnPitch={Object.values(formation).filter(player => player && player._id)}
        benchPlayers={benchPlayers}
        matchDuration={matchDuration.regularTime + matchDuration.firstHalfExtraTime + matchDuration.secondHalfExtraTime}
        isReadOnly={isDone}
        playerReports={localPlayerReports}
        timeline={timeline}
        startingLineup={startingLineupMap}
        squadPlayers={squadPlayersMap}
      />

      <CardDialog
        isOpen={showCardDialog}
        onClose={() => {
          setShowCardDialog(false);
          setSelectedCard(null);
        }}
        onSave={handleSaveCard}
        card={selectedCard}
        gamePlayers={activeGamePlayers}
        cards={cards}
        matchDuration={matchDuration.regularTime + matchDuration.firstHalfExtraTime + matchDuration.secondHalfExtraTime}
        isReadOnly={isDone}
        game={game}
      />

      <ConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        title={confirmationConfig.title}
        message={confirmationConfig.message}
        confirmText={confirmationConfig.confirmText}
        cancelText={confirmationConfig.cancelText}
        onConfirm={handleConfirmation}
        onCancel={handleConfirmationCancel}
        type={confirmationConfig.type}
        isLoading={isSaving}
      />
    </div>
  );
}

