
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "../components/DataContext";

// --- Game Stats Rotator Component ---
const GameStatsRotator = ({ gameId, reports, players }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const stats = useMemo(() => {
    // Ensure reports and players are available and are arrays
    if (!reports || !Array.isArray(reports) || !players || !Array.isArray(players)) {
      // console.log('GameStatsRotator: Missing data', { reportsCount: reports?.length, playersCount: players?.length }); // Debugging removed as per outline
      return [];
    }

    // Filter reports directly using r.Game and includes(gameId)
    const gameReports = reports.filter(r => r.Game && Array.isArray(r.Game) && r.Game.includes(gameId));
    
    // console.log(`GameStatsRotator: Found ${gameReports.length} reports for game ${gameId}`); // Debugging removed as per outline
    
    if (gameReports.length === 0) return [];

    const availableStats = [];

    // Man of the Match (MVP) - player with highest rating
    let mvpReport = null;
    let maxRating = -1;
    
    for (const report of gameReports) {
      const rating = report.GeneralRating || 0;
      if (rating > maxRating) {
        maxRating = rating;
        mvpReport = report;
      }
    }

    if (mvpReport && mvpReport.GeneralRating && mvpReport.GeneralRating > 0) {
      const mvpPlayer = players.find(p => mvpReport.Player && Array.isArray(mvpReport.Player) && mvpReport.Player.includes(p.id));
      if (mvpPlayer) {
        availableStats.push({ type: 'mvp', player: mvpPlayer.FullName, rating: mvpReport.GeneralRating });
      }
    }

    // Scorers - players who scored goals
    const scorers = gameReports
      .filter(r => r.Goals && r.Goals > 0)
      .map(r => {
        const player = players.find(p => r.Player && Array.isArray(r.Player) && r.Player.includes(p.id));
        return { name: player?.FullName || 'Unknown Player', count: r.Goals };
      })
      .filter(s => s.name !== 'Unknown Player');

    if (scorers.length > 0) {
      availableStats.push({ type: 'scorers', data: scorers });
    }

    // Assisters - players who made assists
    const assisters = gameReports
      .filter(r => r.Assists && r.Assists > 0)
      .map(r => {
        const player = players.find(p => r.Player && Array.isArray(r.Player) && r.Player.includes(p.id));
        return { name: player?.FullName || 'Unknown Player', count: r.Assists };
      })
      .filter(a => a.name !== 'Unknown Player');

    if (assisters.length > 0) {
      availableStats.push({ type: 'assisters', data: assisters });
    }

    // console.log(`GameStatsRotator: Generated ${availableStats.length} stats for game ${gameId}`, availableStats); // Debugging removed as per outline
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

  // Add this for debugging - you can remove it later
  useEffect(() => {
    console.log('GamesSchedule: Data loaded', { 
      gamesCount: games?.length, 
      reportsCount: reports?.length, 
      playersCount: players?.length 
    });
    
    // Log a few sample reports to see their structure
    if (reports && reports.length > 0) {
      console.log('Sample reports:', reports.slice(0, 3));
    }
  }, [games, reports, players]);

  const { roleFilteredGames, availableStatuses } = useMemo(() => {
    if (!currentUser || users.length === 0 || teams.length === 0 || games.length === 0) {
      return { roleFilteredGames: [], availableStatuses: [] };
    }

    let fGames = games;
    let fTeams = teams;

    if (currentUser.role !== 'admin') {
      const airtableUser = users.find(u =>
        u.Email && u.Email.toLowerCase() === currentUser.email.toLowerCase()
      );
      const airtableRole = airtableUser?.Role;

      if (airtableRole === 'Coach' && airtableUser) {
        fTeams = teams.filter(team =>
          team.Coach && team.Coach.includes(airtableUser.id)
        );
        const teamIds = fTeams.map(team => team.id);
        fGames = games.filter(game =>
          game.Team && teamIds.some(id => game.Team.includes(id))
        );
      } else if (airtableRole === 'Division Manager' && airtableUser?.Department) {
        fTeams = teams.filter(team =>
          team.Division === airtableUser.Department
        );
        const teamIds = fTeams.map(team => team.id);
        fGames = games.filter(game =>
          game.Team && teamIds.some(id => game.Team.includes(id))
        );
      }
    }

    const statuses = [...new Set(fGames
      .map(game => game.Status)
      .filter(status => status)
    )].sort();

    return { roleFilteredGames: fGames, availableStatuses: statuses };
  }, [currentUser, users, teams, games]);

  const getFilteredGames = () => {
    let gamesToFilter = roleFilteredGames;

    if (statusFilter !== "all") {
      gamesToFilter = gamesToFilter.filter(game => game.Status === statusFilter);
    }
    
    // Apply result filter
    if (resultFilter !== "all") {
        gamesToFilter = gamesToFilter.filter(game => {
            // Only filter games that have a final score
            if (!game.FinalScore_Display) return false;
            const gameResult = getGameResult(game.FinalScore_Display);
            return gameResult.result === resultFilter;
        });
    }

    return gamesToFilter.sort((a, b) => {
      const dateA = new Date(a.Date || 0);
      const dateB = new Date(b.Date || 0);
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
    return (
      <div className="p-6 md:p-8 bg-slate-900 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-700 rounded w-1/3"></div>
            <div className="grid gap-6">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-32 bg-slate-800 rounded-xl shadow-sm"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 bg-slate-900 min-h-screen">
        <div className="max-w-6xl mx-auto text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/25">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-white">Mission Data Unavailable</h3>
          <p className="text-slate-400 mb-3">There was an issue loading the schedule data.</p>
          <p className="text-sm text-red-400">{error.message || error.toString()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-slate-900 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Mission <span className="text-cyan-400">Schedule</span>
            </h1>
            <p className="text-slate-400 text-lg font-mono">
              Tactical Operations Command Center
            </p>
          </div>
        </div>

        {/* Control Panel (Filters) */}
        <Card className="shadow-2xl border border-slate-700 bg-slate-800/70 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-cyan-400" />
              Mission Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white hover:bg-slate-600 focus:border-cyan-400">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all" className="text-white focus:bg-slate-600">All Missions</SelectItem>
                    {availableStatuses.map(status => (
                      <SelectItem key={status} value={status} className="text-white focus:bg-slate-600">
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* New Result Filter */}
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-cyan-400" />
                <Select value={resultFilter} onValueChange={setResultFilter}>
                  <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white hover:bg-slate-600 focus:border-cyan-400">
                    <SelectValue placeholder="Filter by result" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all" className="text-white focus:bg-slate-600">All Results</SelectItem>
                    <SelectItem value="win" className="text-white focus:bg-slate-600 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-400 mr-1"/>Wins</SelectItem>
                    <SelectItem value="loss" className="text-white focus:bg-slate-600 flex items-center gap-2"><TrendingDown className="w-4 h-4 text-red-400 mr-1"/>Losses</SelectItem>
                    <SelectItem value="draw" className="text-white focus:bg-slate-600 flex items-center gap-2"><Minus className="w-4 h-4 text-yellow-400 mr-1"/>Draws</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Games Grid */}
        <div className="space-y-4">
          {displayedGames.length > 0 ? (
            displayedGames.map((game) => {
              const gameResult = getGameResult(game.FinalScore_Display);
              const ResultIcon = gameResult.icon;

              return (
              <Link
                key={game.id}
                to={createPageUrl(`GameDetails?id=${game.id}`)}
                className="block group"
              >
                <Card className="shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 border border-slate-700 bg-slate-800/70 backdrop-blur-sm group-hover:scale-[1.01] group-hover:border-cyan-500/50 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                            {game.GameTitle || 'Mission Briefing'}
                          </h3>
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getStatusDotColor(game.Status)} animate-pulse`} />
                            <Badge
                              variant="outline"
                              className={`text-sm font-mono ${getStatusColor(game.Status)}`}
                            >
                              {game.Status || 'Unknown'}
                            </Badge>
                            {isUpcoming(game.Date) && (
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
                              <span className="font-mono text-cyan-400">{formatDate(game.Date)}</span>
                              <br />
                              <span className="text-xs text-slate-500">{formatDetailedDate(game.Date)}</span>
                            </div>
                          </div>
                          {game.Location && (
                            <div className="flex items-center gap-2 text-slate-300">
                              <MapPin className="w-4 h-4 text-blue-400" />
                              <span className="font-medium">{game.Location}</span>
                            </div>
                          )}
                          <div className="flex flex-col gap-1">
                            {game.FinalScore_Display && (
                              <div className="flex items-center gap-2 text-slate-300">
                                <Trophy className="w-4 h-4 text-yellow-400" />
                                <span className="font-bold text-yellow-400 font-mono text-lg">{game.FinalScore_Display}</span>
                              </div>
                            )}
                            <GameStatsRotator gameId={game.id} reports={reports} players={players} />
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
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-r from-slate-700 to-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl border border-slate-600">
                <Calendar className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Missions Scheduled</h3>
              <p className="text-slate-400 mb-4">
                {statusFilter !== "all" || resultFilter !== "all"
                  ? "Adjust mission parameters to view available operations." 
                  : "No tactical operations found in the system database."
                }
              </p>
              <div className="w-full max-w-md mx-auto h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
