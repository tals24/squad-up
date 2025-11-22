
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
} from "@/shared/ui/primitives/design-system-components";
import { useData } from "@/app/providers/DataProvider";
import { useDashboardData, useUserRole, useRecentEvents } from "@/shared/hooks";
import { DashboardHeader, GameZone, DashboardStats, RecentActivity } from "../shared";
import { format, formatDistanceToNow, isFuture, isPast, addWeeks, startOfWeek, endOfWeek, getYear, getISOWeek } from 'date-fns';
import PageLoader from "@/components/PageLoader";



// --- Weekly Training Plan Overview Component ---
const WeeklyTrainingPlanOverview = ({ teams, trainingSessions, sessionDrills, drills: allDrills }) => {
    const [weekOffset, setWeekOffset] = useState(0);

    const { weekStart, weekEnd, weekIdentifier, weekSessions } = useMemo(() => {
        const now = new Date();
        const targetDate = addWeeks(now, weekOffset);
        const start = startOfWeek(targetDate, { weekStartsOn: 0 }); // Sunday - same as Training Planner
        const end = endOfWeek(targetDate, { weekStartsOn: 0 }); // Sunday - same as Training Planner
        
        // Use the same week ID calculation as Training Planner
        const id = `${getYear(targetDate)}-${getISOWeek(targetDate)}`;
        
        console.log('🔍 Dashboard Date Calculation Debug:', {
            now: now.toISOString(),
            weekOffset: weekOffset,
            targetDate: targetDate.toISOString(),
            start: start.toISOString(),
            end: end.toISOString(),
            startFormatted: format(start, 'MMM d'),
            endFormatted: format(end, 'MMM d, yyyy'),
            weekIdFromTargetDate: `${getYear(targetDate)}-${getISOWeek(targetDate)}`,
            weekIdFromStart: `${getYear(start)}-${getISOWeek(start)}`
        });

        console.log('🔍 Dashboard WeeklyTrainingPlanOverview Debug:', {
            weekIdentifier: id,
            weekOffset: weekOffset,
            currentDate: new Date().toISOString(),
            targetDate: targetDate.toISOString(),
            weekStart: start.toISOString(),
            weekEnd: end.toISOString(),
            weekStartFormatted: format(start, 'MMM d'),
            weekEndFormatted: format(end, 'MMM d, yyyy'),
            teamsCount: teams.length,
            trainingSessionsCount: trainingSessions.length,
            teams: teams.map(t => ({ id: t._id || t.id, name: t.teamName })),
            sessions: trainingSessions.map(s => ({ 
                id: s._id || s.id, 
                weekIdentifier: s.weekIdentifier || s.WeekIdentifier,
                team: s.team,
                Team: s.Team,
                sessionTitle: s.sessionTitle
            }))
        });

        const teamIds = new Set(teams.map(t => t._id || t.id));
        
        console.log('🔍 Team IDs for matching:', Array.from(teamIds));
        console.log('🔍 Sample session team field:', trainingSessions[0]?.team);
        const sessions = trainingSessions.filter(session => {
            const weekMatch = (session.weekIdentifier || session.WeekIdentifier) === id;
            // Handle both populated team object and team ID
            const teamMatch = teamIds.has(session.team) || 
                             (session.team && session.team._id && teamIds.has(session.team._id)) ||
                             (session.Team && session.Team.some(tId => teamIds.has(tId)));
            return weekMatch && teamMatch;
        });

        console.log('🔍 Filtered sessions for this week:', sessions.length, sessions.map(s => s.sessionTitle));

        return {
            weekStart: start,
            weekEnd: end,
            weekIdentifier: id,
            weekSessions: sessions
        };
    }, [weekOffset, teams, trainingSessions]);

    const dailyDrills = useMemo(() => {
        if (weekSessions.length === 0) return {};

        console.log('🔍 Dashboard dailyDrills debug:');
        console.log('  - weekSessions:', weekSessions.length);
        console.log('  - sessionDrills:', sessionDrills.length);
        console.log('  - allDrills:', allDrills.length);

        const sessionIds = new Set(weekSessions.map(s => s._id || s.id));
        const relevantSessionDrills = sessionDrills.filter(sd => {
            // Handle both populated and unpopulated trainingSession fields
            const sessionId = sd.trainingSession?._id || sd.trainingSession;
            return sessionIds.has(sessionId) || 
                   (sd.TrainingSessions && sd.TrainingSessions.some(sId => sessionIds.has(sId)));
        });

        console.log('  - relevantSessionDrills:', relevantSessionDrills.length);
        console.log('  - Sample sessionDrills:', sessionDrills.slice(0, 3));
        console.log('  - Sample sessionIds:', Array.from(sessionIds).slice(0, 3));
        console.log('  - Sample sessionDrill trainingSession field:', sessionDrills.slice(0, 3).map(sd => ({
            id: sd._id || sd.id,
            trainingSession: sd.trainingSession,
            TrainingSessions: sd.TrainingSessions,
            drill: sd.drill,
            Drill: sd.Drill
        })));

        const drillsByDay = {};
        const drillDetails = new Map(allDrills.map(d => [d._id || d.id, d]));

        for (const session of weekSessions) {
            // Use safe date parsing and formatting
            const date = safeDate(session.date || session.Date);
            if (!date) {
                console.log('  - Skipping session with invalid date:', session._id || session.id);
                continue; // Skip sessions with invalid dates
            }

            try {
                const dayName = format(date, 'EEEE');
                if (!drillsByDay[dayName]) {
                    drillsByDay[dayName] = [];
                }
                const sessionId = session._id || session.id;
                const drillsForThisSession = relevantSessionDrills
                    .filter(sd => {
                        // Handle both populated and unpopulated trainingSession fields
                        const sdSessionId = sd.trainingSession?._id || sd.trainingSession;
                        return (sdSessionId === sessionId || sd.TrainingSessions?.includes(sessionId)) && 
                               (sd.drill || sd.Drill);
                    })
                    .map(sd => {
                        // Handle both populated and unpopulated drill fields
                        const drillId = sd.drill?._id || sd.drill || sd.Drill?.[0];
                        const drill = drillDetails.get(drillId);
                        console.log('  - Drill mapping:', { drillId, drill: drill?.drillName || drill?.DrillName });
                        return drill;
                    })
                    .filter(Boolean);

                console.log(`  - ${dayName}: ${drillsForThisSession.length} drills`);
                drillsByDay[dayName].push(...drillsForThisSession);
            } catch (error) {
                console.warn('Error formatting date for session:', session.id, error);
                continue; // Skip sessions with formatting errors
            }
        }
        
        console.log('  - Final drillsByDay:', Object.keys(drillsByDay).map(day => ({ day, count: drillsByDay[day].length })));
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
                    <div 
                        className="max-h-48 overflow-y-auto pr-2"
                        style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(148, 163, 184, 0.2) transparent'
                        }}
                    >
                        <div className="grid grid-cols-7 gap-3 min-w-max pb-2">
                            {[
                                { full: 'Sunday', short: 'SUN' },
                                { full: 'Monday', short: 'MON' },
                                { full: 'Tuesday', short: 'TUE' },
                                { full: 'Wednesday', short: 'WED' },
                                { full: 'Thursday', short: 'THU' },
                                { full: 'Friday', short: 'FRI' },
                                { full: 'Saturday', short: 'SAT' }
                            ].map(({ full: day, short: shortDay }) => {
                                const drills = dailyDrills[day] || [];
                                return (
                                    <div key={day} className="bg-slate-700/50 p-3 rounded-lg border border-slate-600 text-center min-w-[80px]">
                                        <h4 className={`font-semibold ${DASHBOARD_COLORS.text.primary} text-xs mb-2 uppercase tracking-wider`}>{shortDay}</h4>
                                        <div className="space-y-1">
                                            {drills.length > 0 ? (
                                                drills.map(drill => (
                                                    <div key={drill._id || drill.id} className={`flex flex-col items-center gap-1 text-xs ${DASHBOARD_COLORS.text.secondary}`}>
                                                        <span className={`w-2 h-2 rounded-full ${DRILL_CATEGORY_COLORS[drill.category || drill.Category] || 'bg-slate-500'}`}></span>
                                                        <span className="truncate text-center leading-tight">{drill.drillName || drill.DrillName}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-xs text-slate-500 italic">No drills</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-slate-500 py-8">
                        <p className="text-sm">No trainings scheduled</p>
                    </div>
                )}
            </CardContent>
            <div className="border-t border-slate-700 mx-6"></div>
            <CardContent className="pt-4">
                <h3 className={`text-sm font-semibold ${DASHBOARD_COLORS.text.secondary} mb-2`}>Quick Actions</h3>
                {Object.keys(dailyDrills).length > 0 ? (
                    <Link to={`${createPageUrl("TrainingPlanner")}?weekOffset=${weekOffset}`}>
                        <Button size="sm" variant="outline" className="bg-slate-800/70 text-cyan-400 border-cyan-400/50 hover:bg-slate-700/70 hover:text-cyan-400 w-full">
                            View Full Calendar
                        </Button>
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
    return <PageLoader message="Loading Mission Data..." />;
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
