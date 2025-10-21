import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useData } from "../../components/DataContext";

// Import formation configurations
import { formations } from "./formations";

// Import modular components
import GameDetailsHeader from "./components/GameDetailsHeader";
import GameDayRosterSidebar from "./components/GameDayRosterSidebar";
import TacticalBoard from "./components/TacticalBoard";
import MatchAnalysisSidebar from "./components/MatchAnalysisSidebar";
import PlayerPerformanceDialog from "./components/dialogs/PlayerPerformanceDialog";
import FinalReportDialog from "./components/dialogs/FinalReportDialog";
import PlayerSelectionDialog from "./components/dialogs/PlayerSelectionDialog";

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
          rosters: [{ playerId, status: newStatus }],
        }),
      });

      if (!response.ok) {
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
  const handleGameWasPlayed = async () => {
    if (!game) return;
    
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
        status: getPlayerStatus(player._id),
      }));

      const rosterResponse = await fetch(`http://localhost:3001/api/game-rosters/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ gameId, rosters: rosterUpdates }),
      });

      if (!rosterResponse.ok) throw new Error("Failed to update rosters");

      await refreshData();
      setGame((prev) => ({ ...prev, status: "Played" }));
    } catch (error) {
      console.error("Error updating game:", error);
      alert("Failed to update game status");
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
      alert("Failed to postpone game");
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
      alert(`${missingReportsCount} player reports are missing`);
      return;
    }

    if (finalScore.ourScore === null || finalScore.opponentScore === null) {
      alert("Please enter the final score");
      return;
    }

    if (!teamSummary.defenseSummary || !teamSummary.midfieldSummary || !teamSummary.attackSummary || !teamSummary.generalSummary) {
      alert("Please fill in all team summary fields");
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
      alert("Final report submitted successfully!");
    } catch (error) {
      console.error("Error submitting final report:", error);
      alert("Failed to submit final report");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditReport = () => {
    setIsReadOnly(false);
    setGame((prev) => ({ ...prev, status: "Played" }));
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
    
    console.log(`✅ Assigning player ${draggedPlayer.fullName} to position ${posId}`);
    
    setFormation((prev) => {
      const updated = { ...prev };
      
      Object.keys(updated).forEach((key) => {
        if (updated[key]?._id === draggedPlayer._id) {
          console.log(`🧹 Removing ${draggedPlayer.fullName} from position ${key}`);
          updated[key] = null;
        }
      });
      
      updated[posId] = draggedPlayer;
      
      console.log('🔄 Formation updated:', Object.entries(updated).filter(([_, p]) => p !== null).map(([pos, p]) => ({ pos, player: p.fullName })));
      return updated;
    });
    
    updatePlayerStatus(draggedPlayer._id, "Starting Lineup");
    
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
    updatePlayerStatus(player._id, "Playing");
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
    </div>
  );
}

