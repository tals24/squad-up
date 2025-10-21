import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

export default function GameDetailsHeader({
  game,
  finalScore,
  setFinalScore,
  missingReportsCount,
  teamSummary,
  isSaving,
  isScheduled,
  isPlayed,
  isDone,
  handleGameWasPlayed,
  handlePostpone,
  handleSubmitFinalReport,
  handleEditReport,
}) {
  const navigate = useNavigate();

  // Format date
  const formattedDate = new Date(game.date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="border-b border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800 shadow-xl backdrop-blur-sm">
      <div className="max-w-[1800px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/GamesSchedule")}
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

            {/* Score Input (Editable - Played only) */}
            {isPlayed && !isDone && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Score:</span>
                <Input
                  type="number"
                  min="0"
                  max="99"
                  value={finalScore.ourScore}
                  onChange={(e) => setFinalScore((prev) => ({ ...prev, ourScore: parseInt(e.target.value) || 0 }))}
                  className="w-16 text-center bg-slate-800 border-slate-700 text-white"
                />
                <span className="text-slate-400">-</span>
                <Input
                  type="number"
                  min="0"
                  max="99"
                  value={finalScore.opponentScore}
                  onChange={(e) => setFinalScore((prev) => ({ ...prev, opponentScore: parseInt(e.target.value) || 0 }))}
                  className="w-16 text-center bg-slate-800 border-slate-700 text-white"
                />
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

