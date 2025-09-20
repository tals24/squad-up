import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Trophy, Zap, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useData } from "../components/DataContext";
import { 
  PlayerProfileCard, 
  PerformanceStatsCard, 
  DevelopmentTimeline 
} from "../components/player";

export default function Player() {
  const [searchParams] = useSearchParams();
  const playerId = searchParams.get('id');
  

  const { players, reports: allReports, teams, games, isLoading: isDataLoading } = useData();

  const [player, setPlayer] = useState(null);
  const [playerReports, setPlayerReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isDataLoading && playerId) {
      const foundPlayer = players.find(p => p._id === playerId);
      if (foundPlayer) {
        setPlayer(foundPlayer);
        const reportsForPlayer = allReports
          .filter(report => report.player && report.player._id === foundPlayer._id)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPlayerReports(reportsForPlayer);
      }
      setIsLoading(false);
    }
  }, [playerId, players, allReports, teams, games, isDataLoading]);

  // Memoize expensive calculations to prevent unnecessary re-renders
  const stats = useMemo(() => {
    if (playerReports.length === 0) return { averageRating: 0, totalGoals: 0, totalAssists: 0, totalMinutes: 0 };

    const ratedReports = playerReports.filter(r => r.rating);
    const totalRating = ratedReports.reduce((sum, report) => sum + (report.rating || 0), 0);
    const totalGoals = playerReports.reduce((sum, report) => sum + (report.goals || 0), 0);
    const totalAssists = playerReports.reduce((sum, report) => sum + (report.assists || 0), 0);
    const totalMinutes = playerReports.reduce((sum, report) => sum + (report.minutesPlayed || 0), 0);

    return {
      averageRating: ratedReports.length > 0 ? (totalRating / ratedReports.length).toFixed(1) : 0,
      totalGoals,
      totalAssists,
      totalMinutes
    };
  }, [playerReports]);

  if (isLoading || isDataLoading) {
    return (
      <div className="p-6 md:p-8 bg-slate-900 min-h-screen">
        <div className="max-w-7xl mx-auto animate-pulse space-y-8">
          <div className="h-10 bg-slate-800 rounded-lg w-1/3"></div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
              <div className="h-64 bg-slate-800 rounded-2xl"></div>
              <div className="h-80 bg-slate-800 rounded-2xl"></div>
            </div>
            <div className="lg:col-span-2 h-[50rem] bg-slate-800 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="p-6 md:p-8 bg-slate-900 min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <Trophy className="w-16 h-16 text-red-400/50 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Player Not Found</h1>
          <p className="text-slate-400 mb-6">The player you're looking for doesn't exist or there was an error loading the data.</p>
          <Link to={createPageUrl("Players")}>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Players
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-slate-900 min-h-screen text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Players")}>
              <Button variant="outline" size="icon" className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:border-cyan-500 hover:text-cyan-400 transition-all duration-300 backdrop-blur-sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-100">
                {player.fullName}
              </h1>
              <p className="text-lg text-cyan-400 font-mono">{player.position}</p>
            </div>
          </div>
          
          {/* Add Report Button */}
          <Link to={`${createPageUrl("AddReport")}?playerId=${playerId}&from=Player`}>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold transition-all duration-300">
              <Plus className="w-4 h-4 mr-2" />
              Add Scout Report
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <PlayerProfileCard player={player} />

            <PerformanceStatsCard 
              stats={stats}
              reportCount={playerReports.length}
            />
          </div>

          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-2xl border-slate-700 bg-slate-800/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-100 flex items-center gap-3">
                  <Zap className="w-6 h-6 text-yellow-400" />
                  AI Player Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-400 text-sm space-y-2">
                <p>
                  The AI will analyze all scouting and game reports to generate a concise summary of the player's strengths, weaknesses, and potential development areas.
                </p>
                <p className="text-xs text-slate-500 italic">
                  (This component will be implemented in a future step, integrating with an LLM.)
                </p>
              </CardContent>
            </Card>

            <DevelopmentTimeline 
              playerReports={playerReports}
              games={games}
              playerId={playerId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}