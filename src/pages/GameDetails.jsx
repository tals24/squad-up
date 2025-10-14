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
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useData } from "../components/DataContext";
import PlayerSelectionModal from "../components/PlayerSelectionModal";
import FormationEditor from "../components/FormationEditor";

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

export default function GameDetails() {
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
  }, [games, players, gameRosters, teams, isLoading, error]);
  
  // Local state
  const [game, setGame] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedGame, setEditedGame] = useState(null);
  
  // Roster state
  const [gameRoster, setGameRoster] = useState([]);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  
  // Formation state
  const [currentFormation, setCurrentFormation] = useState([]);
  const [showFormationEditor, setShowFormationEditor] = useState(false);

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

  // Load game roster
  useEffect(() => {
    if (!gameId) return;

    console.log('🎮 Loading game roster for gameId:', gameId);
    console.log('🎮 Available gameRosters:', gameRosters?.length || 0);
    console.log('🎮 Sample gameRoster:', gameRosters?.[0]);

    if (!gameRosters || gameRosters.length === 0) {
      console.log('🎮 No game rosters available, setting empty array');
      setGameRoster([]);
      return;
    }

    const rosterForGame = gameRosters.filter(roster => {
      const rosterGameId = roster.game?._id || roster.game || roster.Game?.[0];
      const match = rosterGameId === gameId;
      console.log('🎮 Checking roster:', {
        rosterGameId,
        gameId,
        match,
        roster: roster
      });
      return match;
    });

    console.log('🎮 Game roster loaded:', rosterForGame.length, 'players');
    console.log('🎮 Roster details:', rosterForGame);
    setGameRoster(rosterForGame);
  }, [gameId, gameRosters]);

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
      
      // Show success message (you can add a toast here)
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

  // Get team players for this game
  const getTeamPlayers = () => {
    if (!game || !players || !teams) return [];
    
    const gameTeam = game.team || game.Team;
    const teamId = gameTeam?._id || gameTeam || gameTeam?.[0];
    
    return players.filter(player => {
      const playerTeam = player.team || player.Team;
      const playerTeamId = playerTeam?._id || playerTeam || playerTeam?.[0];
      return playerTeamId === teamId;
    });
  };

  // Add players to roster
  const handleAddPlayers = async (selectedPlayers) => {
    if (!gameId || selectedPlayers.length === 0) return;

    setIsLoadingRoster(true);
    try {
      const token = localStorage.getItem('jwtToken');
      
      // Add each player to the roster
      for (const player of selectedPlayers) {
        const response = await fetch('http://localhost:3001/api/game-rosters', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            game: gameId,
            player: player._id || player.id,
            status: 'Not in Squad'
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to add player ${player.fullName || player.FullName}`);
        }
      }

      // Refresh data
      await refreshData();
      alert(`Successfully added ${selectedPlayers.length} player(s) to the roster!`);
    } catch (error) {
      console.error('🎮 Error adding players:', error);
      alert('Failed to add players. Please try again.');
    } finally {
      setIsLoadingRoster(false);
    }
  };

  // Update player status
  const handleUpdatePlayerStatus = async (rosterId, newStatus) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch(`http://localhost:3001/api/game-rosters/${rosterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update player status');
      }

      // Refresh data
      await refreshData();
    } catch (error) {
      console.error('🎮 Error updating player status:', error);
      alert('Failed to update player status. Please try again.');
    }
  };

  // Remove player from roster
  const handleRemovePlayer = async (rosterId) => {
    if (!confirm('Are you sure you want to remove this player from the roster?')) return;

    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch(`http://localhost:3001/api/game-rosters/${rosterId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove player');
      }

      // Refresh data
      await refreshData();
      alert('Player removed from roster successfully!');
    } catch (error) {
      console.error('🎮 Error removing player:', error);
      alert('Failed to remove player. Please try again.');
    }
  };

  // Handle formation change
  const handleFormationChange = (newFormation) => {
    setCurrentFormation(newFormation);
  };

  // Save formation
  const handleSaveFormation = async (formation) => {
    try {
      // Here you would save the formation to the database
      // For now, we'll just show a success message
      console.log('🎮 Saving formation:', formation);
      alert('Formation saved successfully!');
      setShowFormationEditor(false);
    } catch (error) {
      console.error('🎮 Error saving formation:', error);
      alert('Failed to save formation. Please try again.');
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
              <Trophy className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-slate-300 font-medium text-lg">Loading Game Details...</p>
        </div>
      </div>
    );
  }

  // No game found
  if (!game) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-300 font-medium text-lg mb-4">Game not found</p>
          <Link to={createPageUrl("GamesSchedule")}>
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              Back to Games Schedule
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
              {finalScore && !isEditing && (
                <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600 rounded-xl px-6 py-3">
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-1 font-mono">FINAL SCORE</p>
                    <p className="text-2xl font-bold text-white font-mono">{finalScore}</p>
                  </div>
                </div>
              )}
              
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
                    onClick={handleCancel}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSaving ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Basic Game Info */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Trophy className="w-5 h-5 text-cyan-400" />
                Game Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Status</Label>
                  {isEditing ? (
                    <Select
                      value={editedGame?.status || 'Scheduled'}
                      onValueChange={(value) => setEditedGame(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Scheduled">Scheduled</SelectItem>
                        <SelectItem value="Played">Played</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                        <SelectItem value="Postponed">Postponed</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusDotColor(status)}`} />
                      <span className="text-white">{status}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Location</Label>
                  {isEditing ? (
                    <Input
                      value={editedGame?.location || ''}
                      onChange={(e) => setEditedGame(prev => ({ ...prev, location: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Enter location"
                    />
                  ) : (
                    <p className="text-white">{location}</p>
                  )}
                </div>
              </div>

              {/* Score Section */}
              {(status === 'Played' || status === 'Done' || isEditing) && (
                <div className="pt-4 border-t border-slate-700">
                  <Label className="text-slate-300 mb-3 block">Match Score</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label className="text-xs text-slate-400 mb-2 block">Our Score</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          value={editedGame?.ourScore ?? ''}
                          onChange={(e) => setEditedGame(prev => ({ ...prev, ourScore: e.target.value ? parseInt(e.target.value) : null }))}
                          className="bg-slate-700 border-slate-600 text-white text-center text-2xl font-bold"
                          placeholder="0"
                        />
                      ) : (
                        <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                          <p className="text-3xl font-bold text-cyan-400">{ourScore ?? '-'}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-2xl font-bold text-slate-500">vs</div>
                    
                    <div className="flex-1">
                      <Label className="text-xs text-slate-400 mb-2 block">Opponent Score</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          value={editedGame?.opponentScore ?? ''}
                          onChange={(e) => setEditedGame(prev => ({ ...prev, opponentScore: e.target.value ? parseInt(e.target.value) : null }))}
                          className="bg-slate-700 border-slate-600 text-white text-center text-2xl font-bold"
                          placeholder="0"
                        />
                      ) : (
                        <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                          <p className="text-3xl font-bold text-red-400">{opponentScore ?? '-'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Match Analysis - Only show for played games or in edit mode */}
          {(status === 'Played' || status === 'Done' || isEditing) && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Target className="w-5 h-5 text-purple-400" />
                  Match Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-300">
                      <Shield className="w-4 h-4 text-blue-400" />
                      Defense Summary
                    </Label>
                    {isEditing ? (
                      <Textarea
                        value={editedGame?.defenseSummary || ''}
                        onChange={(e) => setEditedGame(prev => ({ ...prev, defenseSummary: e.target.value }))}
                        placeholder="How did the defense perform?"
                        className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                      />
                    ) : (
                      <p className="text-slate-300 bg-slate-700/30 p-3 rounded-lg min-h-[100px]">
                        {game.defenseSummary || game.DefenseSummary || 'No summary available'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-300">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      Midfield Summary
                    </Label>
                    {isEditing ? (
                      <Textarea
                        value={editedGame?.midfieldSummary || ''}
                        onChange={(e) => setEditedGame(prev => ({ ...prev, midfieldSummary: e.target.value }))}
                        placeholder="How did the midfield perform?"
                        className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                      />
                    ) : (
                      <p className="text-slate-300 bg-slate-700/30 p-3 rounded-lg min-h-[100px]">
                        {game.midfieldSummary || game.MidfieldSummary || 'No summary available'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-300">
                      <TrendingUp className="w-4 h-4 text-red-400" />
                      Attack Summary
                    </Label>
                    {isEditing ? (
                      <Textarea
                        value={editedGame?.attackSummary || ''}
                        onChange={(e) => setEditedGame(prev => ({ ...prev, attackSummary: e.target.value }))}
                        placeholder="How did the attack perform?"
                        className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                      />
                    ) : (
                      <p className="text-slate-300 bg-slate-700/30 p-3 rounded-lg min-h-[100px]">
                        {game.attackSummary || game.AttackSummary || 'No summary available'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-300">
                      <Trophy className="w-4 h-4 text-green-400" />
                      General Summary
                    </Label>
                    {isEditing ? (
                      <Textarea
                        value={editedGame?.generalSummary || ''}
                        onChange={(e) => setEditedGame(prev => ({ ...prev, generalSummary: e.target.value }))}
                        placeholder="Overall game summary"
                        className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                      />
                    ) : (
                      <p className="text-slate-300 bg-slate-700/30 p-3 rounded-lg min-h-[100px]">
                        {game.generalSummary || game.GeneralSummary || 'No summary available'}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Player Roster Management */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="w-5 h-5 text-cyan-400" />
                  Player Roster ({gameRoster.length} players)
                </CardTitle>
                <Button
                  onClick={() => setShowPlayerModal(true)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  disabled={isLoadingRoster}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Add Players
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {gameRoster.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-2">No players in roster yet</p>
                  <p className="text-slate-500 text-sm mb-4">
                    Game ID: {gameId} | Available gameRosters: {gameRosters?.length || 0}
                  </p>
                  <Button
                    onClick={() => setShowPlayerModal(true)}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    Add Players to Roster
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Group players by status */}
                  {['Starting Lineup', 'Bench', 'Not in Squad', 'Unavailable'].map(status => {
                    const playersInStatus = gameRoster.filter(roster => 
                      roster.status === status || roster.Status === status
                    );
                    
                    if (playersInStatus.length === 0) return null;

                    return (
                      <div key={status} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-300">{status}</h4>
                          <Badge variant="outline" className="bg-slate-700/50 text-slate-400 border-slate-600">
                            {playersInStatus.length}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {playersInStatus.map(roster => {
                            const player = roster.player || roster.Player?.[0];
                            const playerId = player?._id || player?.id;
                            const fullName = player?.fullName || player?.FullName || 'Unknown Player';
                            const kitNumber = player?.kitNumber || player?.KitNumber || '';
                            const position = player?.position || player?.Position || 'Unknown';
                            const rosterId = roster._id || roster.id;

                            return (
                              <Card key={rosterId} className="bg-slate-700/50 border-slate-600">
                                <CardContent className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      {kitNumber && (
                                        <div className="w-8 h-8 bg-cyan-500/20 rounded text-xs flex items-center justify-center font-bold text-cyan-400">
                                          {kitNumber}
                                        </div>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p className="font-medium text-white truncate">{fullName}</p>
                                        <p className="text-xs text-slate-400">{position}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      <Select
                                        value={roster.status || roster.Status || 'Not in Squad'}
                                        onValueChange={(value) => handleUpdatePlayerStatus(rosterId, value)}
                                      >
                                        <SelectTrigger className="w-32 h-8 bg-slate-600 border-slate-500 text-white text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Starting Lineup">Starting</SelectItem>
                                          <SelectItem value="Bench">Bench</SelectItem>
                                          <SelectItem value="Not in Squad">Not in Squad</SelectItem>
                                          <SelectItem value="Unavailable">Unavailable</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRemovePlayer(rosterId)}
                                        className="h-8 w-8 p-0 border-red-500/50 text-red-400 hover:bg-red-500/20"
                                      >
                                        ×
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formation Editor */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Target className="w-5 h-5 text-cyan-400" />
                  Formation & Tactics
                </CardTitle>
                <Button
                  onClick={() => setShowFormationEditor(true)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Edit Formation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {currentFormation.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4">No formation set yet</p>
                  <Button
                    onClick={() => setShowFormationEditor(true)}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    Create Formation
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['Goalkeeper', 'Defender', 'Midfielder', 'Forward'].map(position => {
                      const playersInPosition = currentFormation.filter(pos => 
                        pos.position === position && pos.player
                      );
                      
                      return (
                        <div key={position} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm font-medium text-slate-300">{position}s</span>
                            <Badge variant="outline" className="bg-slate-700/50 text-slate-400 border-slate-600">
                              {playersInPosition.length}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1">
                            {playersInPosition.map((pos, index) => (
                              <div key={index} className="text-xs text-slate-400 truncate">
                                {pos.playerName || 'Unknown'}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setShowFormationEditor(true)}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Edit Formation
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 border-dashed">
            <CardContent className="p-8 text-center">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-400 mb-2">Performance Tracking</h3>
              <p className="text-sm text-slate-500">Coming in Phase 4: Individual player performance and statistics</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Player Selection Modal */}
      <PlayerSelectionModal
        isOpen={showPlayerModal}
        onClose={() => setShowPlayerModal(false)}
        onConfirm={handleAddPlayers}
        gameId={gameId}
        existingRoster={gameRoster}
        teamPlayers={getTeamPlayers()}
      />

      {/* Formation Editor Modal */}
      {showFormationEditor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Target className="w-6 h-6 text-cyan-400" />
                  Formation Editor
                </h2>
                <Button
                  onClick={() => setShowFormationEditor(false)}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <FormationEditor
                gameRoster={gameRoster}
                onFormationChange={handleFormationChange}
                onSave={handleSaveFormation}
                isReadOnly={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
