
import React, { useState, useEffect, useMemo } from "react";
import { User } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Users,
  TrendingUp,
  Trophy,
  Plus,
  Swords,
  FileText,
  CalendarClock,
  Eye,
  ChevronRight,
  Target,
  Calendar,
  MapPin,
  Star,
  Clock,
  ListChecks,
  ChevronLeft
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  Badge,
  Container,
  Section,
  Heading,
  Text,
  Grid
} from "@/components/ui/design-system-components";
import { useData } from "../components/DataContext";
import { format, formatDistanceToNow, isFuture, isPast, addWeeks, startOfWeek, endOfWeek, getYear, getISOWeek } from 'date-fns';

// Helper function to safely parse dates
const safeDate = (dateString) => {
  if (!dateString || dateString === '') return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

// Helper function to safely format distance to now
const safeFormatDistanceToNow = (dateString, options = {}) => {
  const date = safeDate(dateString);
  if (!date) return 'Invalid date';
  try {
    return formatDistanceToNow(date, options);
  } catch (error) {
    return 'Invalid date';
  }
};

// Helper function to safely check if date is in future
const safeIsFuture = (dateString) => {
  const date = safeDate(dateString);
  if (!date) return false;
  try {
    return isFuture(date);
  } catch (error) {
    return false;
  }
};

// Helper function to safely check if date is in past
const safeIsPast = (dateString) => {
  const date = safeDate(dateString);
  if (!date) return false;
  try {
    return isPast(date);
  } catch (error) {
    return false;
  }
};

// --- Recent Games & Next Game Component ---
const RecentAndNextGame = ({ games }) => {
  const recentGames = games
    .filter(game => game.Date && safeIsPast(game.Date) && game.FinalScore_Display)
    .sort((a, b) => {
      const dateA = safeDate(a.Date);
      const dateB = safeDate(b.Date);
      if (!dateA || !dateB) return 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  const nextGame = games
    .filter(game => game.Date && safeIsFuture(game.Date))
    .sort((a, b) => {
      const dateA = safeDate(a.Date);
      const dateB = safeDate(b.Date);
      if (!dateA || !dateB) return 0;
      return dateA - dateB;
    })[0];

  const getGameResult = (game) => {
    if (!game.FinalScore_Display) return 'unknown';
    const scores = game.FinalScore_Display.split('-').map(s => parseInt(s.trim()));
    if (scores.length !== 2 || isNaN(scores[0]) || isNaN(scores[1])) return 'unknown';
    if (scores[0] > scores[1]) return 'win';
    if (scores[0] < scores[1]) return 'loss';
    return 'draw';
  };

  const getResultColor = (result) => {
    switch(result) {
      case 'win': return 'bg-green-500';
      case 'loss': return 'bg-red-500';
      case 'draw': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getResultText = (result) => {
    switch(result) {
      case 'win': return 'W';
      case 'loss': return 'L';
      case 'draw': return 'D';
      default: return '?';
    }
  };

  return (
    <Card className="bg-slate-800/70 border border-slate-700 shadow-xl backdrop-blur-sm flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Game Zone
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <h3 className="text-sm font-semibold text-slate-400 mb-2">Recent Results</h3>
        <div className="flex gap-2 justify-center">
          {recentGames.length > 0 ? (
            recentGames.map((game) => {
              const result = getGameResult(game);
              return (
                <div key={game.id} className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${getResultColor(result)}`}>
                    {getResultText(result)}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{game.FinalScore_Display}</span>
                </div>
              );
            })
          ) : (
            <div className="text-center text-slate-500 py-2">
              <p className="text-sm">No recent games</p>
            </div>
          )}
        </div>
      </CardContent>
      <div className="border-t border-slate-700 mx-6"></div>
      <CardContent className="pt-4">
        <h3 className="text-sm font-semibold text-slate-400 mb-2">Next Game</h3>
        {nextGame ? (
          <Link to={createPageUrl(`GameDetails?id=${nextGame.id}`)} className="block hover:bg-slate-700/30 rounded-lg p-2 transition-colors -m-2">
            <p className="font-bold text-white truncate">{nextGame.GameTitle || "Untitled Game"}</p>
            <div className="text-sm text-cyan-400 font-mono mt-1">
              {safeFormatDistanceToNow(nextGame.Date, { addSuffix: true })}
            </div>
            {nextGame.Location && (
              <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                <MapPin className="w-3 h-3" />
                <span>{nextGame.Location}</span>
              </div>
            )}
          </Link>
        ) : (
          <div className="text-center text-slate-500 py-2">
            <p className="text-sm">No upcoming games</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// --- Weekly Training Plan Overview Component ---
const WeeklyTrainingPlanOverview = ({ teams, trainingSessions, sessionDrills, drills: allDrills }) => {
    const [weekOffset, setWeekOffset] = useState(0);

    const { weekStart, weekEnd, weekIdentifier, weekSessions } = useMemo(() => {
        const targetDate = addWeeks(new Date(), weekOffset);
        const start = startOfWeek(targetDate, { weekStartsOn: 0 });
        const end = endOfWeek(targetDate, { weekStartsOn: 0 });
        const id = `${getYear(start)}-${getISOWeek(start)}`;

        const teamIds = new Set(teams.map(t => t.id));
        const sessions = trainingSessions.filter(session =>
            session.WeekIdentifier === id &&
            session.Team?.some(tId => teamIds.has(tId))
        );

        return {
            weekStart: start,
            weekEnd: end,
            weekIdentifier: id,
            weekSessions: sessions
        };
    }, [weekOffset, teams, trainingSessions]);

    const dailyDrills = useMemo(() => {
        if (weekSessions.length === 0) return {};

        const sessionIds = new Set(weekSessions.map(s => s.id));
        const relevantSessionDrills = sessionDrills.filter(sd => sd.TrainingSessions?.some(sId => sessionIds.has(sId)));

        const drillsByDay = {};
        const drillDetails = new Map(allDrills.map(d => [d.id, d]));

        for (const session of weekSessions) {
            // Use safe date parsing and formatting
            const date = safeDate(session.Date);
            if (!date) continue; // Skip sessions with invalid dates

            try {
                const dayName = format(date, 'EEEE');
                if (!drillsByDay[dayName]) {
                    drillsByDay[dayName] = [];
                }
                const drillsForThisSession = relevantSessionDrills
                    .filter(sd => sd.TrainingSessions?.includes(session.id) && sd.Drill)
                    .map(sd => drillDetails.get(sd.Drill[0]))
                    .filter(Boolean);

                drillsByDay[dayName].push(...drillsForThisSession);
            } catch (error) {
                console.warn('Error formatting date for session:', session.id, error);
                continue; // Skip sessions with formatting errors
            }
        }
        return drillsByDay;
    }, [weekSessions, sessionDrills, allDrills]);

    const drillCategoryColors = {
        'Passing': 'bg-blue-500',
        'Shooting': 'bg-red-500',
        'Dribbling': 'bg-yellow-500',
        'Defense': 'bg-green-500',
        'Goalkeeping': 'bg-purple-500',
        'Warm-up': 'bg-orange-500',
        'Physical': 'bg-pink-500',
        'Tactics': 'bg-cyan-500',
        'Conditioning': 'bg-indigo-500',
        'Small Sided Game': 'bg-emerald-500',
    };

    return (
        <Card className="bg-slate-800/70 border border-slate-700 shadow-xl backdrop-blur-sm flex flex-col">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-green-400" />
                        Weekly Training
                    </CardTitle>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setWeekOffset(p => p - 1)} className="w-7 h-7 hover:bg-slate-700/50">
                            <ChevronLeft className="w-4 h-4 text-slate-400 hover:text-green-400" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setWeekOffset(p => p + 1)} className="w-7 h-7 hover:bg-slate-700/50">
                            <ChevronRight className="w-4 h-4 text-slate-400 hover:text-green-400" />
                        </Button>
                    </div>
                </div>
                <p className="text-sm text-slate-400 font-mono">{format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}</p>
            </CardHeader>
            <CardContent className="flex-grow">
                <h3 className="text-sm font-semibold text-slate-400 mb-2">This Week's Schedule</h3>
                {Object.keys(dailyDrills).length > 0 ? (
                    <div className="space-y-3">
                        {Object.entries(dailyDrills).map(([day, drills]) => (
                            <div key={day}>
                                <h4 className="font-bold text-white text-sm mb-1">{day}</h4>
                                <ul className="space-y-1 pl-2">
                                    {drills.map(drill => (
                                        <li key={drill.id} className="flex items-center gap-2 text-sm text-slate-400">
                                            <span className={`w-2 h-2 rounded-full ${drillCategoryColors[drill.Category] || 'bg-slate-500'}`}></span>
                                            <span className="truncate">{drill.DrillName}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-slate-500">
                        <p className="text-sm">No trainings scheduled</p>
                    </div>
                )}
            </CardContent>
            <div className="border-t border-slate-700 mx-6"></div>
            <CardContent className="pt-4">
                <h3 className="text-sm font-semibold text-slate-400 mb-2">Quick Actions</h3>
                {Object.keys(dailyDrills).length > 0 ? (
                    <Link to={createPageUrl("WeeklyCalendar")} className="block hover:bg-slate-700/30 rounded-lg p-2 transition-colors -m-2">
                        <p className="font-bold text-white">View Full Calendar</p>
                        <div className="text-sm text-green-400 font-mono mt-1">
                            {Object.keys(dailyDrills).length} training days scheduled
                        </div>
                    </Link>
                ) : (
                    <div className="text-center">
                        <Link to={createPageUrl("TrainingPlanner")}>
                           <Button size="sm" variant="outline" className="text-green-400 border-green-400/50 hover:bg-green-400/10 hover:text-green-400">
                                Plan This Week
                           </Button>
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// --- Random Player Spotlight Component ---
const PlayerSpotlight = ({ players, reports }) => {
  const [currentPlayer, setCurrentPlayer] = useState(null);

  useEffect(() => {
    if (players.length === 0) return;

    const getRandomPlayer = () => {
      const randomIndex = Math.floor(Math.random() * players.length);
      setCurrentPlayer(players[randomIndex]);
    };

    getRandomPlayer();
    const interval = setInterval(getRandomPlayer, 5000);

    return () => clearInterval(interval);
  }, [players]);

  const playerStats = useMemo(() => {
    if (!currentPlayer || !reports) return null;

    const playerReports = reports.filter(report => report.Player && report.Player.includes(currentPlayer.id));
    if (playerReports.length === 0) {
        return {
            averageRating: 'N/A',
            totalGoals: 0,
            totalAssists: 0,
            minutesPlayed: 0,
            totalReports: 0
        };
    }

    const totalRating = playerReports.reduce((sum, r) => sum + (r.GeneralRating || 0), 0);
    const averageRating = (totalRating / playerReports.length).toFixed(1);
    const totalGoals = playerReports.reduce((sum, r) => sum + (r.Goals || 0), 0);
    const totalAssists = playerReports.reduce((sum, r) => sum + (r.Assists || 0), 0);
    const minutesPlayed = playerReports.reduce((sum, r) => sum + (r.MinutesPlayed || 0), 0);

    return {
        averageRating,
        totalGoals,
        totalAssists,
        minutesPlayed,
        totalReports: playerReports.length
    };
  }, [currentPlayer, reports]);

  if (!currentPlayer) {
    return (
      <Card className="bg-slate-800/70 border border-slate-700 shadow-xl backdrop-blur-sm p-6 flex items-center justify-center">
        <div className="text-center text-slate-500">
          <Users className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No players available</p>
        </div>
      </Card>
    );
  }

  const getPlayerAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const date = safeDate(dateOfBirth);
    if (!date) return null;

    try {
      const today = new Date();
      let age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
        age--;
      }
      return age;
    } catch (error) {
      return null;
    }
  };

  const StatItem = ({ label, value }) => (
    <div className="text-center">
        <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );

  return (
    <Card className="bg-slate-800/70 border border-slate-700 shadow-xl backdrop-blur-sm p-4">
      <CardContent className="p-0">
        <Link to={createPageUrl(`Player?id=${currentPlayer.PlayerRecordID || currentPlayer.id}`)} className="block hover:bg-slate-700/30 rounded-lg p-2 transition-colors">
          <div className="flex items-center gap-4">
            <div className="relative">
              {currentPlayer["Profile Image"] ? (
                <img
                  src={currentPlayer["Profile Image"]}
                  alt={currentPlayer.FullName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-purple-400"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null }
              <div
                className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center border-2 border-purple-400"
                style={{ display: currentPlayer["Profile Image"] ? 'none' : 'flex' }}
              >
                <span className="text-white font-bold text-2xl">
                  {currentPlayer.FullName?.charAt(0) || 'P'}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-white">{currentPlayer.FullName}</p>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="text-purple-400 border-purple-400">
                  {currentPlayer.Position}
                </Badge>
                {currentPlayer.DateOfBirth && getPlayerAge(currentPlayer.DateOfBirth) && (
                  <span className="text-slate-400">Age {getPlayerAge(currentPlayer.DateOfBirth)}</span>
                )}
              </div>
            </div>
          </div>
        </Link>

        <div className="border-t border-slate-700 my-3"></div>

        <div className="px-2">
            <h4 className="text-sm font-bold text-purple-400 mb-3 text-center">Performance Stats</h4>
            {playerStats ? (
                <div className="grid grid-cols-3 md:grid-cols-2 gap-2">
                    <StatItem label="Rating" value={`${playerStats.averageRating}/5`} />
                    <StatItem label="Goals" value={playerStats.totalGoals} />
                    <StatItem label="Assists" value={playerStats.totalAssists} />
                    <StatItem label="Reports" value={playerStats.totalReports} />
                    <StatItem label="Minutes" value={playerStats.minutesPlayed} />
                </div>
            ) : (
                <p className="text-slate-500 text-center text-sm">No performance data.</p>
            )}
        </div>
      </CardContent>
    </Card>
  );
};

// --- Stat Card Component ---
const StatCard = ({ title, value, icon: Icon, linkTo, colorClass }) => (
  <Link to={linkTo} className="block group">
    <Card className={`bg-slate-800/70 border-slate-700 shadow-lg hover:shadow-cyan-500/30 hover:border-cyan-500 transition-all duration-300 backdrop-blur-sm`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-slate-700 border border-slate-600 group-hover:bg-cyan-500/10 group-hover:border-cyan-500 transition-colors`}>
                <Icon className={`w-6 h-6 text-slate-400 group-hover:text-cyan-400 transition-colors ${colorClass}`} />
             </div>
             <div>
                <p className="text-sm font-medium text-slate-400">{title}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
             </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </CardContent>
    </Card>
  </Link>
);

export default function Dashboard() {
  const { users, teams, players, reports, games, trainingSessions, sessionDrills, drills, isLoading: isDataLoading, error } = useData();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    User.me().then(setCurrentUser).catch(console.error);
  }, []);

  const { filteredTeams, filteredPlayers, filteredReports, filteredGames, userRole } = useMemo(() => {
    if (!currentUser || !users.length) {
      return { filteredTeams: [], filteredPlayers: [], filteredReports: [], filteredGames: [], userRole: '' };
    }
    if (currentUser.role === 'admin') {
      return {
        filteredTeams: teams,
        filteredPlayers: players,
        filteredReports: reports,
        filteredGames: games,
        userRole: 'Admin'
      };
    }

    const airtableUser = users.find(u => u.Email && u.Email.toLowerCase() === currentUser.email.toLowerCase());
    const airtableRole = airtableUser?.Role;

    let fTeams = teams;
    let fPlayers = players;
    let fGames = games;

    if (airtableRole === 'Coach' && airtableUser) {
      fTeams = teams.filter(team => team.Coach && team.Coach.includes(airtableUser.id));
      const teamIds = fTeams.map(team => team.id);
      fPlayers = players.filter(player => player.Team && teamIds.some(id => player.Team.includes(id)));
      fGames = games.filter(game => game.Team && teamIds.some(id => game.Team.includes(id)));
    } else if (airtableRole === 'Division Manager' && airtableUser?.Department) {
      fTeams = teams.filter(team => team.Division === airtableUser.Department);
      const teamIds = fTeams.map(team => team.id);
      fPlayers = players.filter(player => player.Team && teamIds.some(id => player.Team.includes(id)));
      fGames = games.filter(game => game.Team && teamIds.some(id => game.Team.includes(id)));
    } else {
        fTeams = [];
        fPlayers = [];
        fGames = [];
    }

    const playerIds = fPlayers.map(p => p.id);
    const fReports = reports.filter(report => report.Player && playerIds.some(id => report.Player.includes(id)));
    const displayRole = airtableRole || 'Coach';

    return { filteredTeams: fTeams, filteredPlayers: fPlayers, filteredReports: fReports, filteredGames: fGames, userRole: displayRole };
  }, [currentUser, users, teams, players, reports, games]);

  const recentEvents = useMemo(() => {
    const pastGames = filteredGames
        .filter(game => game.Date && safeIsPast(game.Date))
        .map(g => ({
          ...g,
          type: 'game',
          eventDate: safeDate(g.Date)
        }))
        .filter(g => g.eventDate); // Remove games with invalid dates

    const recentReports = filteredReports
        .filter(r => r.Date) // Only include reports with dates
        .map(r => ({
          ...r,
          type: 'report',
          eventDate: safeDate(r.Date)
        }))
        .filter(r => r.eventDate); // Remove reports with invalid dates

    return [...pastGames, ...recentReports]
        .sort((a, b) => b.eventDate - a.eventDate)
        .slice(0, 4);
  }, [filteredGames, filteredReports]);

  const getPlayerName = (report) => {
    if (!report.Player) return "Unknown Player";
    const player = players.find(p => p.id === report.Player[0]);
    return player?.FullName || "Unknown Player";
  };

  if (isDataLoading) {
    return (
      <div className="p-6 md:p-8 bg-slate-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-300 font-medium text-lg">Loading Mission Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 bg-slate-900 min-h-screen text-red-400">
        <p>Error loading dashboard data: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-slate-900 min-h-screen text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Welcome, <span className="text-cyan-400">{currentUser?.fullName?.split(' ')[0] || currentUser?.displayName?.split(' ')[0] || 'User'}</span>
            </h1>
            <p className="text-slate-400 text-lg font-mono">
              {userRole} Terminal
            </p>
          </div>
          <Link to={createPageUrl("AddReport")}>
            <Button className="bg-cyan-500 text-slate-900 font-bold hover:bg-cyan-400 transition-all duration-300 shadow-lg shadow-cyan-500/20 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              New Scout Report
            </Button>
          </Link>
        </div>

        {/* Top Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RecentAndNextGame games={filteredGames} />
          <WeeklyTrainingPlanOverview teams={filteredTeams} trainingSessions={trainingSessions} sessionDrills={sessionDrills} drills={drills} />
          <PlayerSpotlight players={filteredPlayers} reports={filteredReports} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <StatCard title="My Teams" value={filteredTeams.length} icon={Trophy} linkTo={createPageUrl("Dashboard")} />
            <StatCard title="Managed Players" value={filteredPlayers.length} icon={Users} linkTo={createPageUrl("Players")} />
            <StatCard title="Reports Filed" value={filteredReports.length} icon={TrendingUp} linkTo={createPageUrl("Players")} />
        </div>

        {/* Activity Log - מצומצם */}
        <Card className="bg-slate-800/70 border border-slate-700 shadow-xl backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <Eye className="w-6 h-6 text-cyan-400" />
                  Recent Activity
                </CardTitle>
                <p className="text-sm text-slate-400">Latest games and reports.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentEvents.length > 0 ? (
                  recentEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                      <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-700">
                        {event.type === 'game' ? <Swords className="w-5 h-5 text-cyan-400" /> : <FileText className="w-5 h-5 text-purple-400" />}
                      </div>
                      <div className="flex-1">
                        {event.type === 'game' ? (
                            <Link to={createPageUrl(`GameDetails?id=${event.id}`)} className="font-bold text-white hover:text-cyan-400 transition-colors">
                                {event.GameTitle || 'Game Played'}
                            </Link>
                        ) : (
                            <Link to={createPageUrl(`Player?id=${event.Player[0]}`)} className="font-bold text-white hover:text-purple-400 transition-colors">
                                Scout Report: {getPlayerName(event)}
                            </Link>
                        )}
                        <p className="text-sm text-slate-400">
                            {event.type === 'game' ? `Final Score: ${event.FinalScore_Display || 'N/A'}` : `Rating: ${event.GeneralRating || 'N/A'}/5`}
                        </p>
                      </div>
                      <div className="text-right text-sm text-slate-500 font-mono">
                        {safeFormatDistanceToNow(event.eventDate, { addSuffix: true })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                      <Eye className="w-12 h-12 mx-auto mb-3" />
                      <p className="font-medium">No recent activity</p>
                      <p className="text-sm">Data will appear here once games are played or reports are filed.</p>
                  </div>
                )}
              </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
