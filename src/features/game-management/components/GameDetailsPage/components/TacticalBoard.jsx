import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/primitives/select";
import { Check, AlertCircle } from "lucide-react";

export default function TacticalBoard({ 
  formations, 
  formationType, 
  positions, 
  formation, 
  onFormationChange, 
  onPositionDrop, 
  onRemovePlayer,
  onPlayerClick,
  onPositionClick,
  isDragging, 
  isScheduled, 
  isPlayed,
  isReadOnly,
  hasReport,
  needsReport
}) {
  console.log('🏟️ TacticalBoard render:', {
    formationType,
    positionsCount: Object.keys(positions).length,
    positionIds: Object.keys(positions),
    formationCount: Object.keys(formation).length,
    assignedPlayers: Object.entries(formation).filter(([_, p]) => p !== null).map(([posId, p]) => ({ posId, player: p?.fullName }))
  });

  // Get radial gradient style based on position type
  const getPositionGradientStyle = (positionType) => {
    if (positionType === "Goalkeeper") return { background: "radial-gradient(circle, #8B5CF6 0%, #5B21B6 100%)" };
    if (positionType === "Defender") return { background: "radial-gradient(circle, #3B82F6 0%, #1E40AF 100%)" };
    if (positionType === "Midfielder") return { background: "radial-gradient(circle, #22C55E 0%, #15803D 100%)" };
    if (positionType === "Forward") return { background: "radial-gradient(circle, #EF4444 0%, #991B1B 100%)" };
    return { background: "linear-gradient(135deg, #475569 0%, #334155 100%)" }; // Default
  };

  return (
    <div className="flex flex-col h-full">
      {/* Content Area - Full Height */}
      <div className="flex-1 relative">
        {/* Formation Selector - Floating on Pitch */}
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-700/50">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-semibold">FORMATION</span>
              <Select value={formationType} onValueChange={onFormationChange} disabled={!isScheduled || isReadOnly}>
                <SelectTrigger className="w-24 bg-slate-700 border-slate-600 text-white text-sm h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {Object.keys(formations).map((formationKey) => (
                    <SelectItem key={formationKey} value={formationKey} className="text-white">
                      {formationKey}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Football Pitch */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-700 via-green-600 to-green-800">
          {/* Grid Pattern */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          {/* Field Markings */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            {/* Center circle */}
            <circle cx="50" cy="50" r="12" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3" />
            <circle cx="50" cy="50" r="0.5" fill="rgba(255,255,255,0.8)" />
            
            {/* Halfway line - extends fully across the pitch */}
            <line x1="-37" y1="50" x2="137" y2="50" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3" />
            
            {/* Top penalty box */}
            <rect x="25" y="0" width="50" height="18" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3" />
            
            {/* Top goal area */}
            <rect x="37" y="0" width="26" height="8" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3" />
            
            {/* Bottom penalty box */}
            <rect x="25" y="82" width="50" height="18" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3" />
            
            {/* Bottom goal area */}
            <rect x="37" y="92" width="26" height="8" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3" />
          </svg>

          {/* Position Slots */}
          {Object.entries(positions).map(([posId, posData]) => {
            const player = formation[posId];
            const isOccupied = player !== null && player !== undefined;

            // Debug render
            if (isOccupied) {
              console.log(`🎨 Rendering position ${posId} (${posData.label}) at (${posData.x}%, ${posData.y}%) with player:`, player?.fullName);
            }

            return (
              <div
                key={posId}
                data-position-id={posId}
                data-position-label={posData.label}
                className={`
                  absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1
                  ${isDragging && !isOccupied ? "scale-110 animate-pulse" : ""}
                  ${!isOccupied && isScheduled && !isReadOnly ? "cursor-pointer hover:scale-110" : ""}
                `}
                style={{
                  left: `${posData.x}%`,
                  top: `${posData.y}%`,
                }}
                onClick={(e) => {
                  if (!isOccupied && isScheduled && !isReadOnly) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🎯 Empty position clicked:', { posId, posData });
                    onPositionClick?.(posId, posData);
                  }
                }}
                onDragOver={(e) => {
                  if (isScheduled && !isReadOnly) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                onDrop={(e) => {
                  if (isScheduled && !isReadOnly) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🎯 Drop on position slot:', {
                      posId,
                      label: posData.label,
                      datasetPosId: e.currentTarget.dataset.positionId,
                      datasetLabel: e.currentTarget.dataset.positionLabel
                    });
                    onPositionDrop(e, posId);
                  }
                }}
              >
                {/* Position Circle */}
                {isOccupied ? (
                  <div
                    className="relative group"
                    onClick={() => {
                      if (isPlayed && !isReadOnly) {
                        onPlayerClick(player);
                      }
                    }}
                  >
                    <div
                      style={{ 
                        ...getPositionGradientStyle(posData.type),
                        boxShadow: "0 0 6px rgba(0,0,0,0.3)",
                        border: "2px solid rgba(255, 255, 255, 0.8)",
                        pointerEvents: "none"
                      }}
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm
                        transition-all
                        ${isPlayed && !isReadOnly ? "cursor-pointer hover:scale-110" : ""}
                        group-hover:scale-110
                      `}
                    >
                      <span style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                        {player.kitNumber || "?"}
                      </span>

                      {/* Report Status Badge */}
                      {isPlayed && hasReport(player._id) && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {isPlayed && needsReport(player._id) && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
                          <AlertCircle className="w-3 h-3 text-white" />
                        </div>
                      )}

                      {/* Remove Button */}
                      {isScheduled && !isReadOnly && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemovePlayer(posId);
                          }}
                          style={{ pointerEvents: "auto" }}
                          className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full items-center justify-center text-white text-xs hidden group-hover:flex hover:bg-red-600 cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Player Name - Floating Tooltip */}
                    <div 
                      style={{ 
                        position: "absolute",
                        top: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        marginTop: "4px",
                        pointerEvents: "none"
                      }}
                    >
                      <div 
                        style={{ 
                          background: "rgba(0, 0, 0, 0.7)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                          whiteSpace: "nowrap"
                        }}
                        className="text-white text-xs font-bold"
                      >
                        {player.fullName}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      border: "2px dashed rgba(255, 255, 255, 0.7)"
                    }}
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      transition-all
                      ${isDragging ? "!border-cyan-400 bg-cyan-500/20" : ""}
                      ${isScheduled && !isReadOnly ? "hover:!border-cyan-400 hover:bg-cyan-500/20 hover:scale-110" : ""}
                    `}
                  >
                    <span className="text-white text-[10px] font-bold">{posData.label}</span>
                  </div>
                )}

                {/* Position Label (for empty slots) */}
                {!isOccupied && (
                  <div className="text-white text-[10px] font-semibold text-center drop-shadow-lg" style={{ pointerEvents: "none" }}>
                    {isScheduled && !isReadOnly ? "Click to assign" : posData.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

