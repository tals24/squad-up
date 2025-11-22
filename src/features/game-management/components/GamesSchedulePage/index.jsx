
import React, { useState, useEffect, useMemo } from "react";
import { User } from "@/api/entities"; // Updated import path
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Calendar,
  MapPin,
  Trophy,
  Filter,
  Users,
  Swords,
  Clock,
  Target,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  ShieldCheck, // for goals
  Award // for assists
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/primitives/card";
import { Badge } from "@/shared/ui/primitives/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/primitives/select";
import { PageLayout, PageHeader, SearchFilter, DataCard, EmptyState } from "@/shared/ui/primitives/design-system-components";
import { useData } from "@/app/providers/DataProvider";
import PageLoader from "@/components/PageLoader";

// --- Game Stats Rotator Component ---
const GameStatsRotator = ({ gameId, reports, players }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const stats = useMemo(() => {
    // Ensure reports and players are available and are arrays
    if (!reports || !Array.isArray(reports) || !players || !Array.isArray(players)) {
      return [];
    }

    // Filter reports directly using r.game and includes(gameId)
    const gameReports = reports.filter(r => {
      const gameField = r.game || r.Game;
      return gameField && Array.isArray(gameField) && gameField.includes(gameId);
    });
    
    
    if (gameReports.length === 0) return [];

    const availableStats = [];

    // Man of the Match (MVP) - player with highest rating
    let mvpReport = null;
    let maxRating = -1;
    
    for (const report of gameReports) {
      const rating = report.generalRating || report.GeneralRating || 0;
      if (rating > maxRating) {
        maxRating = rating;
        mvpReport = report;
      }
    }

    if (mvpReport && (mvpReport.generalRating || mvpReport.GeneralRating) && (mvpReport.generalRating || mvpReport.GeneralRating) > 0) {
      const playerField = mvpReport.player || mvpReport.Player;
      const mvpPlayer = players.find(p => {
        const playerId = p._id || p.id;
        return playerField && Array.isArray(playerField) && playerField.includes(playerId);
      });
      if (mvpPlayer) {
        const playerName = mvpPlayer.fullName || mvpPlayer.FullName || 'Unknown Player';
        const rating = mvpReport.generalRating || mvpReport.GeneralRating;
        availableStats.push({ type: 'mvp', player: playerName, rating: rating });
      }
    }

    // Scorers - players who scored goals
    const scorers = gameReports
      .filter(r => (r.goals || r.Goals) && (r.goals || r.Goals) > 0)
      .map(r => {
        const playerField = r.player || r.Player;
        const player = players.find(p => {
          const playerId = p._id || p.id;
          return playerField && Array.isArray(playerField) && playerField.includes(playerId);
        });
        const playerName = player?.fullName || player?.FullName || 'Unknown Player';
        const goals = r.goals || r.Goals;
        return { name: playerName, count: goals };
      })
      .filter(s => s.name !== 'Unknown Player');

    if (scorers.length > 0) {
      availableStats.push({ type: 'scorers', data: scorers });
    }

    // Assisters - players who made assists
    const assisters = gameReports
      .filter(r => (r.assists || r.Assists) && (r.assists || r.Assists) > 0)
      .map(r => {
        const playerField = r.player || r.Player;
        const player = players.find(p => {
          const playerId = p._id || p.id;
          return playerField && Array.isArray(playerField) && playerField.includes(playerId);
        });
        const playerName = player?.fullName || player?.FullName || 'Unknown Player';
        const assists = r.assists || r.Assists;
        return { name: playerName, count: assists };
      })
      .filter(a => a.name !== 'Unknown Player');

    if (assisters.length > 0) {
      availableStats.push({ type: 'assisters', data: assisters });
    }

    return availableStats;
  }, [gameId, reports, players]);

  useEffect(() => {
    if (stats.length <= 1) {
      setCurrentIndex(0);
      return;
    }
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % stats.length);
    }, 4000); // Rotate every 4 seconds
    
    return () => clearInterval(interval);
  }, [stats.length]);

  // If no stats, show a placeholder or nothing
  if (stats.length === 0) {
    // Let's show something to indicate that we're looking for stats
    return (
      <div className="flex items-center gap-2 text-slate-500 text-xs">
        <Activity className="w-3 h-3" />
        <span>No game stats available</span>
      </div>
    );
  }

  const currentStat = stats[currentIndex];

  return (
    <div className="flex items-center gap-2 text-slate-300 min-h-[20px]" key={currentIndex}>
      {currentStat.type === 'mvp' && (
        <>
          <Star className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <span className="font-medium truncate">MVP: {currentStat.player}</span>
          <Badge variant="outline" className="text-yellow-400 border-yellow-500/50 flex-shrink-0 text-xs">
            {currentStat.rating}/5
          </Badge>
        </>
      )}
      {currentStat.type === 'scorers' && (
        <>
          <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
          <span className="font-medium truncate">Goals: {currentStat.data.map(s => `${s.name} (${s.count})`).join(', ')}</span>
        </>
      )}
      {currentStat.type === 'assisters' && (
        <>
          <Award className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="font-medium truncate">Assists: {currentStat.data.map(a => `${a.name} (${a.count})`).join(', ')}</span>
        </>
      )}
    </div>
  );
};


