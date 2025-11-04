import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useData } from "@/app/providers/DataProvider";

// Import formation configurations
import { formations } from "./formations";

// Import validation utilities
import { 
  validateSquad, 
  validatePlayerPosition, 
  validateMinutesPlayed, 
  validateGoalsScored, 
  validateReportCompleteness,
  validateStartingLineup,
  validateGoalkeeper
} from "../../utils/squadValidation";
import {
  validateMinutesForSubmission,
  getMinutesSummary
} from "../../utils/minutesValidation";

// Import shared components
import { ConfirmationModal } from "@/shared/components";

// Import modular components
import GameDetailsHeader from "./components/GameDetailsHeader";
import GameDayRosterSidebar from "./components/GameDayRosterSidebar";
import TacticalBoard from "./components/TacticalBoard";
import MatchAnalysisSidebar from "./components/MatchAnalysisSidebar";
import PlayerPerformanceDialog from "./components/dialogs/PlayerPerformanceDialog";
import FinalReportDialog from "./components/dialogs/FinalReportDialog";
import PlayerSelectionDialog from "./components/dialogs/PlayerSelectionDialog";
import TeamSummaryDialog from "./components/dialogs/TeamSummaryDialog";
import GoalDialog from "./components/dialogs/GoalDialog";
import SubstitutionDialog from "./components/dialogs/SubstitutionDialog";

// Import API functions
import { fetchGoals, createGoal, updateGoal, deleteGoal } from "../../api/goalsApi";
import { fetchSubstitutions, createSubstitution, updateSubstitution, deleteSubstitution } from "../../api/substitutionsApi";

