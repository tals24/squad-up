
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import {
  TrendingUp,
  Users,
  Trophy,
  Target,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/primitives/card";
import { Badge } from "@/shared/ui/primitives/badge";
import { Progress } from "@/shared/ui/primitives/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/primitives/select";
import { PageLayout, PageHeader, DataCard, LoadingState, EmptyState } from "@/shared/ui/primitives/design-system-components";
import { useData } from "@/app/providers/DataProvider";

export default function Analytics() {
  const { users, teams, players, reports, isLoading: isDataLoading } = useData();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState("all");

  useEffect(() => {
    User.me().then(setCurrentUser).catch(console.error);
  }, []);

  const getFilteredData = () => {
    if (!currentUser) return { filteredPlayers: [], filteredReports: [], filteredTeams: [] };

    let filteredPlayers = players;
    let filteredTeams = teams;

    if (currentUser.role === 'Coach') {
      filteredTeams = teams.filter(team =>
        team.Coach && team.Coach.includes(currentUser.email)
      );
      const teamIds = filteredTeams.map(team => team.id);
      filteredPlayers = players.filter(player =>
        player.Team && teamIds.some(id => player.Team.includes(id))
      );
    }

    if (selectedTeam !== "all") {
      filteredPlayers = filteredPlayers.filter(player =>
        player.Team && player.Team.includes(selectedTeam)
      );
    }

    const playerIds = filteredPlayers.map(player => player.id);
    const filteredReports = reports.filter(report =>
      report.Player && playerIds.some(id => report.Player.includes(id))
    );

    return { filteredPlayers, filteredReports, filteredTeams };
  };

  const calculateAnalytics = () => {
    const { filteredPlayers, filteredReports } = getFilteredData();

    if (filteredReports.length === 0) {
      return {
        averageRating: 0,
        totalGoals: 0,
        totalAssists: 0,
        totalMinutes: 0,
        positionBreakdown: {},
        topPerformers: [],
        recentTrends: 0
      };
    }

    const totalRating = filteredReports.reduce((sum, report) => sum + (report.GeneralRating || 0), 0);
    const totalGoals = filteredReports.reduce((sum, report) => sum + (report.Goals || 0), 0);
    const totalAssists = filteredReports.reduce((sum, report) => sum + (report.Assists || 0), 0);
    const totalMinutes = filteredReports.reduce((sum, report) => sum + (report.MinutesPlayed || 0), 0);

    // Position breakdown
    const positionBreakdown = filteredPlayers.reduce((acc, player) => {
      const position = player.Position || 'Unknown';
      acc[position] = (acc[position] || 0) + 1;
      return acc;
    }, {});

    // Top performers (players with highest average ratings)
    const playerPerformance = filteredPlayers.map(player => {
      const playerReports = filteredReports.filter(report =>
        report.Player && report.Player.includes(player.id)
      );

      if (playerReports.length === 0) {
        return {
          player,
          averageRating: 0,
          reportCount: 0,
          totalGoals: 0,
          totalAssists: 0
        };
      }

      const avgRating = playerReports.reduce((sum, report) => sum + (report.GeneralRating || 0), 0) / playerReports.length;
      const totalGoals = playerReports.reduce((sum, report) => sum + (report.Goals || 0), 0);
      const totalAssists = playerReports.reduce((sum, report) => sum + (report.Assists || 0), 0);

      return {
        player,
        averageRating: avgRating,
        reportCount: playerReports.length,
        totalGoals,
        totalAssists
      };
    }).sort((a, b) => b.averageRating - a.averageRating).slice(0, 5);

    // Recent trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentReports = filteredReports.filter(report =>
      report.Date && new Date(report.Date) >= thirtyDaysAgo
    );

    return {
      averageRating: (totalRating / filteredReports.length).toFixed(1),
      totalGoals,
      totalAssists,
      totalMinutes,
      positionBreakdown,
      topPerformers: playerPerformance,
      recentTrends: recentReports.length
    };
  };

  const analytics = calculateAnalytics();
  const { filteredTeams } = getFilteredData();

  if (isLoading) {
    return <LoadingState message="Loading analytics data..." />;
  }

  return (
    <PageLayout>
      {/* Header */}
      <PageHeader
        title="Analytics"
        accentWord="Dashboard"
        subtitle="Performance insights and team statistics"
        actionButton={
          currentUser?.role !== 'Coach' && (
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600 text-white focus:border-cyan-400">
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600 text-white">
                <SelectItem value="all" className="focus:bg-slate-700 hover:bg-slate-700">All Teams</SelectItem>
                {filteredTeams.map(team => (
                  <SelectItem key={team.TeamID} value={team.TeamID} className="focus:bg-slate-700 hover:bg-slate-700">
                    {team.TeamName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        }
      />

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DataCard hover={true} className="hover:shadow-cyan-500/30 hover:border-cyan-500/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-400">Average Rating</h3>
              <Target className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {analytics.averageRating}/5
            </div>
            <div className="flex items-center text-sm text-slate-400">
              <span>Team performance</span>
            </div>
          </DataCard>

          <DataCard hover={true} className="hover:shadow-cyan-500/30 hover:border-cyan-500/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-400">Total Goals</h3>
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {analytics.totalGoals}
            </div>
            <div className="flex items-center text-sm text-slate-400">
              <span>Goals scored</span>
            </div>
          </DataCard>

          <DataCard hover={true} className="hover:shadow-cyan-500/30 hover:border-cyan-500/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-400">Total Assists</h3>
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {analytics.totalAssists}
            </div>
            <div className="flex items-center text-sm text-slate-400">
              <span>Assists made</span>
            </div>
          </DataCard>

          <DataCard hover={true} className="hover:shadow-cyan-500/30 hover:border-cyan-500/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-400">Play Time</h3>
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {Math.round(analytics.totalMinutes / 60)}h
            </div>
            <div className="flex items-center text-sm text-slate-400">
              <span>Total minutes</span>
            </div>
          </DataCard>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Top Performers */}
          <div className="lg:col-span-2">
            <DataCard
              title="Top Performers"
              titleIcon={<TrendingUp className="w-6 h-6 text-cyan-400" />}
            >
                <div className="space-y-4">
                  {analytics.topPerformers.length > 0 ? (
                    analytics.topPerformers.map((performer, index) => (
                      <div key={performer.player.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-700 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-4">
                          {performer.player["Profile Image"] ? (
                            <img
                              src={performer.player["Profile Image"]}
                              alt={performer.player.FullName}
                              className="w-12 h-12 rounded-full object-cover border-2 border-accent-primary shadow-lg"
                              onError={(e) => {
                                const self = e.target;
                                const nextSibling = self.nextSibling;
                                self.style.display = 'none';
                                if (nextSibling) {
                                  nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center border-2 border-accent-primary shadow-lg"
                            style={{ display: performer.player["Profile Image"] ? 'none' : 'flex' }}
                          >
                            <span className="text-text-primary font-bold">
                              {performer.player.FullName?.charAt(0) || 'P'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-text-primary">{performer.player.FullName}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs border-border-custom text-text-primary">
                              {performer.player.Position}
                            </Badge>
                            <span className="text-sm text-text-secondary">
                              {performer.reportCount} reports
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-text-primary">
                            {performer.averageRating.toFixed(1)}
                          </div>
                          <div className="text-xs text-text-secondary">avg rating</div>
                          <div className="text-sm text-slate-500 mt-1">
                            {performer.totalGoals}G • {performer.totalAssists}A
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">No performance data available yet</p>
                    </div>
                  )}
                </div>
            </DataCard>
          </div>

          {/* Position Breakdown */}
          <div>
            <Card className="shadow-xl border-border-custom bg-bg-secondary/70 backdrop-blur-sm mb-6">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <PieChart className="w-6 h-6 text-accent-primary" />
                  Position Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics.positionBreakdown).map(([position, count]) => {
                    const total = Object.values(analytics.positionBreakdown).reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? (count / total) * 100 : 0;

                    const colors = {
                      'Goalkeeper': 'bg-accent-secondary',
                      'Defender': 'bg-accent-primary',
                      'Midfielder': 'bg-success',
                      'Forward': 'bg-error',
                      'Unknown': 'bg-disabled-custom'
                    };

                    return (
                      <div key={position} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-text-primary">{position}</span>
                          <span className="text-sm text-text-secondary">{count} players</span>
                        </div>
                        <Progress
                          value={percentage}
                          className={`h-2 ${colors[position] || 'bg-disabled-custom'}`}
                        />
                        <div className="text-right text-xs text-slate-500">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-border-custom bg-bg-secondary/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-accent-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">
                    {analytics.recentTrends}
                  </div>
                  <p className="text-slate-400">Reports in last 30 days</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    </PageLayout>
  );
}
