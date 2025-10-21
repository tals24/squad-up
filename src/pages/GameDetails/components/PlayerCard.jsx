import React from "react";
import { Button } from "@/shared/ui/primitives/button";
import { Badge } from "@/shared/ui/primitives/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/primitives/popover";
import { Ban, Check, AlertCircle, MoreVertical } from "lucide-react";

export default function PlayerCard({ 
  player, 
  status, 
  hasReport, 
  needsReport, 
  onOpenPerformance, 
  onStatusChange, 
  onDragStart, 
  onDragEnd, 
  isScheduled, 
  isPlayed, 
  isReadOnly 
}) {
  const isDraggable = isScheduled && status !== "Unavailable" && !isReadOnly;
  const showStatusMenu = isScheduled && !isReadOnly;

  // Get radial gradient style based on player position
  const getPositionGradientStyle = () => {
    const position = player.position;
    if (position === "Goalkeeper") return { background: "radial-gradient(circle, #8B5CF6 0%, #5B21B6 100%)" };
    if (position === "Defender") return { background: "radial-gradient(circle, #3B82F6 0%, #1E40AF 100%)" };
    if (position === "Midfielder") return { background: "radial-gradient(circle, #22C55E 0%, #15803D 100%)" };
    if (position === "Forward") return { background: "radial-gradient(circle, #EF4444 0%, #991B1B 100%)" };
    return { background: "linear-gradient(135deg, #475569 0%, #334155 100%)" }; // Default
  };

  // Get position badge color
  const getPositionBadgeColor = () => {
    const position = player.position;
    if (position === "Goalkeeper") return "bg-purple-600/20 text-purple-400 border-purple-600/30";
    if (position === "Defender") return "bg-blue-600/20 text-blue-400 border-blue-600/30";
    if (position === "Midfielder") return "bg-emerald-600/20 text-emerald-400 border-emerald-600/30";
    if (position === "Forward") return "bg-red-600/20 text-red-400 border-red-600/30";
    return "bg-slate-600/20 text-slate-400 border-slate-600/30"; // Default
  };

  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`
        relative flex items-center gap-2 p-1.5 rounded-lg border transition-all
        ${isDraggable ? "cursor-grab active:cursor-grabbing" : ""}
        ${status === "Unavailable" ? "opacity-60" : "opacity-100"}
        border-transparent hover:border-cyan-500/50
      `}
    >
      {/* Kit Number Circle */}
      <button
        onClick={(e) => {
          if (isPlayed && !isReadOnly) {
            e.stopPropagation();
            onOpenPerformance();
          }
        }}
        disabled={!(isPlayed && !isReadOnly)}
        style={{
          ...getPositionGradientStyle(),
          boxShadow: "0 0 6px rgba(0,0,0,0.3)",
        }}
        className={`
          relative w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0
          ${isPlayed && !isReadOnly ? "hover:scale-110 cursor-pointer" : ""}
        `}
      >
        {player.kitNumber || "?"}
        
        {/* Report Status Badge */}
        {isPlayed && hasReport && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
        {isPlayed && needsReport && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
            <AlertCircle className="w-3 h-3 text-white" />
          </div>
        )}
      </button>

      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white text-xs truncate">{player.fullName}</div>
        <Badge variant="secondary" className={`text-[10px] mt-0.5 border ${getPositionBadgeColor()}`}>
          {player.position}
        </Badge>
      </div>

      {/* Status Menu (3 dots) */}
      {showStatusMenu && onStatusChange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 hover:bg-slate-700 w-6 h-6"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-3 h-3 text-slate-400" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 bg-slate-800 border-slate-700">
            <div className="space-y-1">
              {status !== "Bench" && (
                <button
                  onClick={() => onStatusChange("Bench")}
                  className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 rounded flex items-center gap-2"
                >
                  Add to Bench
                </button>
              )}
              {status === "Bench" && (
                <button
                  onClick={() => onStatusChange("Not in Squad")}
                  className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 rounded flex items-center gap-2"
                >
                  Remove from Bench
                </button>
              )}
              {status !== "Unavailable" && (
                <button
                  onClick={() => onStatusChange("Unavailable")}
                  className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 rounded flex items-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  Mark Unavailable
                </button>
              )}
              {status === "Unavailable" && (
                <button
                  onClick={() => onStatusChange("Not in Squad")}
                  className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 rounded flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Mark as Available
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

