import React, { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Trophy,
  Users,
  Save,
  Edit,
  AlertCircle,
  Clock,
  Target,
  Shield,
  Zap,
  TrendingUp,
  X,
  FileText,
  Lock,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useData } from "../components/DataContext";
import FormationEditor from "../components/FormationEditor";
import PlayerPerformanceModal from "../components/PlayerPerformanceModal";
import MatchReportModal from "../components/MatchReportModal";

// Utility functions
const getStatusColor = (status) => {
  switch (status) {
    case 'Scheduled':
      return 'bg-blue-500/10 text-blue-400 border-blue-400';
    case 'Played':
    case 'Done':
      return 'bg-green-500/10 text-green-400 border-green-400';
    case 'Postponed':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-400';
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-400';
  }
};

const getStatusDotColor = (status) => {
  switch (status) {
    case 'Scheduled':
      return 'bg-blue-500';
    case 'Played':
    case 'Done':
      return 'bg-green-500';
    case 'Postponed':
      return 'bg-yellow-500';
    default:
      return 'bg-slate-500';
  }
};

const formatDate = (date) => {
  if (!date) return 'TBD';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric' 
  });
};

const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit'
  });
};

export default function GameDetailsOriginal() {
  console.log('🎮 GameDetails component render started');
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const gameId = searchParams.get('id');
  console.log('🎮 GameDetails - gameId from URL:', gameId);

  const { 
    games,
    players,
    gameRosters,
    teams,
    isLoading,
    error,
    refreshData
  } = useData();

  // Debug data availability
  useEffect(() => {
    console.log('🎮 DataContext Debug:', {
      games: games?.length || 0,
      players: players?.length || 0,
      gameRosters: gameRosters?.length || 0,
      teams: teams?.length || 0,
      isLoading,
      error
    });
    
    if (players && players.length > 0) {
      console.log('🎮 Sample players:', players.slice(0, 3));
    }
    
    if (teams && teams.length > 0) {
      console.log('🎮 Available teams:', teams.map(t => ({ id: t._id, name: t.teamName, coach: t.coach?.fullName })));
    }
  }, [games, players, gameRosters, teams, isLoading, error]);
  
  // Local state
  const [game, setGame] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedGame, setEditedGame] = useState(null);
  
  // Roster state
  const [gameRoster, setGameRoster] = useState([]);
  
  // Formation state
  const [currentFormation, setCurrentFormation] = useState([]);

  // Performance tracking state
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedPlayerForPerformance, setSelectedPlayerForPerformance] = useState(null);

  // Match report state
  const [showMatchReport, setShowMatchReport] = useState(false);

  // Draft state for localStorage
  const [draftData, setDraftData] = useState({
    scores: { ourScore: null, opponentScore: null },
    playerReports: {},
    teamSummaries: {
      defenseSummary: '',
      midfieldSummary: '',
      attackSummary: '',
      generalSummary: ''
    }
  });

  // Load game data
  useEffect(() => {
    if (!gameId || !games || games.length === 0) return;

    console.log('🎮 Looking for game with ID:', gameId);
    console.log('🎮 Available games:', games.length);

    const foundGame = games.find(g => 
      (g._id || g.id) === gameId || 
      (g.gameID || g.GameID) === gameId
    );

    if (foundGame) {
      console.log('🎮 Game found:', foundGame);
      setGame(foundGame);
      setEditedGame({
        opponent: foundGame.opponent || foundGame.Opponent || '',
        date: foundGame.date || foundGame.Date || '',
        location: foundGame.location || foundGame.Location || '',
        status: foundGame.status || foundGame.Status || 'Scheduled',
        ourScore: foundGame.ourScore ?? foundGame.OurScore ?? null,
        opponentScore: foundGame.opponentScore ?? foundGame.OpponentScore ?? null,
        defenseSummary: foundGame.defenseSummary || foundGame.DefenseSummary || '',
        midfieldSummary: foundGame.midfieldSummary || foundGame.MidfieldSummary || '',
        attackSummary: foundGame.attackSummary || foundGame.AttackSummary || '',
        generalSummary: foundGame.generalSummary || foundGame.GeneralSummary || ''
      });
    } else {
      console.log('🎮 Game not found in games array');
    }
  }, [gameId, games]);

  // Load draft data from localStorage
  useEffect(() => {
    if (gameId) {
      const savedDraft = localStorage.getItem(`gameDraft_${gameId}`);
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          setDraftData(parsedDraft);
          console.log('🎮 Loaded draft data from localStorage:', parsedDraft);
    } catch (error) {
          console.error('🎮 Error parsing draft data:', error);
        }
      }
    }
  }, [gameId]);

  // Save draft data to localStorage
  useEffect(() => {
    if (gameId && draftData) {
      localStorage.setItem(`gameDraft_${gameId}`, JSON.stringify(draftData));
      console.log('🎮 Saved draft data to localStorage:', draftData);
    }
  }, [gameId, draftData]);

  // Load team players for this game
  useEffect(() => {
    if (!game || !players) return;

    console.log('🎮 Loading team players for game:', game);
    console.log('🎮 Available players:', players?.length || 0);
    console.log('🎮 Sample player:', players?.[0]);

    const teamObj = game.team || game.Team || game.teamId || game.TeamId;
    const teamId = typeof teamObj === 'object' ? teamObj._id : teamObj;
    console.log('🎮 Team ID for this game:', teamId);
    console.log('🎮 Team object:', teamObj);

    if (!teamId) {
      console.log('🎮 No team ID found for this game');
      return;
    }

    // Get all players from the team
    const teamPlayers = players.filter(player => {
      const playerTeamObj = player.team || player.Team || player.teamId || player.TeamId;
      const playerTeamId = typeof playerTeamObj === 'object' ? playerTeamObj._id : playerTeamObj;
      
      console.log('🎮 Checking player:', {
        playerName: player.fullName || player.FullName,
        playerTeamId,
        gameTeamId: teamId,
        match: playerTeamId === teamId
      });
      return playerTeamId === teamId;
    });

    console.log('🎮 Team players found:', teamPlayers.length);
    console.log('🎮 Team players details:', teamPlayers);

    // Convert to roster format with default status
    const rosterData = teamPlayers.map(player => ({
      _id: `roster-${player._id || player.id}`,
      game: gameId,
      player: player,
      status: 'Not in Squad' // Default status
    }));

    console.log('🎮 Roster data created:', rosterData);
    setGameRoster(rosterData);
  }, [game, players, gameId]);

  // Handle save
  const handleSave = async () => {
    if (!editedGame || !gameId) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch(`http://localhost:3001/api/games/${gameId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editedGame)
      });

      if (!response.ok) {
        throw new Error('Failed to update game');
      }

      const result = await response.json();
      console.log('🎮 Game updated successfully:', result);

      // Refresh data and exit edit mode
      await refreshData();
      setIsEditing(false);
      
      // Clear draft data after successful save
      localStorage.removeItem(`gameDraft_${gameId}`);
      setDraftData({
        scores: { ourScore: null, opponentScore: null },
        playerReports: {},
        teamSummaries: {
          defenseSummary: '',
          midfieldSummary: '',
          attackSummary: '',
          generalSummary: ''
        }
      });
      
      alert('Game updated successfully!');
    } catch (error) {
      console.error('🎮 Error updating game:', error);
      alert('Failed to update game. Please try again.');
    } finally {
    setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (game) {
      setEditedGame({
        opponent: game.opponent || game.Opponent || '',
        date: game.date || game.Date || '',
        location: game.location || game.Location || '',
        status: game.status || game.Status || 'Scheduled',
        ourScore: game.ourScore ?? game.OurScore ?? null,
        opponentScore: game.opponentScore ?? game.OpponentScore ?? null,
        defenseSummary: game.defenseSummary || game.DefenseSummary || '',
        midfieldSummary: game.midfieldSummary || game.MidfieldSummary || '',
        attackSummary: game.attackSummary || game.AttackSummary || '',
        generalSummary: game.generalSummary || game.GeneralSummary || ''
      });
    }
    setIsEditing(false);
  };


  // Handle update player status (local state only for now)
  const handleUpdatePlayerStatus = (rosterId, newStatus) => {
    setGameRoster(prev => prev.map(roster => 
      roster._id === rosterId 
        ? { ...roster, status: newStatus }
        : roster
    ));
  };

  // Formation handlers
  const handleFormationChange = (formation) => {
    setCurrentFormation(formation);
  };

  const handleSaveFormation = async (formation) => {
    try {
      console.log('🎮 Saving formation:', formation);
      alert('Formation saved successfully!');
      setShowFormationEditor(false);
    } catch (error) {
      console.error('🎮 Error saving formation:', error);
      alert('Failed to save formation. Please try again.');
    }
  };

  // Performance tracking handlers
  const handleOpenPerformanceModal = (player) => {
    setSelectedPlayerForPerformance(player);
    setShowPerformanceModal(true);
  };

  const handleClosePerformanceModal = () => {
    setShowPerformanceModal(false);
    setSelectedPlayerForPerformance(null);
  };

  const handleSavePerformance = (performanceData) => {
    console.log('🎮 Saving performance data:', performanceData);
    // TODO: Save performance data to backend and create TimelineEvent
    setShowPerformanceModal(false);
    setSelectedPlayerForPerformance(null);
  };

  // Match report handlers
  const handleOpenMatchReport = () => {
    setShowMatchReport(true);
  };

  const handleCloseMatchReport = () => {
    setShowMatchReport(false);
  };

  const handleSaveMatchReport = (reportData) => {
    console.log('🎮 Saving match report:', reportData);
    setShowMatchReport(false);
  };

  // Handle draft data updates
  const handleDraftUpdate = (section, field, value) => {
    setDraftData(prev => ({
        ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Handle final submission and lock
  const handleSubmitAndLock = async () => {
    if (!gameId) return;

    setIsSaving(true);
    try {
      // Save all draft data to backend
      const token = localStorage.getItem('jwtToken');
      
      // Update game with final scores and summaries
      const gameUpdate = {
        ourScore: draftData.scores.ourScore,
        opponentScore: draftData.scores.opponentScore,
        defenseSummary: draftData.teamSummaries.defenseSummary,
        midfieldSummary: draftData.teamSummaries.midfieldSummary,
        attackSummary: draftData.teamSummaries.attackSummary,
        generalSummary: draftData.teamSummaries.generalSummary,
        status: 'Done'
      };

      const response = await fetch(`http://localhost:3001/api/games/${gameId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(gameUpdate)
      });

      if (!response.ok) {
        throw new Error('Failed to submit final report');
      }

      // Clear draft data
      localStorage.removeItem(`gameDraft_${gameId}`);
      setDraftData({
        scores: { ourScore: null, opponentScore: null },
        playerReports: {},
        teamSummaries: {
          defenseSummary: '',
          midfieldSummary: '',
          attackSummary: '',
          generalSummary: ''
        }
      });

      await refreshData();
      alert('Final report submitted and locked successfully!');
    } catch (error) {
      console.error('🎮 Error submitting final report:', error);
      alert('Failed to submit final report. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/30"></div>
          <div className="absolute inset-0 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin"></div>
          <div className="absolute inset-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white" />
          </div>
        </div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Game Details</h2>
          <p className="text-slate-400">Fetching match information...</p>
      </div>
    </div>
  );
  }
  
  if (error) {
    return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Game</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-cyan-600 hover:bg-cyan-700 text-white">
            Try Again
          </Button>
      </div>
    </div>
  );
  }

  if (!game) {
  return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Game Not Found</h2>
          <p className="text-slate-400 mb-4">The requested game could not be found.</p>
          <Link to={createPageUrl("GamesSchedule")}>
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
              Back to Games
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Render
  const teamName = game.teamName || game.TeamName || 'Team';
  const opponent = game.opponent || game.Opponent || 'TBD';
  const gameTitle = game.gameTitle || game.GameTitle || `${teamName} vs ${opponent}`;
  const status = game.status || game.Status || 'Scheduled';
  const date = game.date || game.Date;
  const location = game.location || game.Location || 'TBD';
  const ourScore = game.ourScore ?? game.OurScore;
  const opponentScore = game.opponentScore ?? game.OpponentScore;
  const finalScore = game.finalScoreDisplay || game.FinalScore_Display;

  // Determine if this is a pre-game or post-game state
  const isPreGame = status === 'Scheduled';
  const isPostGame = status === 'Played' || status === 'Done';
  const isReadOnly = status === 'Done' && !isEditing;

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-slate-900/95 backdrop-blur-xl border-b border-cyan-500/20">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Link to={createPageUrl("GamesSchedule")}>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-cyan-500 transition-all duration-300"
                >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
                
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  {gameTitle}
                  </h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-slate-400 font-mono">{formatDate(date)}</span>
                    {date && (
                      <span className="text-sm text-slate-500">{formatTime(date)}</span>
                    )}
                    </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-slate-400">{location}</span>
                  </div>
              <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusDotColor(status)} animate-pulse`} />
                    <Badge variant="outline" className={`${getStatusColor(status)} font-mono text-xs`}>
                      {status}
                    </Badge>
                        </div>
                        </div>
                      </div>
                    </div>

            <div className="flex items-center gap-3">
              {isPostGame && (
                <Button
                  onClick={handleOpenMatchReport}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              )}
              
              {finalScore && !isEditing && (
                <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600 rounded-xl px-6 py-3">
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-1 font-mono">FINAL SCORE</p>
                    <p className="text-2xl font-bold text-white font-mono">{finalScore}</p>
                    </div>
                  </div>
                )}

              {!isReadOnly && (
                <>
                  {!isEditing ? (
                  <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Game
                    </Button>
                    ) : (
                      <>
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                        onClick={handleCancel}
                    variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                        Cancel
                  </Button>
                    </>
                  )}
                </>
              )}

              {isReadOnly && (
                <div className="flex items-center gap-2 text-slate-400">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm">Report Locked</span>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Two-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - Game Day Roster Sidebar */}
        <div className="w-80 bg-slate-800/50 border-r border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Game Day Roster ({gameRoster.length})
            </h3>
            <p className="text-xs text-slate-400 mt-1">Drag players to the formation or click to assign</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-2">
              {['Starting Lineup', 'Bench', 'Not in Squad', 'Unavailable'].map(status => {
                const playersInStatus = gameRoster.filter(roster => roster.status === status || roster.Status === status);
                if (playersInStatus.length === 0) return null;
                
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-300 text-sm">{status}</h4>
                      <Badge variant="outline" className="bg-slate-700/50 text-slate-400 border-slate-600 text-xs">
                        {playersInStatus.length}
                          </Badge>
                        </div>
                <div className="space-y-1">
                      {playersInStatus.map(roster => {
                        const player = roster.player || roster.Player?.[0];
                        const fullName = player?.fullName || player?.FullName || 'Unknown Player';
                        const kitNumber = player?.kitNumber || player?.KitNumber || '';
                        const position = player?.position || player?.Position || 'Unknown';
                        const rosterId = roster._id || roster.id;
                        
                        return (
                          <div
                            key={rosterId}
                            draggable={!isReadOnly}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('application/json', JSON.stringify(roster));
                              e.currentTarget.classList.add('opacity-50');
                            }}
                            onDragEnd={(e) => {
                              e.currentTarget.classList.remove('opacity-50');
                            }}
                            className={`p-2 rounded-lg bg-slate-700/50 border border-slate-600 hover:bg-slate-700/70 transition-colors ${
                              isReadOnly ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
                            }`}
                            onClick={() => {
                              if (isPostGame && !isReadOnly) {
                                handleOpenPerformanceModal(player);
                              }
                            }}
                            title={isReadOnly ? 'Read-only mode' : 'Drag to formation or click for details'}
                          >
                            <div className="flex items-center gap-2">
                              {kitNumber && (
                                <div className="w-6 h-6 bg-cyan-500/20 rounded text-xs flex items-center justify-center font-bold text-cyan-400">
                                  {kitNumber}
                          </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white text-sm truncate">{fullName}</p>
                                <p className="text-xs text-slate-400">{position}</p>
                                </div>
                              {isPostGame && !isReadOnly && (
                                <div className="text-xs text-cyan-400">Stats</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                    </div>
                </div>
                );
              })}
              </div>
            </div>
          </div>

        {/* Main Content Area - Full width tactical board */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Tactical Setup Header */}
          <div className="p-4 border-b border-slate-700 flex-shrink-0 bg-slate-800/50">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <Target className="w-5 h-5 text-cyan-400" />
                Tactical Setup
              </h2>
              <p className="text-sm text-slate-400 mt-1">Set up your team formation and tactics for this match</p>
            </div>
          </div>

          {/* Tactical Board - Full Size */}
          <div className="flex-1 overflow-hidden">
            <FormationEditor
              gameRoster={gameRoster}
              onFormationChange={handleFormationChange}
              onSave={handleSaveFormation}
              isReadOnly={isReadOnly}
            />
          </div>
        </div>

        {/* Post-Game Content - In a separate scrollable area */}
        {isPostGame && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900/30">
              <>
                {/* Individual Player Performance Reports */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <TrendingUp className="w-5 h-5 text-cyan-400" />
                      Individual Player Performance
                  </CardTitle>
                </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 mb-4">
                      Click on players in the left sidebar to track their individual performance and create detailed reports.
                    </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-cyan-400 mb-1">
                          {gameRoster.filter(roster => roster.status === 'Starting Lineup').length}
                    </div>
                        <div className="text-sm text-slate-400">Starting Players</div>
                    </div>
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-green-400 mb-1">
                          {gameRoster.filter(roster => roster.status === 'Bench').length}
                    </div>
                        <div className="text-sm text-slate-400">Bench Players</div>
                  </div>
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-400 mb-1">
                          {gameRoster.length}
                    </div>
                        <div className="text-sm text-slate-400">Total Squad</div>
                  </div>
                </div>
                  </CardContent>
                </Card>

                {/* Team Performance Summaries */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Shield className="w-5 h-5 text-cyan-400" />
                      Team Performance Summaries
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300">Defense Summary</Label>
                        {isReadOnly ? (
                          <div className="text-slate-300 mt-2 p-3 bg-slate-700/50 rounded-lg">
                            {game.defenseSummary || game.DefenseSummary || 'No summary provided'}
                      </div>
                        ) : (
                          <Textarea
                            value={draftData.teamSummaries.defenseSummary}
                            onChange={(e) => handleDraftUpdate('teamSummaries', 'defenseSummary', e.target.value)}
                            className="w-full h-24 bg-slate-700 border-slate-600 text-white placeholder-slate-400 resize-none"
                            placeholder="Describe the defensive performance..."
                          />
                        )}
                        </div>
                      <div>
                        <Label className="text-slate-300">Midfield Summary</Label>
                        {isReadOnly ? (
                          <div className="text-slate-300 mt-2 p-3 bg-slate-700/50 rounded-lg">
                            {game.midfieldSummary || game.MidfieldSummary || 'No summary provided'}
                    </div>
                  ) : (
                          <Textarea
                            value={draftData.teamSummaries.midfieldSummary}
                            onChange={(e) => handleDraftUpdate('teamSummaries', 'midfieldSummary', e.target.value)}
                            className="w-full h-24 bg-slate-700 border-slate-600 text-white placeholder-slate-400 resize-none"
                            placeholder="Describe the midfield performance..."
                          />
                      )}
                    </div>
                      <div>
                        <Label className="text-slate-300">Attack Summary</Label>
                        {isReadOnly ? (
                          <div className="text-slate-300 mt-2 p-3 bg-slate-700/50 rounded-lg">
                            {game.attackSummary || game.AttackSummary || 'No summary provided'}
                            </div>
                        ) : (
                          <Textarea
                            value={draftData.teamSummaries.attackSummary}
                            onChange={(e) => handleDraftUpdate('teamSummaries', 'attackSummary', e.target.value)}
                            className="w-full h-24 bg-slate-700 border-slate-600 text-white placeholder-slate-400 resize-none"
                            placeholder="Describe the attacking performance..."
                          />
                            )}
                          </div>
                      <div>
                        <Label className="text-slate-300">General Summary</Label>
                        {isReadOnly ? (
                          <div className="text-slate-300 mt-2 p-3 bg-slate-700/50 rounded-lg">
                            {game.generalSummary || game.GeneralSummary || 'No summary provided'}
                    </div>
                        ) : (
                          <Textarea
                            value={draftData.teamSummaries.generalSummary}
                            onChange={(e) => handleDraftUpdate('teamSummaries', 'generalSummary', e.target.value)}
                            className="w-full h-24 bg-slate-700 border-slate-600 text-white placeholder-slate-400 resize-none"
                            placeholder="Overall team performance summary..."
                          />
                )}
              </div>
            </div>
                  </CardContent>
                </Card>

                {/* Submit & Lock Final Report */}
                {!isReadOnly && (
                  <Card className="bg-slate-800/50 border-slate-700 border-dashed">
                    <CardContent className="p-8 text-center">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">Submit & Lock Final Report</h3>
                      <p className="text-slate-400 mb-4">
                        Once you've completed all performance reports and team summaries, submit the final report to lock all data.
                      </p>
                      <Button
                        onClick={handleSubmitAndLock}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        {isSaving ? 'Submitting...' : 'Submit & Lock Final Report'}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
          </div>
        )}
      </div>

      {/* Modals */}
      <PlayerPerformanceModal
        isOpen={showPerformanceModal}
        onClose={handleClosePerformanceModal}
        player={selectedPlayerForPerformance}
        gameId={gameId}
        onSave={handleSavePerformance}
      />

      <MatchReportModal
        isOpen={showMatchReport}
        onClose={handleCloseMatchReport}
        game={game}
        gameRoster={gameRoster}
        formation={currentFormation}
        onSave={handleSaveMatchReport}
      />
    </div>
  );
}