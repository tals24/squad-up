import React, { useMemo } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { 
  getMinutesSummary, 
  getMinutesProgressColor,
  formatMinutes 
} from '../../../utils/minutesValidation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/primitives/tooltip';

export default function MinutesProgressIndicator({ playerReports, game, matchDuration, className = '' }) {
  const summary = useMemo(() => {
    // 🔍 DEBUG: Log props received
    console.log('🔍 [MinutesProgressIndicator] Props received:', {
      hasPlayerReports: !!playerReports,
      playerReportsCount: playerReports ? Object.keys(playerReports).length : 0,
      hasGame: !!game,
      gameStatus: game?.status,
      matchDurationProp: matchDuration,
      gameMatchDuration: game?.matchDuration,
      matchDurationType: typeof matchDuration,
      matchDurationKeys: matchDuration ? Object.keys(matchDuration) : null
    });
    
    // Always prioritize matchDuration prop (from state) over game.matchDuration
    // This ensures we use the latest state value even after refresh
    const effectiveMatchDuration = matchDuration || game?.matchDuration || {
      regularTime: 90,
      firstHalfExtraTime: 0,
      secondHalfExtraTime: 0
    };
    
    // 🔍 DEBUG: Log effective matchDuration used
    console.log('🔍 [MinutesProgressIndicator] Effective matchDuration:', effectiveMatchDuration);
    const totalDuration = effectiveMatchDuration.regularTime + effectiveMatchDuration.firstHalfExtraTime + effectiveMatchDuration.secondHalfExtraTime;
    console.log('🔍 [MinutesProgressIndicator] Total match duration:', totalDuration);
    console.log('🔍 [MinutesProgressIndicator] Expected minimum required (11 * total):', 11 * totalDuration);
    
    const gameWithMatchDuration = {
      ...game,
      matchDuration: effectiveMatchDuration
    };
    
    const summary = getMinutesSummary(playerReports, gameWithMatchDuration);
    
    // 🔍 DEBUG: Log summary results
    console.log('🔍 [MinutesProgressIndicator] Summary:', {
      totalRecorded: summary.totalRecorded,
      minimumRequired: summary.minimumRequired,
      maximumAllowed: summary.maximumAllowed,
      matchDuration: summary.matchDuration,
      percentage: summary.percentage
    });
    
    return summary;
  }, [playerReports, game, matchDuration]);

  const getIcon = () => {
    if (summary.isOverMaximum) {
      return <AlertCircle className="w-4 h-4 animate-pulse text-red-400" />;
    }
    if (summary.percentage >= 100 && !summary.isOverMaximum) {
      return <CheckCircle className="w-4 h-4" />;
    }
    if (summary.percentage >= 80) {
      return <AlertCircle className="w-4 h-4 animate-pulse" />;
    }
    return <AlertCircle className="w-4 h-4 animate-pulse" />;
  };

  const getStatusMessage = () => {
    if (summary.isOverMaximum) {
      return `${summary.excess} min over maximum`;
    }
    if (summary.deficit > 0) {
      return `Missing ${summary.deficit} min`;
    }
    if (summary.excess > summary.minimumRequired * 0.2) {
      return `${summary.excess} min over`;
    }
    return 'Complete';
  };

  const getProgressBarColor = () => {
    if (summary.isOverMaximum) return 'bg-red-500';
    if (summary.percentage >= 100) return 'bg-green-500';
    if (summary.percentage >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Determine progress color based on over-maximum status
  const progressColor = summary.isOverMaximum 
    ? 'text-red-400' 
    : getMinutesProgressColor(summary.percentage);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-3 ${className}`}>
            {/* Minutes Display */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium">Minutes:</span>
              <span className={`text-sm font-bold ${progressColor}`}>
                {summary.totalRecorded}/{summary.minimumRequired}
              </span>
              <span className={`text-xs font-semibold ${progressColor}`}>
                ({summary.percentage}%)
              </span>
              <span className={progressColor}>
                {getIcon()}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="hidden sm:flex w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${getProgressBarColor()}`}
                style={{ width: `${Math.min(summary.percentage, 100)}%` }}
              />
            </div>
            
            {/* Status Message */}
            <span className={`hidden md:inline text-xs font-medium ${progressColor}`}>
              {getStatusMessage()}
            </span>
          </div>
        </TooltipTrigger>
        
        <TooltipContent 
          side="bottom" 
          className="bg-slate-800 border-slate-700 text-white p-4 max-w-xs"
        >
          <div className="space-y-2">
            <h4 className="font-semibold text-sm border-b border-slate-600 pb-2">
              Minutes Summary
            </h4>
            
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Match Duration:</span>
                <span className="font-medium">{formatMinutes(summary.matchDuration)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-400">Required (11 × Match Duration):</span>
                <span className="font-medium">{formatMinutes(summary.minimumRequired)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-400">Maximum Allowed:</span>
                <span className="font-medium">{formatMinutes(summary.maximumAllowed)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-400">Total Recorded:</span>
                <span className={`font-medium ${progressColor}`}>
                  {formatMinutes(summary.totalRecorded)}
                </span>
              </div>
              
              {summary.isOverMaximum && (
                <div className="flex justify-between pt-1 border-t border-red-700">
                  <span className="text-red-400 font-bold">⚠️ Over Maximum:</span>
                  <span className="font-bold text-red-400">
                    +{formatMinutes(summary.excess)}
                  </span>
                </div>
              )}
              
              {summary.deficit > 0 && (
                <div className="flex justify-between pt-1 border-t border-slate-700">
                  <span className="text-red-400">Missing:</span>
                  <span className="font-bold text-red-400">
                    {formatMinutes(summary.deficit)}
                  </span>
                </div>
              )}
              
              {summary.excess > 0 && summary.isExcessive && !summary.isOverMaximum && (
                <div className="flex justify-between pt-1 border-t border-slate-700">
                  <span className="text-blue-400">Excess:</span>
                  <span className="font-medium text-blue-400">
                    {formatMinutes(summary.excess)}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between pt-1 border-t border-slate-700">
                <span className="text-slate-400">Players with Minutes:</span>
                <span className="font-medium">{summary.playersWithMinutes}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-400">Players Reported:</span>
                <span className="font-medium">{summary.playersReported}</span>
              </div>
            </div>
            
            {/* Status */}
            <div className={`pt-2 border-t border-slate-700 text-center font-semibold ${progressColor}`}>
              {summary.isOverMaximum 
                ? '❌ Over Maximum - Cannot Submit' 
                : summary.isValid 
                  ? '✅ Complete' 
                  : '⚠️ Incomplete'}
            </div>
            
            {/* Warning when over maximum */}
            {summary.isOverMaximum && (
              <div className="pt-2 border-t border-red-700 text-xs text-red-300 bg-red-900/20 p-2 rounded">
                <p className="font-medium mb-1">⚠️ Warning:</p>
                <p className="text-[11px] text-red-400">
                  Total minutes ({summary.totalRecorded}) exceed the maximum allowed ({summary.maximumAllowed}). 
                  This is physically impossible - please check your player reports. The submit button will be disabled until this is fixed.
                </p>
              </div>
            )}
            
            {/* Suggestions */}
            {summary.deficit > 0 && !summary.isOverMaximum && (
              <div className="pt-2 border-t border-slate-700 text-xs text-slate-300">
                <p className="font-medium mb-1">💡 Suggestions:</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                  {summary.playersWithMinutes > 0 && (
                    <li className="text-[11px]">
                      Add ~{Math.ceil(summary.deficit / summary.playersWithMinutes)} min to each player
                    </li>
                  )}
                  {Math.ceil(summary.deficit / 30) <= 3 && (
                    <li className="text-[11px]">
                      Add {Math.ceil(summary.deficit / 30)} substitute(s) (~30 min each)
                    </li>
                  )}
                  {summary.playersWithMinutes < 11 && (
                    <li className="text-[11px]">
                      Check for missing player reports
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

