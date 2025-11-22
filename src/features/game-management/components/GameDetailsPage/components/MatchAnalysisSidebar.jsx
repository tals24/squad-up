import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/primitives/card";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Trophy, Zap, Star, Shield, Target, FileText, Check, AlertCircle, Plus, Edit, Trash2, Clock, ArrowRightLeft, ArrowUp, ArrowDown, ShieldAlert } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/primitives/tooltip";

export default function MatchAnalysisSidebar({
  isScheduled,
  isPlayed,
  isDone,
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
  cards = [],
  onAddCard,
  onEditCard,
  onDeleteCard,
  matchDuration,
  setMatchDuration,
}) {
  return (
    <div 
      className="w-[336px] bg-slate-900/95 backdrop-blur-sm border-l border-slate-700/50 space-y-4 overflow-y-auto p-4"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(148, 163, 184, 0.2) transparent'
      }}
    >
      {/* AI Summary - For Scheduled (future: prepare to game data) and Done (match summary) */}
      {(isScheduled || isDone) && (
        <Card className="bg-slate-900/90 backdrop-blur-sm border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              {isScheduled ? 'AI Match Preview' : 'AI Match Summary'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isScheduled ? (
              <>
                <p className="text-sm text-slate-400">
                  The AI will provide preparation data and insights for the upcoming match.
                </p>
                <p className="text-xs text-slate-500 mt-2 italic">
                  (This component will be implemented in a future step, showing prepare to game data)
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-400">
                  The AI will analyze all player reports and team summaries to generate a concise, three-sentence summary of the match.
                </p>
                <p className="text-xs text-slate-500 mt-2 italic">
                  (This component will be implemented in a future step, integrating with an LLM)
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Extra Time Section - First component, one line */}
      {isPlayed && !isDone && matchDuration && setMatchDuration && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg">
          <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
          <span className="text-xs text-slate-400 shrink-0">Extra Time:</span>
          <Input
            type="number"
            min="0"
            max="15"
            placeholder="1st"
            title="First Half Extra Time"
            value={matchDuration.firstHalfExtraTime || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0;
              setMatchDuration({ 
                ...matchDuration, 
                firstHalfExtraTime: value 
              });
            }}
            disabled={isDone}
            className="w-12 h-7 text-center bg-slate-700 border-slate-600 text-white text-xs p-0"
          />
          <span className="text-xs text-slate-500">+</span>
          <Input
            type="number"
            min="0"
            max="15"
            placeholder="2nd"
            title="Second Half Extra Time"
            value={matchDuration.secondHalfExtraTime || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0;
              setMatchDuration({ 
                ...matchDuration, 
                secondHalfExtraTime: value 
              });
            }}
            disabled={isDone}
            className="w-12 h-7 text-center bg-slate-700 border-slate-600 text-white text-xs p-0"
          />
          <span className="text-xs text-slate-500">min</span>
        </div>
      )}

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
              <div className="space-y-1.5 max-h-[calc(5*3.5rem)] overflow-y-auto" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(148, 163, 184, 0.2) transparent'
              }}>
                <TooltipProvider>
                  {substitutions
                    .sort((a, b) => (a.minute || 0) - (b.minute || 0))
                    .map((sub) => {
                      const playerOutName = sub.playerOutId?.fullName || sub.playerOutId?.name || 'Unknown';
                      const playerOutKit = sub.playerOutId?.kitNumber || sub.playerOutId?.jerseyNumber || '?';
                      const playerInName = sub.playerInId?.fullName || sub.playerInId?.name || 'Unknown';
                      const playerInKit = sub.playerInId?.kitNumber || sub.playerInId?.jerseyNumber || '?';
                      
                      // Build tooltip content
                      const tooltipContent = (
                        <div className="space-y-1 text-xs">
                          <div className="font-semibold">{sub.minute}' minute</div>
                          <div className="text-slate-300">
                            <ArrowDown className="w-3 h-3 inline mr-1 text-red-400" />
                            Out: #{playerOutKit} {playerOutName}
                          </div>
                          <div className="text-slate-300">
                            <ArrowUp className="w-3 h-3 inline mr-1 text-green-400" />
                            In: #{playerInKit} {playerInName}
                          </div>
                          {sub.reason && (
                            <div className="text-slate-400">Reason: {sub.reason.replace('-', ' ')}</div>
                          )}
                          {sub.matchState && (
                            <div className="text-slate-400">Match State: {sub.matchState}</div>
                          )}
                          {sub.tacticalNote && sub.tacticalNote.trim() && (
                            <div className="text-slate-400 italic">"{sub.tacticalNote}"</div>
                          )}
                        </div>
                      );
                      
                      return (
                        <Tooltip key={sub._id}>
                          <TooltipTrigger asChild>
                            <div className="relative flex items-center gap-2 p-1.5 rounded-lg border border-slate-700 bg-slate-800/50 hover:border-orange-500/50 transition-all">
                              {/* Minute Circle */}
                              <div className="relative w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0 bg-orange-500">
                                {sub.minute || '?'}
                              </div>

                              {/* Substitution Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <ArrowDown className="w-3 h-3 text-red-400 shrink-0" />
                                  <span className="text-xs text-white font-medium truncate">
                                    #{playerOutKit} {playerOutName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <ArrowUp className="w-3 h-3 text-green-400 shrink-0" />
                                  <span className="text-xs text-white font-medium truncate">
                                    #{playerInKit} {playerInName}
                                  </span>
                                </div>
                                {sub.reason && (
                                  <div className="mt-0.5">
                                    <span className="text-xs text-slate-400 px-2 py-0.5 rounded-full bg-slate-700/50">
                                      {sub.reason.replace('-', ' ')}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              {!isDone && onEditSubstitution && onDeleteSubstitution && (
                                <div className="flex gap-0.5 shrink-0">
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
                No substitutions recorded yet
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cards Section - Only show for Played/Done */}
      {(isPlayed || isDone) && (
        <Card className="bg-slate-900/90 backdrop-blur-sm border-slate-700/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-yellow-400" />
                Cards ({cards.length})
              </CardTitle>
              {!isDone && onAddCard && (
                <Button
                  onClick={onAddCard}
                  size="sm"
                  className="h-7 px-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {cards.length > 0 ? (
              <div className="space-y-1.5 max-h-[calc(5*3.5rem)] overflow-y-auto" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(148, 163, 184, 0.2) transparent'
              }}>
                <TooltipProvider>
                  {cards
                    .sort((a, b) => (a.minute || 0) - (b.minute || 0))
                    .map((card) => {
                      const playerName = card.playerId?.fullName || card.playerId?.name || 'Unknown';
                      const playerKit = card.playerId?.kitNumber || card.playerId?.jerseyNumber || '?';
                      const cardTypeLabel = card.cardType === 'yellow' ? 'Yellow' : 
                                          card.cardType === 'red' ? 'Red' : 'Second Yellow';
                      const cardEmoji = card.cardType === 'yellow' ? '🟨' : 
                                       card.cardType === 'red' ? '🟥' : '🟨🟥';
                      const cardColor = card.cardType === 'yellow' ? 'bg-yellow-500' : 
                                       card.cardType === 'red' ? 'bg-red-500' : 'bg-orange-500';
                      
                      // Build tooltip content
                      const tooltipContent = (
                        <div className="space-y-1 text-xs">
                          <div className="font-semibold">{cardTypeLabel} Card</div>
                          <div className="text-slate-300">
                            Player: #{playerKit} {playerName}
                          </div>
                          <div className="text-slate-400">
                            Minute: {card.minute}'
                          </div>
                          {card.reason && (
                            <div className="text-slate-400">Reason: {card.reason}</div>
                          )}
                        </div>
                      );
                      
                      return (
                        <Tooltip key={card._id}>
                          <TooltipTrigger asChild>
                            <div className="relative flex items-center gap-2 p-1.5 rounded-lg border border-slate-700 bg-slate-800/50 hover:border-yellow-500/50 transition-all">
                              {/* Card Indicator Circle */}
                              <div className={`relative w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0 ${cardColor}`}>
                                {cardEmoji}
                              </div>

                              {/* Card Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-white font-medium truncate">
                                    #{playerKit} {playerName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-xs text-slate-400">
                                    {cardTypeLabel} • {card.minute}' minute
                                  </span>
                                </div>
                                {card.reason && (
                                  <div className="mt-0.5">
                                    <span className="text-xs text-slate-500 truncate block">
                                      {card.reason}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              {!isDone && onEditCard && onDeleteCard && (
                                <div className="flex gap-0.5 shrink-0">
                                  <Button
                                    onClick={() => onEditCard(card)}
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-cyan-400 hover:text-cyan-300"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    onClick={() => onDeleteCard(card._id)}
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
                No cards recorded yet
              </p>
            )}
          </CardContent>
        </Card>
      )}

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