export default function GamesSchedule() {
  const { users, teams, games, players, reports, isLoading: isDataLoading, error } = useData();
  const [currentUser, setCurrentUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all"); // New state for result filter

  useEffect(() => {
    User.me().then(setCurrentUser).catch(console.error);
  }, []);


  const { roleFilteredGames, availableStatuses } = useMemo(() => {
    console.log('🔍 Role filtering - Input data:', {
      currentUser: currentUser,
      usersLength: users.length,
      teamsLength: teams.length,
      gamesLength: games.length
    });

    // Wait for currentUser to be loaded before applying filters
    if (!currentUser) {
      console.log('🔍 Role filtering - currentUser not loaded yet, returning empty arrays');
      return { roleFilteredGames: [], availableStatuses: [] };
    }

    if (users.length === 0 || teams.length === 0 || games.length === 0) {
      console.log('🔍 Role filtering - Missing data, returning empty arrays');
      return { roleFilteredGames: [], availableStatuses: [] };
    }

    let fGames = games;
    let fTeams = teams;

    if (currentUser.role !== 'admin') {
      console.log('🔍 Role filtering - Non-admin user, applying filters');
      const mongoUser = users.find(u =>
        (u.email || u.Email) && (u.email || u.Email).toLowerCase() === currentUser.email.toLowerCase()
      );
      const userRole = mongoUser?.role || mongoUser?.Role;
      
      console.log('🔍 Role filtering - Found user:', { mongoUser, userRole });

      if (userRole === 'Coach' && mongoUser) {
        console.log('🔍 Role filtering - Coach role, filtering teams');
        fTeams = teams.filter(team => {
          const coachField = team.coach || team.Coach;
          const userId = mongoUser._id || mongoUser.id;
          
          // Handle both populated and unpopulated coach fields
          let isMatch = false;
          if (typeof coachField === 'string') {
            // Unpopulated: coach field is just the ID string
            isMatch = coachField === userId;
          } else if (coachField && typeof coachField === 'object') {
            // Populated: coach field is the full user object
            const coachId = coachField._id || coachField.id;
            isMatch = coachId === userId;
          } else if (Array.isArray(coachField)) {
            // Array of coach IDs or objects
            isMatch = coachField.some(coach => {
              if (typeof coach === 'string') {
                return coach === userId;
              } else if (coach && typeof coach === 'object') {
                const coachId = coach._id || coach.id;
                return coachId === userId;
              }
              return false;
            });
          }
          
          console.log('🔍 Team coach match:', { 
            teamName: team.teamName || team.TeamName, 
            coachField, 
            userId, 
            isMatch,
            coachFieldType: typeof coachField,
            coachFieldIsArray: Array.isArray(coachField)
          });
          return isMatch;
        });
        const teamIds = fTeams.map(team => team._id || team.id);
        console.log('🔍 Role filtering - Coach teams:', { fTeamsCount: fTeams.length, teamIds });
        
        fGames = games.filter(game => {
          const gameTeam = game.team || game.Team;
          
          // Handle both populated and unpopulated team fields
          let isMatch = false;
          if (typeof gameTeam === 'string') {
            // Unpopulated: team field is just the ID string
            isMatch = teamIds.includes(gameTeam);
          } else if (gameTeam && typeof gameTeam === 'object') {
            // Populated: team field is the full team object
            const teamId = gameTeam._id || gameTeam.id;
            isMatch = teamIds.includes(teamId);
          } else if (Array.isArray(gameTeam)) {
            // Array of team IDs or objects
            isMatch = gameTeam.some(team => {
              if (typeof team === 'string') {
                return teamIds.includes(team);
              } else if (team && typeof team === 'object') {
                const teamId = team._id || team.id;
                return teamIds.includes(teamId);
              }
              return false;
            });
          }
          
          console.log('🔍 Game team match:', { 
            gameTitle: game.gameTitle || game.GameTitle, 
            gameTeam, 
            teamIds, 
            isMatch,
            gameTeamType: typeof gameTeam,
            gameTeamIsArray: Array.isArray(gameTeam)
          });
          return isMatch;
        });
        console.log('🔍 Role filtering - Coach games:', { fGamesCount: fGames.length });
      } else if (userRole === 'Division Manager' && (mongoUser?.department || mongoUser?.Department)) {
        const department = mongoUser.department || mongoUser.Department;
        fTeams = teams.filter(team => {
          const teamDivision = team.division || team.Division;
          return teamDivision === department;
        });
        const teamIds = fTeams.map(team => team._id || team.id);
        fGames = games.filter(game => {
          const gameTeam = game.team || game.Team;
          return gameTeam && (teamIds.includes(gameTeam) || (Array.isArray(gameTeam) && teamIds.some(id => gameTeam.includes(id))));
        });
      }
    } else {
      console.log('🔍 Role filtering - Admin user, showing all games');
    }

    const statuses = [...new Set(fGames
      .map(game => game.status || game.Status)
      .filter(status => status)
    )].sort();

    console.log('🔍 Role filtering - Final result:', {
      roleFilteredGamesCount: fGames.length,
      availableStatuses: statuses,
      sampleGames: fGames.slice(0, 2)
    });

    return { roleFilteredGames: fGames, availableStatuses: statuses };
  }, [currentUser, users, teams, games]);

  const getFilteredGames = () => {
    let gamesToFilter = roleFilteredGames;

    if (statusFilter !== "all") {
      gamesToFilter = gamesToFilter.filter(game => (game.status || game.Status) === statusFilter);
    }
    
    // Apply result filter
    if (resultFilter !== "all") {
        gamesToFilter = gamesToFilter.filter(game => {
            // Only filter games that have a final score
            const finalScore = game.finalScoreDisplay || game.FinalScore_Display;
            if (!finalScore) return false;
            const gameResult = getGameResult(finalScore);
            return gameResult.result === resultFilter;
        });
    }

    return gamesToFilter.sort((a, b) => {
      const dateA = new Date(a.date || a.Date || 0);
      const dateB = new Date(b.date || b.Date || 0);
      return dateA - dateB;
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Scheduled': 'border-accent-primary text-accent-primary bg-accent-primary/10',
      'Played': 'border-warning text-warning bg-warning/10',
      'Finished': 'border-success text-success bg-success/10',
      'Done': 'border-success text-success bg-success/10',
      'Postponed': 'border-warning text-warning bg-warning/10',
      'Cancelled': 'border-disabled-custom text-disabled-custom bg-disabled-custom/10'
    };
    return colors[status] || 'border-disabled-custom text-disabled-custom bg-disabled-custom/10';
  };

  const getStatusDotColor = (status) => {
    const colors = {
      'Scheduled': 'bg-accent-primary shadow-lg shadow-accent-primary/50',
      'Played': 'bg-warning shadow-lg shadow-warning/50', 
      'Finished': 'bg-success shadow-lg shadow-success/50',
      'Done': 'bg-success shadow-lg shadow-success/50',
      'Postponed': 'bg-warning shadow-lg shadow-warning/50',
      'Cancelled': 'bg-disabled-custom shadow-lg shadow-disabled-custom/50'
    };
    return colors[status] || 'bg-disabled-custom';
  };

  const getGameResult = (scoreString) => {
    if (!scoreString || typeof scoreString !== 'string') return { result: 'unknown', icon: Minus, color: 'text-text-secondary', bg: 'bg-bg-secondary/50' };
    const scores = scoreString.split('-').map(s => parseInt(s.trim()));
    if (scores.length !== 2 || isNaN(scores[0]) || isNaN(scores[1])) {
        return { result: 'unknown', icon: Minus, color: 'text-text-secondary', bg: 'bg-bg-secondary/50' };
    }
    if (scores[0] > scores[1]) {
        return { result: 'win', icon: TrendingUp, color: 'text-success', bg: 'bg-success/20' };
    }
    if (scores[0] < scores[1]) {
        return { result: 'loss', icon: TrendingDown, color: 'text-error', bg: 'bg-error/20' };
    }
    return { result: 'draw', icon: Minus, color: 'text-warning', bg: 'bg-warning/20' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    if (isNaN(date)) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDetailedDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    if (isNaN(date)) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isUpcoming = (dateString) => {
    if (!dateString) return false;
    const gameDate = new Date(dateString);
    if (isNaN(gameDate)) return false;
    return gameDate > new Date();
  };

  const displayedGames = getFilteredGames();

  if (isDataLoading) {
    return <PageLoader message="Loading Mission Data..." />;
  }

  if (error) {
    return (
      <PageLayout>
        <EmptyState
          icon={Activity}
          title="Mission Data Unavailable"
          message={`There was an issue loading the schedule data: ${error.message || error.toString()}`}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout maxWidth="max-w-6xl">
      {/* Header */}
      <PageHeader
        title="Mission"
        accentWord="Schedule"
        subtitle="Tactical Operations Command Center"
      />

        {/* Control Panel (Filters) */}
        <DataCard
          title="Mission Filters"
          titleIcon={<Filter className="w-5 h-5 text-cyan-400" />}
          contentClassName="p-6"
          headerClassName="pb-4"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600 focus:border-cyan-400">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all" className="text-white focus:bg-slate-700 hover:bg-slate-700">All Missions</SelectItem>
                  {availableStatuses.map(status => (
                    <SelectItem key={status} value={status} className="text-white focus:bg-slate-700 hover:bg-slate-700">
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Result Filter */}
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-cyan-400" />
              <Select value={resultFilter} onValueChange={setResultFilter}>
                <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600 focus:border-cyan-400">
                  <SelectValue placeholder="Filter by result" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all" className="text-white focus:bg-slate-700 hover:bg-slate-700">All Results</SelectItem>
                  <SelectItem value="win" className="text-white focus:bg-slate-700 hover:bg-slate-700">Wins</SelectItem>
                  <SelectItem value="loss" className="text-white focus:bg-slate-700 hover:bg-slate-700">Losses</SelectItem>
                  <SelectItem value="draw" className="text-white focus:bg-slate-700 hover:bg-slate-700">Draws</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DataCard>

        {/* Games Grid */}
        <div className="space-y-4">
          {displayedGames.length > 0 ? (
            displayedGames.map((game) => {
              const gameId = game._id || game.id;
              const finalScore = game.finalScoreDisplay || game.FinalScore_Display;
              const gameResult = getGameResult(finalScore);
              const ResultIcon = gameResult.icon;

              return (
              <Link
                key={gameId}
                to={createPageUrl(`GameDetails?id=${gameId}`)}
                className="block group"
              >
                <Card className="shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 border border-slate-700 bg-slate-800/70 backdrop-blur-sm group-hover:scale-[1.01] group-hover:border-cyan-500/50 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                              {game.gameTitle || game.GameTitle || 'Mission Briefing'}
                            </h3>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                            <div className={`w-3 h-3 rounded-full ${getStatusDotColor(game.status || game.Status)} animate-pulse`} />
                            <Badge
                              variant="outline"
                              className={`text-sm font-mono ${getStatusColor(game.status || game.Status)}`}
                            >
                              {game.status || game.Status || 'Unknown'}
                            </Badge>
                            {isUpcoming(game.date || game.Date) && (
                              <Badge variant="outline" className="bg-orange-400/10 text-orange-400 border-orange-400 font-mono">
                                INCOMING
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-300">
                            <Calendar className="w-4 h-4 text-cyan-400" />
                            <div>
                              <span className="font-mono text-cyan-400">{formatDate(game.date || game.Date)}</span>
                              <br />
                              <span className="text-xs text-slate-500">{formatDetailedDate(game.date || game.Date)}</span>
                            </div>
                          </div>
                          {(game.location || game.Location) && (
                            <div className="flex items-center gap-2 text-slate-300">
                              <MapPin className="w-4 h-4 text-blue-400" />
                              <span className="font-medium">{game.location || game.Location}</span>
                            </div>
                          )}
                          <div className="flex flex-col gap-1">
                            {finalScore && (
                              <div className="flex items-center gap-2 text-slate-300">
                                <Trophy className="w-4 h-4 text-yellow-400" />
                                <span className="font-bold text-yellow-400 font-mono text-lg">{finalScore}</span>
                              </div>
                            )}
                            <GameStatsRotator gameId={gameId} reports={reports} players={players} />
                          </div>
                        </div>
                      </div>

                      <div className="text-right ml-6">
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all border border-slate-600 group-hover:border-cyan-400 ${gameResult.bg}`}>
                          <ResultIcon className={`w-8 h-8 transition-colors ${gameResult.color}`} />
                        </div>
                        <div className="mt-2 text-xs text-slate-500 font-mono capitalize">
                          {gameResult.result}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )})
          ) : (
            <EmptyState
              icon={Calendar}
              title="No Missions Scheduled"
              message={
                statusFilter !== "all" || resultFilter !== "all"
                  ? "Adjust mission parameters to view available operations." 
                  : "No tactical operations found in the system database."
              }
            />
          )}
        </div>
    </PageLayout>
  );
}
