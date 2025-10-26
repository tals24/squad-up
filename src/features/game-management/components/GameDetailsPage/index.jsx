import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useData } from "@/app/providers/DataProvider";

// Import formation configurations
import { formations } from "./formations";

// Import validation utilities
import { validateSquad, validatePlayerPosition } from "../../utils/squadValidation";

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
  const [teamSummary, setTeamSummary] = useState({
    defenseSummary: "",
    midfieldSummary: "",
    attackSummary: "",
    generalSummary: "",
  });
  
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
      setGame(foundGame);
      setIsReadOnly(foundGame.status === "Done");
      
      if (foundGame.ourScore !== null) {
        setFinalScore({
          ourScore: foundGame.ourScore || 0,
          opponentScore: foundGame.opponentScore || 0,
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

  // Load existing game reports
  useEffect(() => {
    if (!gameId || !gameReports || gameReports.length === 0) return;

    const reportsForGame = gameReports.filter((report) => {
      const reportGameId = typeof report.game === "object" ? report.game._id : report.game;
      return reportGameId === gameId;
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
      setLocalPlayerReports(reports);
    }
  }, [gameId, gameReports]);

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
    const scorers = [];
    const assists = [];
    let topRated = null;
    let maxRating = 0;

    Object.entries(localPlayerReports).forEach(([playerId, report]) => {
      const player = gamePlayers.find((p) => p._id === playerId);
      if (!player) return;

      if (report.goals > 0) {
        scorers.push({ name: player.fullName, count: report.goals });
      }
      if (report.assists > 0) {
        assists.push({ name: player.fullName, count: report.assists });
      }
      if (report.rating > maxRating) {
        maxRating = report.rating;
        topRated = player.fullName;
      }
    });

    return { scorers, assists, topRated };
  }, [localPlayerReports, gamePlayers]);

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
    if (missingReportsCount > 0) {
      showConfirmation({
        title: "Missing Reports",
        message: `${missingReportsCount} player reports are missing`,
        confirmText: "OK",
        cancelText: null,
        onConfirm: () => setShowConfirmationModal(false),
        onCancel: null,
        type: "warning"
      });
      return;
    }

    if (finalScore.ourScore === null || finalScore.opponentScore === null) {
      showConfirmation({
        title: "Missing Score",
        message: "Please enter the final score",
        confirmText: "OK",
        cancelText: null,
        onConfirm: () => setShowConfirmationModal(false),
        onCancel: null,
        type: "warning"
      });
      return;
    }

    if (!areAllTeamSummariesFilled()) {
      showConfirmation({
        title: "Incomplete Team Summaries",
        message: "Please fill in all team summary reports (Defense, Midfield, Attack, and General) before submitting the final report",
        confirmText: "OK",
        cancelText: null,
        onConfirm: () => setShowConfirmationModal(false),
        onCancel: null,
        type: "warning"
      });
      return;
    }

    setShowFinalReportDialog(true);
  };

  const handleConfirmFinalSubmission = async () => {
    setIsSaving(true);
    try {
      const gameResponse = await fetch(`http://localhost:3001/api/games/${gameId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          status: "Done",
          ourScore: finalScore.ourScore,
          opponentScore: finalScore.opponentScore,
          defenseSummary: teamSummary.defenseSummary,
          midfieldSummary: teamSummary.midfieldSummary,
          attackSummary: teamSummary.attackSummary,
          generalSummary: teamSummary.generalSummary,
        }),
      });

      if (!gameResponse.ok) throw new Error("Failed to update game");

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

      if (!reportsResponse.ok) throw new Error("Failed to update reports");

      await refreshData();
      setIsReadOnly(true);
      setShowFinalReportDialog(false);
      setGame((prev) => ({ ...prev, status: "Done" }));
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
      showConfirmation({
        title: "Error",
        message: "Failed to submit final report",
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
            hasReport={hasReport}
            needsReport={needsReport}
          />
        </div>

        {/* Right Sidebar - Match Analysis */}
        <MatchAnalysisSidebar
          isPlayed={isPlayed}
          isDone={isDone}
          matchStats={matchStats}
          teamSummary={teamSummary}
          setTeamSummary={setTeamSummary}
          onTeamSummaryClick={handleTeamSummaryClick}
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

