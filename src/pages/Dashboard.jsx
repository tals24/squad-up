
import React, { useState, useEffect, useMemo } from "react";
import { User } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl, getPositionBadgeClasses, safeDate, safeFormatDistanceToNow, safeIsFuture, safeIsPast, getGameResult, getResultColor, getResultText, DASHBOARD_COLORS, DRILL_CATEGORY_COLORS, CARD_STYLES } from "@/utils";
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
import { useDashboardData, useUserRole, useRecentEvents } from "../hooks";
import { DashboardHeader, GameZone, DashboardStats, RecentActivity } from "../components/dashboard";
import { format, formatDistanceToNow, isFuture, isPast, addWeeks, startOfWeek, endOfWeek, getYear, getISOWeek } from 'date-fns';



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


    return (
        <Card className={`${DASHBOARD_COLORS.background.card} ${DASHBOARD_COLORS.background.border} shadow-xl ${DASHBOARD_COLORS.effects.hoverShadow} ${DASHBOARD_COLORS.effects.hoverBorder} ${DASHBOARD_COLORS.effects.transition} backdrop-blur-sm flex flex-col`}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className={`text-lg font-bold ${DASHBOARD_COLORS.text.primary} flex items-center gap-2`}>
                        <ListChecks className={`w-5 h-5 ${DASHBOARD_COLORS.text.accent}`} />
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
                <p className={`text-sm ${DASHBOARD_COLORS.text.secondary} font-mono`}>{format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}</p>
            </CardHeader>
            <CardContent className="flex-grow">
                <h3 className={`text-sm font-semibold ${DASHBOARD_COLORS.text.secondary} mb-2`}>This Week's Schedule</h3>
                {Object.keys(dailyDrills).length > 0 ? (
                    <div className="space-y-3">
                        {Object.entries(dailyDrills).map(([day, drills]) => (
                            <div key={day}>
                                <h4 className={`font-bold ${DASHBOARD_COLORS.text.primary} text-sm mb-1`}>{day}</h4>
                                <ul className="space-y-1 pl-2">
                                    {drills.map(drill => (
                                        <li key={drill.id} className={`flex items-center gap-2 text-sm ${DASHBOARD_COLORS.text.secondary}`}>
                                            <span className={`w-2 h-2 rounded-full ${DRILL_CATEGORY_COLORS[drill.Category] || 'bg-slate-500'}`}></span>
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
                <h3 className={`text-sm font-semibold ${DASHBOARD_COLORS.text.secondary} mb-2`}>Quick Actions</h3>
                {Object.keys(dailyDrills).length > 0 ? (
                    <Link to={createPageUrl("WeeklyCalendar")} className={`block ${DASHBOARD_COLORS.background.hover} rounded-lg p-2 transition-colors -m-2`}>
                        <p className={`font-bold ${DASHBOARD_COLORS.text.primary}`}>View Full Calendar</p>
                        <div className={`text-sm ${DASHBOARD_COLORS.text.accent} font-mono mt-1`}>
                            {Object.keys(dailyDrills).length} training days scheduled
                        </div>
                    </Link>
                ) : (
                    <div className="text-center">
                        <Link to={createPageUrl("TrainingPlanner")}>
                           <Button size="sm" variant="outline" className="bg-slate-800/70 text-green-400 border-green-400/50 hover:bg-slate-700/70 hover:text-green-400">
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

    const playerReports = reports.filter(report => report.player && report.player._id === currentPlayer._id);
    if (playerReports.length === 0) {
        return {
            averageRating: 'N/A',
            totalGoals: 0,
            totalAssists: 0,
            minutesPlayed: 0,
            totalReports: 0
        };
    }

    const totalRating = playerReports.reduce((sum, r) => sum + (r.rating || 0), 0);
    const averageRating = (totalRating / playerReports.length).toFixed(1);
    const totalGoals = playerReports.reduce((sum, r) => sum + (r.goals || 0), 0);
    const totalAssists = playerReports.reduce((sum, r) => sum + (r.assists || 0), 0);
    const minutesPlayed = playerReports.reduce((sum, r) => sum + (r.minutesPlayed || 0), 0);

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
    <Card className={`${DASHBOARD_COLORS.background.card} ${DASHBOARD_COLORS.background.border} shadow-xl ${DASHBOARD_COLORS.effects.hoverShadow} ${DASHBOARD_COLORS.effects.hoverBorder} ${DASHBOARD_COLORS.effects.transition} backdrop-blur-sm p-4`}>
      <CardContent className="p-0">
        <Link to={createPageUrl(`Player?id=${currentPlayer._id}`)} className={`block ${DASHBOARD_COLORS.background.hover} rounded-lg p-2 transition-colors`}>
          <div className="flex items-center gap-4">
            <div className="relative">
              {currentPlayer.profileImage ? (
                <img
                  src={currentPlayer.profileImage}
                  alt={currentPlayer.fullName}
                  className={`w-16 h-16 rounded-full object-cover border-2 border-${DASHBOARD_COLORS.primary}`}
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null }
              <div
                className={`w-16 h-16 bg-gradient-to-r ${DASHBOARD_COLORS.primaryGradient} rounded-full flex items-center justify-center border-2 border-${DASHBOARD_COLORS.primary}`}
                style={{ display: currentPlayer.profileImage ? 'none' : 'flex' }}
              >
                <span className="text-white font-bold text-2xl">
                  {currentPlayer.fullName?.charAt(0) || 'P'}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <p className={`font-bold text-lg ${DASHBOARD_COLORS.text.primary}`}>{currentPlayer.fullName}</p>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className={`${getPositionBadgeClasses(currentPlayer.position)} hover:bg-transparent`}>
                  {currentPlayer.position}
                </Badge>
                {currentPlayer.dateOfBirth && getPlayerAge(currentPlayer.dateOfBirth) && (
                  <span className={DASHBOARD_COLORS.text.secondary}>Age {getPlayerAge(currentPlayer.dateOfBirth)}</span>
                )}
              </div>
            </div>
          </div>
        </Link>

        <div className="border-t border-slate-700 my-3"></div>

        <div className="px-2">
            <h4 className={`text-sm font-bold ${DASHBOARD_COLORS.text.accent} mb-3 text-center`}>Performance Stats</h4>
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


export default function Dashboard() {
  const { users, teams, players, reports, games, trainingSessions, sessionDrills, drills, isLoading: isDataLoading, error } = useData();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    User.me().then(setCurrentUser).catch(console.error);
  }, []);

  // Use custom hooks for data filtering and calculations
  const { filteredTeams, filteredPlayers, filteredReports, filteredGames, userRole } = useDashboardData({
    currentUser,
    users,
    teams,
    players,
    reports,
    games
  });

  const { roleDisplay } = useUserRole({
    currentUser,
    users,
    teams
  });

  const { recentEvents } = useRecentEvents({
    filteredGames,
    filteredReports
  });

  const getPlayerName = (report) => {
    if (!report.player) return "Unknown Player";
    // MongoDB structure: report.player is populated object or ObjectId
    if (typeof report.player === 'object' && report.player.fullName) {
      return report.player.fullName;
    }
    const player = players.find(p => p._id === report.player);
    return player?.fullName || "Unknown Player";
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
        <DashboardHeader 
          currentUser={currentUser}
          roleDisplay={roleDisplay}
        />

        {/* Top Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GameZone games={filteredGames} />
          <WeeklyTrainingPlanOverview teams={filteredTeams} trainingSessions={trainingSessions} sessionDrills={sessionDrills} drills={drills} />
          <PlayerSpotlight players={filteredPlayers} reports={filteredReports} />
        </div>

        {/* Stats Grid */}
        <DashboardStats 
          teamsCount={filteredTeams.length}
          playersCount={filteredPlayers.length}
          reportsCount={filteredReports.length}
        />

        {/* Activity Log */}
        <RecentActivity 
          events={recentEvents}
          getPlayerName={getPlayerName}
        />
      </div>
    </div>
  );
}
