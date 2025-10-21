import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, X } from "lucide-react";

export default function PlayerSelectionDialog({
  open,
  onClose,
  position,
  positionData,
  availablePlayers,
  onSelectPlayer
}) {
  // Filter players by position type
  const filteredPlayers = useMemo(() => {
    if (!positionData || !availablePlayers) return [];
    
    return availablePlayers.filter(player => {
      const playerPos = player.position;
      const posType = positionData.type;
      
      // Match position types
      if (posType === "Goalkeeper" && playerPos === "Goalkeeper") return true;
      if (posType === "Defender" && playerPos === "Defender") return true;
      if (posType === "Midfielder" && playerPos === "Midfielder") return true;
      if (posType === "Forward" && playerPos === "Forward") return true;
      
      return false;
    });
  }, [positionData, availablePlayers]);

  const getPositionColor = (position) => {
    if (position === "Goalkeeper") return "bg-purple-600/20 text-purple-400 border-purple-600/30";
    if (position === "Defender") return "bg-blue-600/20 text-blue-400 border-blue-600/30";
    if (position === "Midfielder") return "bg-green-600/20 text-green-400 border-green-600/30";
    if (position === "Forward") return "bg-red-600/20 text-red-400 border-red-600/30";
    return "bg-slate-600/20 text-slate-400 border-slate-600/30";
  };

  const handleSelectPlayer = (player) => {
    onSelectPlayer(player);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Select Player for {positionData?.label}
          </DialogTitle>
          {positionData && (
            <p className="text-sm text-slate-400">
              Position: <span className="text-cyan-400 font-semibold">{positionData.type}</span>
            </p>
          )}
        </DialogHeader>

        <div className="mt-4 max-h-96 overflow-y-auto space-y-2">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map((player) => (
              <div
                key={player._id}
                onClick={() => handleSelectPlayer(player)}
                className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600 hover:border-cyan-500 hover:bg-slate-700 cursor-pointer transition-all group"
              >
                {/* Kit Number */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center font-bold text-white text-sm shrink-0 group-hover:scale-110 transition-transform">
                  {player.kitNumber || "?"}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{player.fullName}</div>
                  <Badge variant="secondary" className={`text-xs mt-0.5 border ${getPositionColor(player.position)}`}>
                    {player.position}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">
                No available {positionData?.type}s
              </p>
              <p className="text-slate-500 text-sm mt-1">
                All players for this position are already assigned
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
