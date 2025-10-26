import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/primitives/card";
import { Button } from "@/shared/ui/primitives/button";
import { Trophy, Zap, Star, Shield, Target, FileText, Check, AlertCircle } from "lucide-react";

export default function MatchAnalysisSidebar({
  isPlayed,
  isDone,
  matchStats,
  teamSummary,
  setTeamSummary,
  onTeamSummaryClick,
}) {
  return (
    <div 
      className="w-[280px] bg-slate-900/95 backdrop-blur-sm border-l border-slate-700/50 space-y-4 overflow-y-auto p-4"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(148, 163, 184, 0.2) transparent'
      }}
    >
      {/* Match Stats - Only show for Played/Done */}
      {(isPlayed || isDone) && (
        <Card className="bg-slate-900/90 backdrop-blur-sm border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Match Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Scorers
              </h4>
              {matchStats.scorers.length > 0 ? (
                <div className="text-sm text-white">
                  {matchStats.scorers.map((scorer, i) => (
                    <div key={i}>{scorer.name} ({scorer.count})</div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500">None</div>
              )}
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Assists
              </h4>
              {matchStats.assists.length > 0 ? (
                <div className="text-sm text-white">
                  {matchStats.assists.map((assist, i) => (
                    <div key={i}>{assist.name} ({assist.count})</div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500">None</div>
              )}
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Star className="w-3 h-3" /> Top Rated (MVP)
              </h4>
              <div className="text-sm text-white">
                {matchStats.topRated || "None"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Summary */}
      <Card className="bg-slate-900/90 backdrop-blur-sm border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            AI Match Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">
            The AI will analyze all player reports and team summaries to generate a concise, three-sentence summary of the match.
          </p>
          <p className="text-xs text-slate-500 mt-2 italic">
            (This component will be implemented in a future step, integrating with an LLM)
          </p>
        </CardContent>
      </Card>

      {/* Team Summaries - Only for Played/Done */}
      {(isPlayed || isDone) && (
        <Card className="bg-slate-900/90 backdrop-blur-sm border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-white">Team Summaries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Defense Button */}
            <Button
              onClick={() => onTeamSummaryClick("defense")}
              disabled={isDone}
              className="w-full justify-start gap-3 h-12 bg-slate-800 hover:bg-slate-700 border-slate-600 text-white"
            >
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="flex-1 text-left">Defense</span>
              {teamSummary.defenseSummary && teamSummary.defenseSummary.trim() ? (
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              ) : (
                <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
                  <AlertCircle className="w-3 h-3 text-white" />
                </div>
              )}
            </Button>

            {/* Midfield Button */}
            <Button
              onClick={() => onTeamSummaryClick("midfield")}
              disabled={isDone}
              className="w-full justify-start gap-3 h-12 bg-slate-800 hover:bg-slate-700 border-slate-600 text-white"
            >
              <Zap className="w-4 h-4 text-green-400" />
              <span className="flex-1 text-left">Midfield</span>
              {teamSummary.midfieldSummary && teamSummary.midfieldSummary.trim() ? (
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              ) : (
                <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
                  <AlertCircle className="w-3 h-3 text-white" />
                </div>
              )}
            </Button>

            {/* Attack Button */}
            <Button
              onClick={() => onTeamSummaryClick("attack")}
              disabled={isDone}
              className="w-full justify-start gap-3 h-12 bg-slate-800 hover:bg-slate-700 border-slate-600 text-white"
            >
              <Target className="w-4 h-4 text-red-400" />
              <span className="flex-1 text-left">Attack</span>
              {teamSummary.attackSummary && teamSummary.attackSummary.trim() ? (
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              ) : (
                <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
                  <AlertCircle className="w-3 h-3 text-white" />
                </div>
              )}
            </Button>

            {/* General Button */}
            <Button
              onClick={() => onTeamSummaryClick("general")}
              disabled={isDone}
              className="w-full justify-start gap-3 h-12 bg-slate-800 hover:bg-slate-700 border-slate-600 text-white"
            >
              <FileText className="w-4 h-4 text-purple-400" />
              <span className="flex-1 text-left">General</span>
              {teamSummary.generalSummary && teamSummary.generalSummary.trim() ? (
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              ) : (
                <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
                  <AlertCircle className="w-3 h-3 text-white" />
                </div>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