export default function GameDetails() {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("id");
  const { games, players, teams, gameRosters, gameReports, refreshData, isLoading, error } = useData();

  // Main state
  const [game, setGame] = useState(null);
  const [gamePlayers, setGamePlayers] = useState([]);
  const [localRosterStatuses, setLocalRosterStatuses] = useState({});
  const [formationType, setFormationType] = useState("1-4-4-2");
  const [formation, setFormation] = useState({});
  const [localPlayerReports, setLocalPlayerReports] = useState({});
  const [finalScore, setFinalScore] = useState({ ourScore: 0, opponentScore: 0 });
  const [matchDuration, setMatchDuration] = useState({
    regularTime: 90,
    firstHalfExtraTime: 0,
    secondHalfExtraTime: 0
  });
  const [teamSummary, setTeamSummary] = useState({
    defenseSummary: "",
    midfieldSummary: "",
    attackSummary: "",
    generalSummary: "",
  });
  
  // Goals state
  const [goals, setGoals] = useState([]);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  
  // Substitutions state
  const [substitutions, setSubstitutions] = useState([]);
  const [showSubstitutionDialog, setShowSubstitutionDialog] = useState(false);
  const [selectedSubstitution, setSelectedSubstitution] = useState(null);
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
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

  // Get current formation positions
  const positions = useMemo(() => formations[formationType]?.positions || {}, [formationType]);

  // Load game data
  useEffect(() => {
    if (!gameId || !games || games.length === 0) return;

    const foundGame = games.find((g) => g._id === gameId);
    if (foundGame) {
      // 🔍 DEBUG: Log backend game data
      console.log('🔍 [GameDetails] Backend game data:', {
        gameId: foundGame._id,
        status: foundGame.status,
        matchDuration: foundGame.matchDuration,
        hasMatchDuration: !!foundGame.matchDuration,
        matchDurationType: typeof foundGame.matchDuration,
        matchDurationKeys: foundGame.matchDuration ? Object.keys(foundGame.matchDuration) : null
      });
      
      // Initialize match duration from game data FIRST (before setting game)
      // This ensures we have the correct matchDuration before game object is set
      const gameMatchDuration = foundGame.matchDuration || {};
      const loadedMatchDuration = {
        regularTime: gameMatchDuration.regularTime || 90,
        firstHalfExtraTime: gameMatchDuration.firstHalfExtraTime || 0,
        secondHalfExtraTime: gameMatchDuration.secondHalfExtraTime || 0,
      };
      
      // 🔍 DEBUG: Log loaded matchDuration
      console.log('🔍 [GameDetails] Loaded matchDuration state:', loadedMatchDuration);
      console.log('🔍 [GameDetails] Calculated total:', loadedMatchDuration.regularTime + loadedMatchDuration.firstHalfExtraTime + loadedMatchDuration.secondHalfExtraTime);
      
      setMatchDuration(loadedMatchDuration);
      
      // Set game object, ensuring matchDuration is included
      setGame({
        ...foundGame,
        matchDuration: loadedMatchDuration
      });
      setIsReadOnly(foundGame.status === "Done");
      
      // Initialize score from game data if available, otherwise will be calculated from goals
      if (foundGame.ourScore !== null && foundGame.ourScore !== undefined) {
        setFinalScore({
          ourScore: foundGame.ourScore || 0,
          opponentScore: foundGame.opponentScore || 0,
        });
      } else {
        // If no score stored, initialize to 0-0 (will be calculated from goals)
        setFinalScore({
          ourScore: 0,
          opponentScore: 0,
        });
      }
      
      if (foundGame.defenseSummary || foundGame.midfieldSummary || foundGame.attackSummary || foundGame.generalSummary) {
        setTeamSummary({
          defenseSummary: foundGame.defenseSummary || "",
          midfieldSummary: foundGame.midfieldSummary || "",
          attackSummary: foundGame.attackSummary || "",
          generalSummary: foundGame.generalSummary || "",
        });
      }
    }
  }, [gameId, games]);

  // Load team players
  useEffect(() => {
    if (!game || !players || players.length === 0) return;

    const teamObj = game.team || game.Team || game.teamId || game.TeamId;
    const teamId = typeof teamObj === "object" ? teamObj._id : teamObj;

    if (!teamId) return;

    const teamPlayers = players.filter((player) => {
      const playerTeamObj = player.team || player.Team || player.teamId || player.TeamId;
      const playerTeamId = typeof playerTeamObj === "object" ? playerTeamObj._id : playerTeamObj;
      return playerTeamId === teamId;
    });

    setGamePlayers(teamPlayers);
  }, [game, players]);

  // Load existing roster statuses
  useEffect(() => {
    if (!gameId || !gameRosters || gameRosters.length === 0 || gamePlayers.length === 0) return;

    const rosterForGame = gameRosters.filter(
      (roster) => {
        const rosterGameId = typeof roster.game === "object" ? roster.game._id : roster.game;
        return rosterGameId === gameId;
      }
    );

    if (rosterForGame.length > 0) {
      const statuses = {};
      rosterForGame.forEach((roster) => {
        const playerId = typeof roster.player === "object" ? roster.player._id : roster.player;
        statuses[playerId] = roster.status;
      });
      setLocalRosterStatuses(statuses);
    } else {
      const initialStatuses = {};
      gamePlayers.forEach((player) => {
        initialStatuses[player._id] = "Not in Squad";
      });
      setLocalRosterStatuses(initialStatuses);
    }
  }, [gameId, gameRosters, gamePlayers]);

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
    
    loadGoals();
    loadSubstitutions();
  }, [gameId, game]);

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
      const reportGameId = typeof report.game === "object" ? report.game._id : report.game;
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
        const playerId = typeof report.player === "object" ? report.player._id : report.player;
        reports[playerId] = {
          minutesPlayed: report.minutesPlayed || 0,
          goals: report.goals || 0,
          assists: report.assists || 0,
          rating: Math.round((report.rating_physical + report.rating_technical + report.rating_tactical + report.rating_mental) / 4),
          notes: report.notes || "",
        };
      });
      
      // 🔍 DEBUG: Log loaded reports
      console.log('🔍 [GameDetails] Setting localPlayerReports:', {
        reportCount: Object.keys(reports).length,
        playerIds: Object.keys(reports),
        sampleReport: Object.values(reports)[0]
      });
      
      setLocalPlayerReports(reports);
    } else {
      console.log('🔍 [GameDetails] No reports found for this game');
    }
  }, [gameId, gameReports, isLoading]);

  // Auto-build formation from roster (only when NOT in manual mode)
  useEffect(() => {
    if (!gamePlayers || gamePlayers.length === 0) return;
    if (manualFormationMode) {
      console.log('⚠️ Manual formation mode - skipping auto-build');
      return;
    }

    console.log('🤖 Auto-building formation from roster...');
    const newFormation = {};
    Object.entries(positions).forEach(([posId, posData]) => {
      const matchingPlayer = gamePlayers.find((player) => {
        const isStarting = localRosterStatuses[player._id] === "Starting Lineup";
        const notYetPlaced = !Object.values(newFormation).some((p) => p?._id === player._id);
        const positionMatch = player.position === posData.type || player.position === posData.label;
        return isStarting && notYetPlaced && positionMatch;
      });

      if (matchingPlayer) {
        newFormation[posId] = matchingPlayer;
      } else {
        newFormation[posId] = null;
      }
    });

    setFormation(newFormation);
  }, [positions, gamePlayers, localRosterStatuses, manualFormationMode]);

  // Helper: Get player status
  const getPlayerStatus = (playerId) => {
    return localRosterStatuses[playerId] || "Not in Squad";
  };

  // Helper: Update player status
  const updatePlayerStatus = async (playerId, newStatus) => {
    setLocalRosterStatuses((prev) => ({ ...prev, [playerId]: newStatus }));
    
    try {
      const response = await fetch(`http://localhost:3001/api/game-rosters/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          gameId,
          rosters: [{
            playerId,
            playerName: gamePlayers.find(p => p._id === playerId)?.fullName || gamePlayers.find(p => p._id === playerId)?.name || 'Unknown Player',
            gameTitle: game.gameTitle || game.GameTitle || game.title || game.teamName || 'Unknown Game',
            rosterEntry: newStatus,
            status: newStatus
          }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Backend auto-save error response:', errorText);
        console.error("Failed to auto-save roster status");
      }
    } catch (error) {
      console.error("Error auto-saving roster status:", error);
    }
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

  // Helper: Check if player has report
  const hasReport = (playerId) => {
    return localPlayerReports[playerId] !== undefined && localPlayerReports[playerId].minutesPlayed !== undefined;
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
    goals.forEach((goal) => {
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

    // Calculate top rated player from reports
    Object.entries(localPlayerReports).forEach(([playerId, report]) => {
      const player = gamePlayers.find((p) => p._id === playerId);
      if (!player) return;

      if (report.rating > maxRating) {
        maxRating = report.rating;
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
    
    // If all validations pass, proceed directly
    await executeGameWasPlayed();
  };

  // Execute the actual game was played logic
  const executeGameWasPlayed = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`http://localhost:3001/api/games/${gameId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ status: "Played" }),
      });

      if (!response.ok) throw new Error("Failed to update game status");

      const rosterUpdates = gamePlayers.map((player) => ({
        playerId: player._id,
        playerName: player.fullName || player.name || 'Unknown Player',
        gameTitle: game.gameTitle || game.GameTitle || game.title || game.teamName || 'Unknown Game',
        rosterEntry: getPlayerStatus(player._id),
        status: getPlayerStatus(player._id),
      }));

      console.log('🔍 Game object structure:', game);
      console.log('🔍 Game properties:', Object.keys(game));
      console.log('🔍 Game title fallback:', game.gameTitle || game.GameTitle || game.title || game.teamName || 'Unknown Game');
      console.log('🔍 Sample player data:', gamePlayers[0]);
      console.log('🔍 Player name fallback:', gamePlayers[0]?.fullName || gamePlayers[0]?.name || 'Unknown Player');
      console.log('🔍 Roster updates being sent:', rosterUpdates);
      console.log('🔍 First roster item details:', JSON.stringify(rosterUpdates[0], null, 2));

      const rosterResponse = await fetch(`http://localhost:3001/api/game-rosters/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ gameId, rosters: rosterUpdates }),
      });

      if (!rosterResponse.ok) {
        const errorText = await rosterResponse.text();
        console.error('🔍 Backend roster error response:', errorText);
        throw new Error(`Failed to update rosters: ${rosterResponse.status} - ${errorText}`);
      }

      await refreshData();
      setGame((prev) => ({ ...prev, status: "Played" }));
    } catch (error) {
      console.error("Error updating game:", error);
      showConfirmation({
        title: "Error",
        message: "Failed to update game status",
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
    setPlayerPerfData({
      minutesPlayed: existingReport.minutesPlayed || 0,
      goals: existingReport.goals || 0,
      assists: existingReport.assists || 0,
      rating: existingReport.rating || 3,
      notes: existingReport.notes || "",
    });
    setShowPlayerPerfDialog(true);
  };

  const handleSavePerformanceReport = async () => {
    if (!selectedPlayer) return;

    setLocalPlayerReports((prev) => ({
      ...prev,
      [selectedPlayer._id]: playerPerfData,
    }));

    try {
      const response = await fetch(`http://localhost:3001/api/game-reports/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          gameId,
          reports: [{
            playerId: selectedPlayer._id,
            minutesPlayed: playerPerfData.minutesPlayed,
            goals: playerPerfData.goals,
            assists: playerPerfData.assists,
            rating_physical: playerPerfData.rating,
            rating_technical: playerPerfData.rating,
            rating_tactical: playerPerfData.rating,
            rating_mental: playerPerfData.rating,
            notes: playerPerfData.notes,
          }],
        }),
      });

      if (!response.ok) {
        console.error("Failed to auto-save performance report");
      }
    } catch (error) {
      console.error("Error auto-saving performance report:", error);
    }

    setShowPlayerPerfDialog(false);
    setSelectedPlayer(null);
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

      const reportUpdates = Object.entries(localPlayerReports).map(([playerId, report]) => ({
        playerId,
        minutesPlayed: report.minutesPlayed,
        goals: report.goals,
        assists: report.assists,
        rating_physical: report.rating,
        rating_technical: report.rating,
        rating_tactical: report.rating,
        rating_mental: report.rating,
        notes: report.notes,
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
      setShowSubstitutionDialog(false);
      setSelectedSubstitution(null);
    } catch (error) {
      console.error('Error saving substitution:', error);
      throw error; // Re-throw to let SubstitutionDialog handle it
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

    // 2. Goals scored validation
    const goalsValidation = validateGoalsScored(finalScore, localPlayerReports);
    if (!goalsValidation.isValid) {
      hasErrors = true;
      validations.push(goalsValidation.message);
    }
    if (goalsValidation.needsConfirmation) {
      needsConfirmation = true;
      confirmationMessage = goalsValidation.confirmationMessage;
    }

    // 3. Team minutes validation
    // Pass all players (starting lineup + bench) for proper name lookup
    // Create a temporary game object with current matchDuration for validation
    const gameWithMatchDuration = {
      ...game,
      matchDuration: matchDuration
    };
    const allPlayers = [...playersOnPitch, ...benchPlayers];
    const minutesValidation = validateMinutesForSubmission(
      localPlayerReports, 
      gameWithMatchDuration, 
      allPlayers
    );
    if (!minutesValidation.isValid) {
      hasErrors = true;
      validations.push(...minutesValidation.errors);
    }
    if (minutesValidation.warnings.length > 0) {
      validations.push(...minutesValidation.warnings.map(w => `⚠️ ${w}`));
    }

    // 4. Team summaries validation
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

  // Render loading/error states
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-cyan-400 text-lg">Loading game details...</div>
      </div>
    );
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

  const isScheduled = game.status === "Scheduled";
  const isPlayed = game.status === "Played";
  const isDone = game.status === "Done" || isReadOnly;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
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
      <div className="flex h-[calc(100vh-120px)]">
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
        <div className="flex-1 bg-slate-900/95 backdrop-blur-sm">
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
        </div>

        {/* Right Sidebar - Match Analysis */}
        <MatchAnalysisSidebar
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
          matchDuration={matchDuration}
          setMatchDuration={setMatchDuration}
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
        onSaveOpponentGoal={handleSaveOpponentGoal}
        goal={selectedGoal}
        gamePlayers={activeGamePlayers}
        existingGoals={goals}
        matchDuration={matchDuration.regularTime + matchDuration.firstHalfExtraTime + matchDuration.secondHalfExtraTime}
        isReadOnly={isDone}
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
      />

      {/* Confirmation Modal for Validations */}
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

