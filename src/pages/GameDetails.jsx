import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useData } from "../components/DataContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Trophy,
  Zap,
  Play,
  Ban,
  Save,
  Edit,
  MoreVertical,
  AlertCircle,
  Check,
  Star,
} from "lucide-react";

// Formation configurations
const formations = {
  "1-4-4-2": {
    name: "1-4-4-2",
    positions: {
      gk: { x: 50, y: 85, label: "GK", type: "Goalkeeper" },
      lb: { x: 15, y: 65, label: "LB", type: "Defender" },
      cb1: { x: 35, y: 65, label: "CB", type: "Defender" },
      cb2: { x: 65, y: 65, label: "CB", type: "Defender" },
      rb: { x: 85, y: 65, label: "RB", type: "Defender" },
      lm: { x: 15, y: 40, label: "LM", type: "Midfielder" },
      cm1: { x: 35, y: 45, label: "CM", type: "Midfielder" },
      cm2: { x: 65, y: 45, label: "CM", type: "Midfielder" },
      rm: { x: 85, y: 40, label: "RM", type: "Midfielder" },
      st1: { x: 35, y: 20, label: "ST", type: "Forward" },
      st2: { x: 65, y: 20, label: "ST", type: "Forward" },
    },
  },
  "1-4-3-3": {
    name: "1-4-3-3",
    positions: {
      gk: { x: 50, y: 85, label: "GK", type: "Goalkeeper" },
      lb: { x: 15, y: 65, label: "LB", type: "Defender" },
      cb1: { x: 35, y: 65, label: "CB", type: "Defender" },
      cb2: { x: 65, y: 65, label: "CB", type: "Defender" },
      rb: { x: 85, y: 65, label: "RB", type: "Defender" },
      cm1: { x: 30, y: 45, label: "CM", type: "Midfielder" },
      cm2: { x: 50, y: 45, label: "CM", type: "Midfielder" },
      cm3: { x: 70, y: 45, label: "CM", type: "Midfielder" },
      lw: { x: 15, y: 20, label: "LW", type: "Forward" },
      st: { x: 50, y: 15, label: "ST", type: "Forward" },
      rw: { x: 85, y: 20, label: "RW", type: "Forward" },
    },
  },
  "1-3-5-2": {
    name: "1-3-5-2",
    positions: {
      gk: { x: 50, y: 85, label: "GK", type: "Goalkeeper" },
      cb1: { x: 25, y: 65, label: "CB", type: "Defender" },
      cb2: { x: 50, y: 65, label: "CB", type: "Defender" },
      cb3: { x: 75, y: 65, label: "CB", type: "Defender" },
      lwb: { x: 10, y: 45, label: "LWB", type: "Midfielder" },
      cm1: { x: 30, y: 45, label: "CM", type: "Midfielder" },
      cm2: { x: 50, y: 45, label: "CM", type: "Midfielder" },
      cm3: { x: 70, y: 45, label: "CM", type: "Midfielder" },
      rwb: { x: 90, y: 45, label: "RWB", type: "Midfielder" },
      st1: { x: 35, y: 20, label: "ST", type: "Forward" },
      st2: { x: 65, y: 20, label: "ST", type: "Forward" },
    },
  },
};

