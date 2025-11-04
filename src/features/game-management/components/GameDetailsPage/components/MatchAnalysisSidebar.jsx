import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/primitives/card";
import { Button } from "@/shared/ui/primitives/button";
import { Trophy, Zap, Star, Shield, Target, FileText, Check, AlertCircle, Plus, Edit, Trash2, Clock, ArrowRightLeft, ArrowUp, ArrowDown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/primitives/tooltip";

export default function MatchAnalysisSidebar({
  isPlayed,
  isDone,
  matchStats,
  teamSummary,
  setTeamSummary,
  onTeamSummaryClick,
  goals = [],
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  substitutions = [],
  onAddSubstitution,
  onEditSubstitution,
  onDeleteSubstitution,
}) {
  return (
    <div 
      className="w-[336px] bg-slate-900/95 backdrop-blur-sm border-l border-slate-700/50 space-y-4 overflow-y-auto p-4"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(148, 163, 184, 0.2) transparent'
      }}
    >
      {/* Goals Section - Only show for Played/Done */}
      {(isPlayed || isDone) && (
        <Card className="bg-slate-900/90 backdrop-blur-sm border-slate-700/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                Goals ({goals.length})
              </CardTitle>
              {!isDone && onAddGoal && (
                <Button
                  onClick={onAddGoal}
                  size="sm"
                  className="h-7 px-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {goals.length > 0 ? (
              <div className="space-y-1.5 max-h-[calc(5*3.5rem)] overflow-y-auto" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(148, 163, 184, 0.2) transparent'
              }}>
                <TooltipProvider>
                  {goals
                    .sort((a, b) => (a.minute || 0) - (b.minute || 0))
                    .map((goal) => {
                      const isOpponentGoal = goal.goalCategory === 'OpponentGoal' || goal.isOpponentGoal;
                      const scorerName = goal.scorerId?.fullName || goal.scorerId?.name || (goal.goalType === 'own-goal' ? 'Own Goal' : 'Unknown');
                      const assisterName = goal.assistedById?.fullName || goal.assistedById?.name;
                      
                      // Build tooltip content
                      const tooltipContent = (
                        <div className="space-y-1 text-xs">
                          <div className="font-semibold">{isOpponentGoal ? 'Opponent Goal' : scorerName}</div>
                          {!isOpponentGoal && assisterName && (
                            <div className="text-slate-300">Assist: {assisterName}</div>
                          )}
                          <div className="text-slate-400">
                            {goal.goalType?.replace('-', ' ')} • {goal.minute}' minute
                          </div>
                          {goal.goalInvolvement && goal.goalInvolvement.length > 0 && (
                            <div className="text-slate-400">
                              +{goal.goalInvolvement.length} contributor{goal.goalInvolvement.length > 1 ? 's' : ''}
                            </div>
                          )}
                          {goal.matchState && (
                            <div className="text-slate-400">Match State: {goal.matchState}</div>
                          )}
                        </div>
                      );
                      
                      return (
                        <Tooltip key={goal._id}>
                          <TooltipTrigger asChild>
                            <div
                              className={`relative flex items-center gap-2 p-1.5 rounded-lg border transition-all hover:border-cyan-500/50 ${
                                isOpponentGoal
                                  ? 'bg-red-500/10 border-red-500/30'
                                  : 'bg-slate-800/50 border-slate-700'
                              }`}
                            >
                              {/* Goal Indicator Circle */}
                              <div className={`
                                relative w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0
                                ${isOpponentGoal ? 'bg-red-500' : 'bg-green-500'}
                              `}>
                                {goal.goalNumber || goal.minute || '?'}
                              </div>

                              {/* Goal Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-white font-medium truncate">
                                    {isOpponentGoal ? 'Opponent Goal' : scorerName}
                                  </span>
                                  {!isOpponentGoal && assisterName && (
                                    <Zap className="w-3 h-3 text-blue-400 shrink-0" />
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {goal.goalType && (
                                    <span className="text-xs text-slate-400 px-2 py-0.5 rounded-full bg-slate-700/50">
                                      {goal.goalType.replace('-', ' ')}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons */}
                              {!isDone && onEditGoal && onDeleteGoal && (
                                <div className="flex gap-0.5 shrink-0">
                                  <Button
                                    onClick={() => onEditGoal(goal)}
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-cyan-400 hover:text-cyan-300"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    onClick={() => onDeleteGoal(goal._id)}
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-white max-w-xs">
                            {tooltipContent}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                </TooltipProvider>
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                No goals recorded yet
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Substitutions Section - Only show for Played/Done */}
      {(isPlayed || isDone) && (
        <Card className="bg-slate-900/90 backdrop-blur-sm border-slate-700/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-orange-400" />
                Substitutions ({substitutions.length})
              </CardTitle>
              {!isDone && onAddSubstitution && (
                <Button
                  onClick={onAddSubstitution}
                  size="sm"
                  className="h-7 px-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {substitutions.length > 0 ? (
              <div className="space-y-2">
                {substitutions
                  .sort((a, b) => a.minute - b.minute)
                  .map((sub) => (
                    <div
                      key={sub._id}
                      className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-orange-500/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-400">{sub.minute}'</span>
                        </div>
                        {!isDone && onEditSubstitution && onDeleteSubstitution && (
                          <div className="flex gap-1">
                            <Button
                              onClick={() => onEditSubstitution(sub)}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-cyan-400 hover:text-cyan-300"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={() => onDeleteSubstitution(sub._id)}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        {/* Player Out */}
                        <div className="flex items-center gap-1">
                          <ArrowDown className="w-3 h-3 text-red-400" />
                          <span className="text-sm text-white">
                            #{sub.playerOutId?.jerseyNumber || '?'} {sub.playerOutId?.name || 'Unknown'}
                          </span>
                        </div>
                        
                        {/* Player In */}
                        <div className="flex items-center gap-1">
                          <ArrowUp className="w-3 h-3 text-green-400" />
                          <span className="text-sm text-white">
                            #{sub.playerInId?.jerseyNumber || '?'} {sub.playerInId?.name || 'Unknown'}
                          </span>
                        </div>
                        
                        {/* Reason & Match State */}
                        <div className="flex items-center gap-2 ml-4 mt-1">
                          {sub.reason && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                              {sub.reason.replace('-', ' ')}
                            </span>
                          )}
                          {sub.matchState && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                              {sub.matchState}
                            </span>
                          )}
                        </div>
                        
                        {/* Tactical Note */}
                        {sub.tacticalNote && sub.tacticalNote.trim() && (
                          <div className="text-xs text-slate-400 ml-4 mt-1 italic">
                            "{sub.tacticalNote}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                No substitutions recorded yet
              </p>
            )}
          </CardContent>
        </Card>
      )}

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

