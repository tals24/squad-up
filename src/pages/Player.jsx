
import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  Calendar,
  Users,
  Trophy,
  Target,
  TrendingUp,
  Star,
  Plus,
  Clock,
  Award,
  Eye,
  Hash,
  Globe,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useData } from "../components/DataContext";

export default function Player() {
  const [searchParams] = useSearchParams();
  const playerId = searchParams.get('id');

  const { players, reports: allReports, teams, games, isLoading: isDataLoading } = useData();

  const [player, setPlayer] = useState(null);
  const [playerReports, setPlayerReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isDataLoading && playerId) {
      const foundPlayer = players.find(p => p.id === playerId);
      if (foundPlayer) {
        setPlayer(foundPlayer);
        const reportsForPlayer = allReports
          .filter(report => report.Player && report.Player.includes(foundPlayer.id))
          .sort((a, b) => new Date(b.Date) - new Date(a.Date));
        setPlayerReports(reportsForPlayer);
      }
      setIsLoading(false);
    }
  }, [playerId, players, allReports, teams, games, isDataLoading]);

  const getPlayerAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getTeamName = (teamId) => {
    if (!teamId || !Array.isArray(teamId)) return "No Team";
    const team = teams.find(t => teamId.includes(t.id));
    return team?.TeamName || team?.Name || "Unknown Team";
  };

  const getPositionBadge = (position) => {
    const styles = {
      'Goalkeeper': 'bg-purple-900/50 text-purple-300 border-purple-500/30',
      'Defender': 'bg-blue-900/50 text-blue-300 border-blue-500/30',
      'Midfielder': 'bg-green-900/50 text-green-300 border-green-500/30',
      'Forward': 'bg-red-900/50 text-red-300 border-red-500/30'
    };
    return styles[position] || 'bg-bg-secondary text-text-primary border-border-custom';
  };

  const calculateStats = () => {
    if (playerReports.length === 0) return { averageRating: 0, totalGoals: 0, totalAssists: 0, totalMinutes: 0 };

    const ratedReports = playerReports.filter(r => r.GeneralRating);
    const totalRating = ratedReports.reduce((sum, report) => sum + (report.GeneralRating || 0), 0);
    const totalGoals = playerReports.reduce((sum, report) => sum + (report.Goals || 0), 0);
    const totalAssists = playerReports.reduce((sum, report) => sum + (report.Assists || 0), 0);
    const totalMinutes = playerReports.reduce((sum, report) => sum + (report.MinutesPlayed || 0), 0);

    return {
      averageRating: ratedReports.length > 0 ? (totalRating / ratedReports.length).toFixed(1) : 0,
      totalGoals,
      totalAssists,
      totalMinutes
    };
  };

  const StatBox = ({ value, label, icon: Icon, color }) => (
    <div className="bg-bg-secondary/50 p-4 rounded-lg border border-border-custom text-center">
      <div className={`mx-auto w-10 h-10 rounded-lg flex items-center justify-center bg-bg-secondary border border-border-custom mb-2`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="text-2xl font-bold text-text-primary">{value}</div>
      <div className="text-xs text-text-secondary uppercase tracking-wider">{label}</div>
    </div>
  );

  if (isLoading || isDataLoading) {
    return (
      <div className="p-6 md:p-8 bg-bg-primary min-h-screen">
        <div className="max-w-7xl mx-auto animate-pulse space-y-8">
          <div className="h-10 bg-bg-secondary rounded-lg w-1/3"></div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
              <div className="h-64 bg-bg-secondary rounded-2xl"></div>
              <div className="h-80 bg-bg-secondary rounded-2xl"></div>
            </div>
            <div className="lg:col-span-2 h-[50rem] bg-bg-secondary rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="p-6 md:p-8 bg-bg-primary min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <Trophy className="w-16 h-16 text-red-500/50 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary mb-2">Player Not Found</h1>
          <p className="text-text-secondary mb-6">The player you're looking for doesn't exist or there was an error loading the data.</p>
          <Link to={createPageUrl("Players")}>
            <Button className="bg-accent-primary hover:bg-cyan-600 text-slate-900 font-bold">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Players
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="p-6 md:p-8 bg-bg-primary min-h-screen text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("Players")}>
            <Button variant="outline" size="icon" className="border-border-custom bg-bg-secondary/50 text-text-primary hover:bg-bg-secondary hover:border-accent-primary hover:text-accent-primary transition-all duration-300 backdrop-blur-sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
              {player.FullName}
            </h1>
            <p className="text-lg text-accent-primary font-mono">{player.Position}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <Card className="shadow-2xl border-border-custom bg-bg-secondary/70 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="relative inline-block mb-4">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur opacity-50 animate-pulse"></div>
                    <img
                      src={player["Profile Image"]?.[0]?.url || ''}
                      alt={player.FullName}
                      className="relative w-28 h-28 rounded-full object-cover border-4 border-border-custom shadow-lg"
                      onError={(e) => {
                          const self = e.target;
                          self.style.display = 'none';
                          const fallback = self.nextSibling;
                          if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div
                        className="relative w-28 h-28 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center border-4 border-border-custom shadow-lg"
                        style={{ display: 'none' }}
                    >
                        <span className="text-text-primary font-bold text-4xl">
                        {player.FullName?.charAt(0) || 'P'}
                        </span>
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold text-text-primary">
                  {player.FullName}
                </CardTitle>
                <Badge variant="outline" className={`mt-2 ${getPositionBadge(player.Position)}`}>
                  {player.Position}
                </Badge>

                <div className="mt-6 space-y-4 text-left">
                    <div className="flex items-center gap-4 text-sm">
                        <Users className="w-5 h-5 text-accent-primary"/>
                        <span className="text-text-secondary">Team:</span>
                        <span className="font-medium text-text-primary">{getTeamName(player.Team)}</span>
                    </div>
                    {player.DateOfBirth && (
                    <>
                        <div className="flex items-center gap-4 text-sm">
                            <Calendar className="w-5 h-5 text-accent-primary"/>
                            <span className="text-text-secondary">Age:</span>
                            <span className="font-medium text-text-primary">{getPlayerAge(player.DateOfBirth)} years old</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <Globe className="w-5 h-5 text-accent-primary"/>
                            <span className="text-text-secondary">Born:</span>
                            <span className="font-medium text-text-primary">{new Date(player.DateOfBirth).toLocaleDateString()}</span>
                        </div>
                    </>
                    )}
                    {player.PlayerRecordID && (
                    <div className="flex items-center gap-4 text-sm">
                        <Hash className="w-5 h-5 text-accent-primary"/>
                        <span className="text-text-secondary">ID:</span>
                        <span className="font-medium text-text-primary font-mono text-xs">{player.PlayerRecordID}</span>
                    </div>
                    )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-2xl border-border-custom bg-bg-secondary/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-text-primary flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-accent-primary" />
                  Performance Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="bg-bg-primary/50 p-4 rounded-lg text-center">
                    <div className="text-text-secondary text-sm mb-1">Average Rating</div>
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-3xl font-bold text-warning">{stats.averageRating}</span>
                        <Star className="w-6 h-6 text-warning fill-current" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <StatBox value={stats.totalGoals} label="Goals" icon={Trophy} color="text-accent-primary" />
                    <StatBox value={stats.totalAssists} label="Assists" icon={Users} color="text-accent-secondary" />
                    <StatBox value={stats.totalMinutes} label="Minutes" icon={Clock} color="text-success" />
                    <StatBox value={playerReports.length} label="Reports" icon={Eye} color="text-error" />
                 </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-2xl border-border-custom bg-bg-secondary/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-text-primary flex items-center gap-3">
                  <Zap className="w-6 h-6 text-warning" />
                  AI Player Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="text-text-primary text-sm space-y-2">
                 <p>
                   The AI will analyze all scouting and game reports to generate a concise summary of the player's strengths, weaknesses, and potential development areas.
                 </p>
                 <p className="text-xs text-yellow-500/80">AI feature coming soon.</p>
              </CardContent>
            </Card>

            <Card className="shadow-2xl border-border-custom bg-bg-secondary/70 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl font-bold text-text-primary flex items-center gap-3">
                    <Clock className="w-6 h-6 text-accent-primary" />
                    Development Timeline
                  </CardTitle>
                  <Link to={createPageUrl(`AddReport?playerId=${player.PlayerRecordID}`)}>
                    <Button size="sm" className="bg-accent-primary hover:bg-cyan-600 text-slate-900 font-bold">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Report
                    </Button>
                  </Link>
              </CardHeader>
              <CardContent>
                {playerReports.length > 0 ? (
                  <div className="space-y-8">
                    {playerReports.map((report, index) => {
                      const gameForReport = games.find(g => report.Game && report.Game.includes(g.id));

                      return (
                        <div key={report.id || index} className="relative pl-12">
                          {index < playerReports.length - 1 && (
                            <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-bg-secondary"></div>
                          )}
                          <div className="absolute left-0 top-3 w-10 h-10 bg-bg-secondary rounded-full flex items-center justify-center border-4 border-slate-800">
                            {report.EventType === 'Game Report' ? <Award className="w-5 h-5 text-accent-primary" /> : <Eye className="w-5 h-5 text-accent-secondary" />}
                          </div>

                          <div className="bg-bg-primary/50 rounded-xl p-4 border border-border-custom hover:border-accent-primary/30 transition-colors duration-300">
                            <div className="flex items-center justify-between mb-3">
                                <Badge variant="outline" className={`${report.EventType === 'Game Report' ? 'text-accent-primary border-accent-primary/50 bg-cyan-900/30' : 'text-accent-secondary border-accent-secondary/50 bg-purple-900/30'}`}>
                                  {report.EventType}
                                </Badge>
                                <span className="text-sm text-text-secondary font-mono">
                                  {report.Date ? new Date(report.Date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'No date'}
                                </span>
                            </div>

                            {report.EventType === 'Game Report' && gameForReport && (
                              <h4 className="font-semibold text-text-primary mb-3 text-lg">
                                vs <span className="text-error">{gameForReport.Opponent || 'Unknown Opponent'}</span>
                              </h4>
                            )}

                             <div className="flex items-center gap-2 mb-4">
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < (report.GeneralRating || 0) ? 'text-warning fill-current' : 'text-slate-600'}`} />
                                  ))}
                                </div>
                                <span className="text-sm font-bold text-text-primary ml-1">
                                  {report.GeneralRating}/5 Rating
                                </span>
                              </div>

                            {report.EventType === 'Game Report' && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <StatBox value={report.MinutesPlayed || 0} label="Minutes" icon={Clock} color="text-success"/>
                                <StatBox value={report.Goals || 0} label="Goals" icon={Trophy} color="text-accent-primary"/>
                                <StatBox value={report.Assists || 0} label="Assists" icon={Users} color="text-accent-secondary"/>
                                <StatBox value={(report.Goals || 0) + (report.Assists || 0)} label="Goals Involved" icon={Target} color="text-error"/>
                              </div>
                            )}

                            {report.GeneralNotes && (
                              <div className="border-t border-border-custom pt-4">
                                <h4 className="font-semibold text-text-primary mb-2">Notes:</h4>
                                <p className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap">{report.GeneralNotes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-text-primary mb-2">No Reports Yet</h3>
                    <p className="text-text-secondary mb-6">
                      Start building this player's development timeline by adding their first report.
                    </p>
                    <Link to={createPageUrl(`AddReport?playerId=${player.PlayerRecordID}`)}>
                      <Button className="bg-accent-primary hover:bg-cyan-600 text-slate-900 font-bold">
                        <Plus className="w-5 h-5 mr-2" />
                        Add First Report
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