export default function GameDetails() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
  const [statusPopoverPlayerId, setStatusPopoverPlayerId] = useState(null);
  const [showPlayerSelectionModal, setShowPlayerSelectionModal] = useState(false);
  const [selectedPositionId, setSelectedPositionId] = useState(null);
  const [selectedPositionData, setSelectedPositionData] = useState(null);
  const [draggedPlayer, setDraggedPlayer] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [manualFormationMode, setManualFormationMode] = useState(false); // Flag to disable auto-build

  // Get current formation positions
  const positions = useMemo(() => formations[formationType]?.positions || {}, [formationType]);

  // Load game data
  useEffect(() => {
    if (!gameId || !games || games.length === 0) return;

    const foundGame = games.find((g) => g._id === gameId);
    if (foundGame) {
      setGame(foundGame);
      setIsReadOnly(foundGame.status === "Done");
      
      // Load scores and summaries if available
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
      // Initialize all players as "Not in Squad"
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
      return; // Skip auto-build if user is manually placing players
    }

    console.log('🤖 Auto-building formation from roster...');
    const newFormation = {};
    Object.entries(positions).forEach(([posId, posData]) => {
      // Find a player assigned to Starting Lineup who matches position and isn't already placed
      const matchingPlayer = gamePlayers.find((player) => {
        const isStarting = localRosterStatuses[player._id] === "Starting Lineup";
        const notYetPlaced = !Object.values(newFormation).some((p) => p?._id === player._id);
        // Simple position matching logic (can be improved)
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
    
    // Auto-save to backend (draft mode)
    try {
      const response = await fetch(`http://localhost:3001/api/game-rosters/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
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
      return !isOnPitch && !isBench; // Show all players not on pitch and not on bench
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
      // Update game status
      const response = await fetch(`http://localhost:3001/api/games/${gameId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: "Played" }),
      });

      if (!response.ok) throw new Error("Failed to update game status");

      // Batch update all rosters
      const rosterUpdates = gamePlayers.map((player) => ({
        playerId: player._id,
        status: getPlayerStatus(player._id),
      }));

      const rosterResponse = await fetch(`http://localhost:3001/api/game-rosters/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
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
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: "Postponed" }),
      });

      if (!response.ok) throw new Error("Failed to postpone game");

      await refreshData();
      navigate("/GamesSchedule");
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

    // Update local state
    setLocalPlayerReports((prev) => ({
      ...prev,
      [selectedPlayer._id]: playerPerfData,
    }));

    // Auto-save to backend
    try {
      const response = await fetch(`http://localhost:3001/api/game-reports/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
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
    // Validation
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
      // Update game with scores and summaries
      const gameResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/games/${gameId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
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

      // Batch update all reports
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

      const reportsResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/game-reports/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
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
    e.dataTransfer.setData("text/plain", player._id); // Use player ID for safer transfer
    setDraggedPlayer(player);
    setIsDragging(true);
    setManualFormationMode(true); // Enable manual mode when user starts dragging
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
    
    // First, remove player from any other position
    setFormation((prev) => {
      const updated = { ...prev };
      
      // Remove player from all positions first
      Object.keys(updated).forEach((key) => {
        if (updated[key]?._id === draggedPlayer._id) {
          console.log(`🧹 Removing ${draggedPlayer.fullName} from position ${key}`);
          updated[key] = null;
        }
      });
      
      // Then assign to new position
      updated[posId] = draggedPlayer;
      
      console.log('🔄 Formation updated:', Object.entries(updated).filter(([_, p]) => p !== null).map(([pos, p]) => ({ pos, player: p.fullName })));
      return updated;
    });
    
    // Update player status to "Starting Lineup"
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

  // Formation change handler
  const handleFormationChange = (newFormationType) => {
    if (window.confirm("Changing formation will clear all current position assignments. Continue?")) {
      setFormationType(newFormationType);
      setFormation({});
    }
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

  // Format date
  const formattedDate = new Date(game.date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800 shadow-xl backdrop-blur-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/GamesSchedule")}
                className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {game.gameTitle || `${game.teamName} vs ${game.opponent}`}
                </h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    {formattedDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    {game.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-cyan-400" />
                    vs {game.opponent}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Status + Score + Actions */}
            <div className="flex items-center gap-4">
              {/* Status Badge */}
              <Badge
                variant="outline"
                className={`
                  ${game.status === "Scheduled" ? "border-blue-500 text-blue-400" : ""}
                  ${game.status === "Played" ? "border-yellow-500 text-yellow-400 animate-pulse" : ""}
                  ${game.status === "Done" ? "border-green-500 text-green-400" : ""}
                  ${game.status === "Postponed" ? "border-gray-500 text-gray-400" : ""}
                `}
              >
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  game.status === "Scheduled" ? "bg-blue-500" : ""
                }${game.status === "Played" ? "bg-yellow-500 animate-pulse" : ""}${
                  game.status === "Done" ? "bg-green-500" : ""
                }${game.status === "Postponed" ? "bg-gray-500" : ""}`} />
                {game.status}
              </Badge>

              {/* Final Score (Read-only) */}
              {isDone && (
                <div className="text-center bg-gradient-to-r from-cyan-500/10 to-blue-500/10 px-6 py-2 rounded-lg border border-cyan-500/30">
                  <div className="text-3xl font-bold text-white">
                    {finalScore.ourScore} - {finalScore.opponentScore}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {game.teamName} vs {game.opponent}
                  </div>
                </div>
              )}

              {/* Score Input (Editable - Played only) */}
              {isPlayed && !isDone && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">Score:</span>
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    value={finalScore.ourScore}
                    onChange={(e) => setFinalScore((prev) => ({ ...prev, ourScore: parseInt(e.target.value) || 0 }))}
                    className="w-16 text-center bg-slate-800 border-slate-700 text-white"
                  />
                  <span className="text-slate-400">-</span>
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    value={finalScore.opponentScore}
                    onChange={(e) => setFinalScore((prev) => ({ ...prev, opponentScore: parseInt(e.target.value) || 0 }))}
                    className="w-16 text-center bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              )}

              {/* Action Buttons */}
              {isScheduled && (
                <>
                  <Button
                    onClick={handleGameWasPlayed}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/30"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Game Was Played
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePostpone}
                    className="border-orange-500 text-orange-400 hover:bg-orange-500/10"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Postpone
                  </Button>
                </>
              )}

              {isPlayed && !isDone && (
                <Button
                  onClick={handleSubmitFinalReport}
                  disabled={isSaving || missingReportsCount > 0 || !finalScore.ourScore === null || !teamSummary.defenseSummary}
                  className={`
                    ${missingReportsCount > 0 || !finalScore.ourScore === null || !teamSummary.defenseSummary
                      ? "bg-slate-700 text-slate-400"
                      : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/30"
                    }
                  `}
                >
                  {missingReportsCount > 0 ? (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {missingReportsCount} Reports Missing
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Submit Final Report
                    </>
                  )}
                </Button>
              )}

              {isDone && (
                <Button
                  variant="outline"
                  onClick={handleEditReport}
                  className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Report
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="grid grid-cols-[280px_1fr_280px] gap-6 h-[calc(100vh-180px)]">
          {/* Left Sidebar - Roster */}
          <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-700/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                Game Day Roster
              </h2>
              {isScheduled && (
                <p className="text-xs text-slate-400 mt-1">Drag players to the formation or click to assign</p>
              )}
            </div>

            <div 
              className="flex-1 overflow-y-auto p-4 space-y-6"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(148, 163, 184, 0.2) transparent'
              }}
            >
              {/* Players on Pitch */}
              {playersOnPitch.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                    Players on Pitch
                    <Badge variant="secondary" className="text-xs bg-green-600/20 text-green-400 border-green-600/30">{playersOnPitch.length}</Badge>
                  </h3>
                  <div className="space-y-2">
                    {playersOnPitch.map((player) => (
                      <PlayerCard
                        key={player._id}
                        player={player}
                        status="Starting Lineup"
                        hasReport={hasReport(player._id)}
                        needsReport={needsReport(player._id)}
                        onOpenPerformance={() => handleOpenPerformanceDialog(player)}
                        isScheduled={isScheduled}
                        isPlayed={isPlayed}
                        isReadOnly={isDone}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Bench Players */}
              {benchPlayers.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                    Bench
                    <Badge variant="secondary" className="text-xs bg-blue-600/20 text-blue-400 border-blue-600/30">{benchPlayers.length}</Badge>
                  </h3>
                  <div className="space-y-2">
                    {benchPlayers.map((player) => (
                      <PlayerCard
                        key={player._id}
                        player={player}
                        status="Bench"
                        hasReport={hasReport(player._id)}
                        needsReport={needsReport(player._id)}
                        onOpenPerformance={() => handleOpenPerformanceDialog(player)}
                        onStatusChange={(newStatus) => updatePlayerStatus(player._id, newStatus)}
                        onDragStart={(e) => handleDragStart(e, player)}
                        onDragEnd={handleDragEnd}
                        isScheduled={isScheduled}
                        isPlayed={isPlayed}
                        isReadOnly={isDone}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Squad Players */}
              {squadPlayers.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
                    Squad Players
                    <Badge variant="secondary" className="text-xs bg-slate-600/20 text-slate-400 border-slate-600/30">{squadPlayers.length}</Badge>
                  </h3>
                  <div className="space-y-2">
                    {squadPlayers.map((player) => (
                      <PlayerCard
                        key={player._id}
                        player={player}
                        status={getPlayerStatus(player._id)}
                        hasReport={hasReport(player._id)}
                        needsReport={needsReport(player._id)}
                        onOpenPerformance={() => handleOpenPerformanceDialog(player)}
                        onStatusChange={(newStatus) => updatePlayerStatus(player._id, newStatus)}
                        onDragStart={(e) => handleDragStart(e, player)}
                        onDragEnd={handleDragEnd}
                        isScheduled={isScheduled}
                        isPlayed={isPlayed}
                        isReadOnly={isDone}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center - Tactical Board */}
          <TacticalBoard
            formations={formations}
            formationType={formationType}
            positions={positions}
            formation={formation}
            onFormationChange={handleFormationChange}
            onPositionDrop={handlePositionDrop}
            onRemovePlayer={handleRemovePlayerFromPosition}
            onPlayerClick={handleOpenPerformanceDialog}
            isDragging={isDragging}
            isScheduled={isScheduled}
            isPlayed={isPlayed}
            isReadOnly={isDone}
            hasReport={hasReport}
            needsReport={needsReport}
          />

          {/* Right Sidebar - Stats & Summaries */}
          <div 
            className="space-y-4 overflow-y-auto"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(148, 163, 184, 0.2) transparent'
            }}
          >
            {/* Match Stats - Only show for Played/Done */}
            {(isPlayed || isDone) && (
              <Card className="bg-slate-900/90 backdrop-blur-sm border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    Match Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> Scorers
                    </h4>
                    {matchStats.scorers.length > 0 ? (
                      <div className="text-sm text-white">
                        {matchStats.scorers.map((scorer, i) => (
                          <div key={i}>{scorer.name} ({scorer.count})</div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">None</div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Assists
                    </h4>
                    {matchStats.assists.length > 0 ? (
                      <div className="text-sm text-white">
                        {matchStats.assists.map((assist, i) => (
                          <div key={i}>{assist.name} ({assist.count})</div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">None</div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                      <Star className="w-3 h-3" /> Top Rated (MVP)
                    </h4>
                    <div className="text-sm text-white">
                      {matchStats.topRated || "None"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Summary */}
            <Card className="bg-slate-900/90 backdrop-blur-sm border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  AI Match Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400">
                  The AI will analyze all player reports and team summaries to generate a concise, three-sentence summary of the match.
                </p>
                <p className="text-xs text-slate-500 mt-2 italic">
                  (This component will be implemented in a future step, integrating with an LLM)
                </p>
              </CardContent>
            </Card>

            {/* Team Summaries - Only for Played/Done */}
            {(isPlayed || isDone) && (
              <Card className="bg-slate-900/90 backdrop-blur-sm border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold text-white">Team Summaries</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1 block">Defense</label>
                    <Textarea
                      value={teamSummary.defenseSummary}
                      onChange={(e) => setTeamSummary((prev) => ({ ...prev, defenseSummary: e.target.value }))}
                      disabled={isDone}
                      placeholder="Defensive performance..."
                      className="text-sm bg-slate-800 border-slate-700 text-white min-h-[60px]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1 block">Midfield</label>
                    <Textarea
                      value={teamSummary.midfieldSummary}
                      onChange={(e) => setTeamSummary((prev) => ({ ...prev, midfieldSummary: e.target.value }))}
                      disabled={isDone}
                      placeholder="Midfield performance..."
                      className="text-sm bg-slate-800 border-slate-700 text-white min-h-[60px]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1 block">Attack</label>
                    <Textarea
                      value={teamSummary.attackSummary}
                      onChange={(e) => setTeamSummary((prev) => ({ ...prev, attackSummary: e.target.value }))}
                      disabled={isDone}
                      placeholder="Attacking performance..."
                      className="text-sm bg-slate-800 border-slate-700 text-white min-h-[60px]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1 block">General</label>
                    <Textarea
                      value={teamSummary.generalSummary}
                      onChange={(e) => setTeamSummary((prev) => ({ ...prev, generalSummary: e.target.value }))}
                      disabled={isDone}
                      placeholder="Overall game summary..."
                      className="text-sm bg-slate-800 border-slate-700 text-white min-h-[60px]"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Player Performance Dialog */}
      <PlayerPerformanceDialog
        open={showPlayerPerfDialog}
        onOpenChange={setShowPlayerPerfDialog}
        player={selectedPlayer}
        data={playerPerfData}
        onDataChange={setPlayerPerfData}
        onSave={handleSavePerformanceReport}
        isReadOnly={isDone}
      />

      {/* Final Report Confirmation Dialog */}
      <FinalReportDialog
        open={showFinalReportDialog}
        onOpenChange={setShowFinalReportDialog}
        finalScore={finalScore}
        teamSummary={teamSummary}
        onConfirm={handleConfirmFinalSubmission}
        isSaving={isSaving}
      />
    </div>
  );
}

// PlayerCard Component
function PlayerCard({ player, status, hasReport, needsReport, onOpenPerformance, onStatusChange, onDragStart, onDragEnd, isScheduled, isPlayed, isReadOnly }) {
  const isDraggable = isScheduled && status !== "Unavailable" && !isReadOnly;
  const showStatusMenu = isScheduled && !isReadOnly;

  // Get color based on player position
  const getPositionColor = () => {
    const position = player.position;
    if (position === "Goalkeeper") return "bg-gradient-to-br from-purple-600 to-purple-700";
    if (position === "Defender") return "bg-gradient-to-br from-blue-600 to-blue-700";
    if (position === "Midfielder") return "bg-gradient-to-br from-emerald-400 to-emerald-500";
    if (position === "Forward") return "bg-gradient-to-br from-red-600 to-red-700";
    return "bg-gradient-to-br from-slate-600 to-slate-700"; // Default
  };

  // Get position badge color
  const getPositionBadgeColor = () => {
    const position = player.position;
    if (position === "Goalkeeper") return "bg-purple-600/20 text-purple-400 border-purple-600/30";
    if (position === "Defender") return "bg-blue-600/20 text-blue-400 border-blue-600/30";
    if (position === "Midfielder") return "bg-emerald-600/20 text-emerald-400 border-emerald-600/30";
    if (position === "Forward") return "bg-red-600/20 text-red-400 border-red-600/30";
    return "bg-slate-600/20 text-slate-400 border-slate-600/30"; // Default
  };

  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`
        relative flex items-center gap-3 p-2 rounded-lg border transition-all
        ${isDraggable ? "cursor-grab active:cursor-grabbing" : ""}
        ${status === "Unavailable" ? "opacity-60" : "opacity-100"}
        bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-800
      `}
    >
      {/* Kit Number Circle */}
      <button
        onClick={(e) => {
          if (isPlayed && !isReadOnly) {
            e.stopPropagation();
            onOpenPerformance();
          }
        }}
        disabled={!(isPlayed && !isReadOnly)}
        className={`
          relative w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0
          ${getPositionColor()}
          ${isPlayed && !isReadOnly ? "hover:scale-110 cursor-pointer" : ""}
        `}
      >
        {player.kitNumber || "?"}
        
        {/* Report Status Badge */}
        {isPlayed && hasReport && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
        {isPlayed && needsReport && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
            <AlertCircle className="w-3 h-3 text-white" />
          </div>
        )}
      </button>

      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white text-sm truncate">{player.fullName}</div>
        <Badge variant="secondary" className={`text-xs mt-0.5 border ${getPositionBadgeColor()}`}>
          {player.position}
        </Badge>
      </div>

      {/* Status Menu (3 dots) */}
      {showStatusMenu && onStatusChange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 hover:bg-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4 text-slate-400" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 bg-slate-800 border-slate-700">
            <div className="space-y-1">
              {status !== "Bench" && (
                <button
                  onClick={() => onStatusChange("Bench")}
                  className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 rounded flex items-center gap-2"
                >
                  Add to Bench
                </button>
              )}
              {status === "Bench" && (
                <button
                  onClick={() => onStatusChange("Not in Squad")}
                  className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 rounded flex items-center gap-2"
                >
                  Remove from Bench
                </button>
              )}
              {status !== "Unavailable" && (
                <button
                  onClick={() => onStatusChange("Unavailable")}
                  className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 rounded flex items-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  Mark Unavailable
                </button>
              )}
              {status === "Unavailable" && (
                <button
                  onClick={() => onStatusChange("Not in Squad")}
                  className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 rounded flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Mark as Available
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

// TacticalBoard Component
function TacticalBoard({ 
  formations, 
  formationType, 
  positions, 
  formation, 
  onFormationChange, 
  onPositionDrop, 
  onRemovePlayer,
  onPlayerClick,
  isDragging, 
  isScheduled, 
  isPlayed,
  isReadOnly,
  hasReport,
  needsReport
}) {
  console.log('🏟️ TacticalBoard render:', {
    formationType,
    positionsCount: Object.keys(positions).length,
    positionIds: Object.keys(positions),
    formationCount: Object.keys(formation).length,
    assignedPlayers: Object.entries(formation).filter(([_, p]) => p !== null).map(([posId, p]) => ({ posId, player: p?.fullName }))
  });

  return (
    <Card className="bg-slate-900/90 backdrop-blur-sm border-slate-700/50 flex flex-col h-full">
      <CardHeader className="pb-3 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-white">Tactical Setup</CardTitle>
          
          {/* Formation Selector */}
          <Select value={formationType} onValueChange={onFormationChange} disabled={!isScheduled || isReadOnly}>
            <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {Object.keys(formations).map((formationKey) => (
                <SelectItem key={formationKey} value={formationKey} className="text-white">
                  {formationKey}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 relative">
        {/* Football Pitch */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-700 via-green-600 to-green-800">
          {/* Grid Pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          {/* Field Markings */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Center circle */}
            <circle cx="50" cy="50" r="12" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3" />
            <circle cx="50" cy="50" r="0.5" fill="rgba(255,255,255,0.8)" />
            
            {/* Halfway line */}
            <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3" />
            
            {/* Top penalty box */}
            <rect x="25" y="0" width="50" height="18" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3" />
            
            {/* Top goal area */}
            <rect x="37" y="0" width="26" height="8" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3" />
            
            {/* Bottom penalty box */}
            <rect x="25" y="82" width="50" height="18" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3" />
            
            {/* Bottom goal area */}
            <rect x="37" y="92" width="26" height="8" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3" />
          </svg>

          {/* Position Slots */}
          {Object.entries(positions).map(([posId, posData]) => {
            const player = formation[posId];
            const isOccupied = player !== null && player !== undefined;

            // Debug render
            if (isOccupied) {
              console.log(`🎨 Rendering position ${posId} (${posData.label}) at (${posData.x}%, ${posData.y}%) with player:`, player?.fullName);
            }

            return (
              <div
                key={posId}
                data-position-id={posId}
                data-position-label={posData.label}
                className={`
                  absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1
                  ${isDragging && !isOccupied ? "scale-110 animate-pulse" : ""}
                  ${!isOccupied && isScheduled && !isReadOnly ? "cursor-pointer hover:scale-110" : ""}
                `}
                style={{
                  left: `${posData.x}%`,
                  top: `${posData.y}%`,
                }}
                onDragOver={(e) => {
                  if (isScheduled && !isReadOnly) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                onDrop={(e) => {
                  if (isScheduled && !isReadOnly) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🎯 Drop on position slot:', {
                      posId,
                      label: posData.label,
                      datasetPosId: e.currentTarget.dataset.positionId,
                      datasetLabel: e.currentTarget.dataset.positionLabel
                    });
                    onPositionDrop(e, posId);
                  }
                }}
              >
                {/* Position Circle */}
                {isOccupied ? (
                  <div
                    className="relative group"
                    onClick={() => {
                      if (isPlayed && !isReadOnly) {
                        onPlayerClick(player);
                      }
                    }}
                  >
                    <div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm
                        shadow-lg transition-all border-2 border-white
                        ${posData.type === "Goalkeeper" ? "bg-gradient-to-br from-purple-600 to-purple-700" : ""}
                        ${posData.type === "Defender" ? "bg-gradient-to-br from-blue-600 to-blue-700" : ""}
                        ${posData.type === "Midfielder" ? "bg-gradient-to-br from-emerald-400 to-emerald-500" : ""}
                        ${posData.type === "Forward" ? "bg-gradient-to-br from-red-600 to-red-700" : ""}
                        ${isPlayed && !isReadOnly ? "cursor-pointer hover:scale-110" : ""}
                        group-hover:scale-110
                      `}
                      style={{ pointerEvents: "none" }}
                    >
                      {player.kitNumber || "?"}

                      {/* Report Status Badge */}
                      {isPlayed && hasReport(player._id) && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {isPlayed && needsReport(player._id) && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
                          <AlertCircle className="w-3 h-3 text-white" />
                        </div>
                      )}

                      {/* Remove Button */}
                      {isScheduled && !isReadOnly && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemovePlayer(posId);
                          }}
                          style={{ pointerEvents: "auto" }}
                          className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full items-center justify-center text-white text-xs hidden group-hover:flex hover:bg-red-600 cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Player Name */}
                    <div className="flex justify-center mt-1" style={{ pointerEvents: "none" }}>
                      <div className="text-white text-xs font-bold drop-shadow-lg" style={{ 
                        textAlign: "center", 
                        width: "100%", 
                        maxWidth: "60px",
                        lineHeight: "1.2"
                      }}>
                        {player.fullName.length > 8 ? player.fullName.substring(0, 8) + "..." : player.fullName}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`
                      w-12 h-12 rounded-full border-2 border-dashed border-white/80 flex items-center justify-center
                      transition-all
                      ${isDragging ? "border-cyan-400 bg-cyan-500/20" : ""}
                      ${isScheduled && !isReadOnly ? "hover:border-cyan-400 hover:bg-cyan-500/20 hover:scale-110" : ""}
                    `}
                    style={{ pointerEvents: "none" }}
                  >
                    <span className="text-white text-[10px] font-bold">{posData.label}</span>
                  </div>
                )}

                {/* Position Label (for empty slots) */}
                {!isOccupied && (
                  <div className="text-white text-[10px] font-semibold text-center drop-shadow-lg" style={{ pointerEvents: "none" }}>
                    {isScheduled && !isReadOnly ? "Click to assign" : posData.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Player Performance Dialog
function PlayerPerformanceDialog({ open, onOpenChange, player, data, onDataChange, onSave, isReadOnly }) {
  if (!player) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
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

        <div className="space-y-4 mt-4">
          {/* Minutes Played */}
          <div>
            <label className="text-sm font-semibold text-slate-400 mb-1 block">Minutes Played</label>
            <Input
              type="number"
              min="0"
              max="120"
              value={data.minutesPlayed}
              onChange={(e) => onDataChange({ ...data, minutesPlayed: parseInt(e.target.value) || 0 })}
              disabled={isReadOnly}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {/* Goals */}
          <div>
            <label className="text-sm font-semibold text-slate-400 mb-1 block">Goals</label>
            <Input
              type="number"
              min="0"
              max="99"
              value={data.goals}
              onChange={(e) => onDataChange({ ...data, goals: parseInt(e.target.value) || 0 })}
              disabled={isReadOnly}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {/* Assists */}
          <div>
            <label className="text-sm font-semibold text-slate-400 mb-1 block">Assists</label>
            <Input
              type="number"
              min="0"
              max="99"
              value={data.assists}
              onChange={(e) => onDataChange({ ...data, assists: parseInt(e.target.value) || 0 })}
              disabled={isReadOnly}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="text-sm font-semibold text-slate-400 mb-1 block">General Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => !isReadOnly && onDataChange({ ...data, rating: star })}
                  disabled={isReadOnly}
                  className={`
                    text-2xl transition-all
                    ${data.rating >= star ? "text-yellow-400" : "text-slate-600"}
                    ${!isReadOnly ? "hover:text-yellow-400 hover:scale-110" : ""}
                  `}
                >
                  ★
                </button>
              ))}
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
        </div>

        {!isReadOnly && (
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-400">
              Cancel
            </Button>
            <Button onClick={onSave} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white">
              Save Report
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Final Report Dialog
function FinalReportDialog({ open, onOpenChange, finalScore, teamSummary, onConfirm, isSaving }) {
  const isValid = 
    finalScore.ourScore !== null &&
    finalScore.opponentScore !== null &&
    teamSummary.defenseSummary &&
    teamSummary.midfieldSummary &&
    teamSummary.attackSummary &&
    teamSummary.generalSummary;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(148, 163, 184, 0.2) transparent'
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Submit & Lock Final Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Final Score */}
          <div>
            <h4 className="font-semibold text-white mb-2">Final Score</h4>
            <div className="text-2xl font-bold text-center">
              {finalScore.ourScore} - {finalScore.opponentScore}
            </div>
          </div>

          {/* Team Summaries Preview */}
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-white mb-1">Defense Summary</h4>
              <p className="text-sm text-slate-300 bg-slate-800 p-3 rounded border border-slate-700">
                {teamSummary.defenseSummary || <span className="text-red-400">Not filled</span>}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-1">Midfield Summary</h4>
              <p className="text-sm text-slate-300 bg-slate-800 p-3 rounded border border-slate-700">
                {teamSummary.midfieldSummary || <span className="text-red-400">Not filled</span>}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-1">Attack Summary</h4>
              <p className="text-sm text-slate-300 bg-slate-800 p-3 rounded border border-slate-700">
                {teamSummary.attackSummary || <span className="text-red-400">Not filled</span>}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-1">General Summary</h4>
              <p className="text-sm text-slate-300 bg-slate-800 p-3 rounded border border-slate-700">
                {teamSummary.generalSummary || <span className="text-red-400">Not filled</span>}
              </p>
            </div>
          </div>

          {!isValid && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-red-400 text-sm">
              Please ensure all fields are filled before submitting.
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving} className="border-slate-700 text-slate-400">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!isValid || isSaving}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white"
          >
            {isSaving ? "Submitting..." : "Submit & Lock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
