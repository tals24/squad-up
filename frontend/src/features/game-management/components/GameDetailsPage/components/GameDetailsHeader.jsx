import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Badge } from "@/shared/ui/primitives/badge";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Play,
  Ban,
  Save,
  Edit,
  AlertCircle,
  Clock,
  Target,
  Plus,
  Trophy,
  Zap,
  Star,
} from "lucide-react";

export default function GameDetailsHeader({
  gameCore,
  reports,
  teamSummary,
  derivedState,
  handlers,
  isSaving,
}) {
  // Destructure needed values
  const { 
    game, 
    finalScore, 
    setFinalScore, 
    matchDuration, 
    setMatchDuration, 
    isScheduled, 
    isPlayed, 
    isDone 
  } = gameCore;
  const { missingReportsCount, localPlayerReports: playerReports } = reports;
  const { teamSummary: teamSummaryData } = teamSummary;
  const { matchStats } = derivedState;
  const {
    handleGameWasPlayed,
    handlePostpone,
    handleSubmitFinalReport,
    handleEditReport,
  } = handlers;
  const navigate = useNavigate();

  // Format date
  const formattedDate = new Date(game.date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Handle back button navigation
  // Use window.location.href like reference code does in handlePostpone
  const handleBackClick = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    console.log('🔙 Back button clicked, navigating to GamesSchedule');
    window.location.href = "/GamesSchedule";
  };

  return (
    <div className="border-b border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800 shadow-xl backdrop-blur-sm">
      <div className="max-w-[1800px] mx-auto px-6 py-4">
        {/* Top Row: Title and Actions */}
        <div className="flex items-center justify-between gap-6">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackClick}
              className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {game.gameTitle || `${game.teamName} vs ${game.opponent}`}
              </h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  {formattedDate}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  {game.location}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-cyan-400" />
                  vs {game.opponent}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Match Stats - Only show for Played/Done */}
          {(isPlayed || isDone) && matchStats && (matchStats.scorers.length > 0 || matchStats.assists.length > 0 || matchStats.topRated) && (
            <div className="flex-1 flex items-center justify-center">
              <style>{`
                .match-stats-scrollable {
                  scrollbar-width: thin;
                  scrollbar-color: rgba(148, 163, 184, 0.3) transparent;
                }
                .match-stats-scrollable::-webkit-scrollbar {
                  width: 4px;
                }
                .match-stats-scrollable::-webkit-scrollbar-track {
                  background: transparent;
                }
                .match-stats-scrollable::-webkit-scrollbar-thumb {
                  background-color: rgba(148, 163, 184, 0.3);
                  border-radius: 2px;
                }
              `}</style>
              <div className="flex gap-6 px-4 py-1.5 bg-slate-800/30 border border-slate-700/50 rounded-lg max-h-20">
                {/* Scorers */}
                {matchStats.scorers.length > 0 && (
                  <div className="flex flex-col min-w-0">
                    <div className="text-xs font-semibold text-cyan-400 mb-1 flex items-center gap-1 whitespace-nowrap">
                      <Trophy className="w-3 h-3" />
                      Scorers
                    </div>
                    <div className="text-xs text-white overflow-y-auto match-stats-scrollable max-h-12">
                      {matchStats.scorers.map((scorer, i) => (
                        <div key={i} className="whitespace-nowrap">
                          {scorer.name} ({scorer.count})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Assists */}
                {matchStats.assists.length > 0 && (
                  <div className="flex flex-col min-w-0">
                    <div className="text-xs font-semibold text-cyan-400 mb-1 flex items-center gap-1 whitespace-nowrap">
                      <Zap className="w-3 h-3" />
                      Assists
                    </div>
                    <div className="text-xs text-white overflow-y-auto match-stats-scrollable max-h-12">
                      {matchStats.assists.map((assist, i) => (
                        <div key={i} className="whitespace-nowrap">
                          {assist.name} ({assist.count})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* MVP */}
                {matchStats.topRated && (
                  <div className="flex flex-col min-w-0">
                    <div className="text-xs font-semibold text-cyan-400 mb-1 flex items-center gap-1 whitespace-nowrap">
                      <Star className="w-3 h-3" />
                      MVP
                    </div>
                    <div className="text-xs text-white whitespace-nowrap">
                      {matchStats.topRated}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Right: Status + Score + Actions */}
          <div className="flex items-center gap-4">
            {/* Status Badge */}
            <Badge
              variant="outline"
              className={`
                ${game.status === "Scheduled" ? "border-blue-500 text-blue-400" : ""}
                ${game.status === "Played" ? "border-yellow-500 text-yellow-400 animate-pulse" : ""}
                ${game.status === "Done" ? "border-green-500 text-green-400" : ""}
                ${game.status === "Postponed" ? "border-gray-500 text-gray-400" : ""}
              `}
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${
                game.status === "Scheduled" ? "bg-blue-500" : ""
              }${game.status === "Played" ? "bg-yellow-500 animate-pulse" : ""}${
                game.status === "Done" ? "bg-green-500" : ""
              }${game.status === "Postponed" ? "bg-gray-500" : ""}`} />
              {game.status}
            </Badge>

            {/* Final Score (Read-only) */}
            {isDone && (
              <div className="text-center bg-gradient-to-r from-cyan-500/10 to-blue-500/10 px-6 py-2 rounded-lg border border-cyan-500/30">
                <div className="text-3xl font-bold text-white">
                  {finalScore.ourScore} - {finalScore.opponentScore}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {game.teamName} vs {game.opponent}
                </div>
              </div>
            )}

            {/* Score Input (Read-only - calculated from goals) */}
            {isPlayed && !isDone && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Score:</span>
                <div className="w-16 text-center bg-slate-800 border border-slate-700 text-white px-2 py-1 rounded">
                  {finalScore.ourScore}
                </div>
                <span className="text-slate-400">-</span>
                <div className="w-16 text-center bg-slate-800 border border-slate-700 text-white px-2 py-1 rounded">
                  {finalScore.opponentScore}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {isScheduled && (
              <>
                <Button
                  onClick={handleGameWasPlayed}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/30"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Game Was Played
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePostpone}
                  className="border-orange-500 text-orange-400 hover:bg-orange-500/10"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Postpone
                </Button>
              </>
            )}

            {isPlayed && !isDone && (
              <Button
                onClick={handleSubmitFinalReport}
                disabled={isSaving || missingReportsCount > 0 || !finalScore.ourScore === null || !teamSummary.defenseSummary}
                className={`
                  ${missingReportsCount > 0 || !finalScore.ourScore === null || !teamSummary.defenseSummary
                    ? "bg-slate-700 text-slate-400"
                    : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/30"
                  }
                `}
              >
                {missingReportsCount > 0 ? (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {missingReportsCount} Reports Missing
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Submit Final Report
                  </>
                )}
              </Button>
            )}

            {isDone && (
              <Button
                variant="outline"
                onClick={handleEditReport}
                className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Report
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

