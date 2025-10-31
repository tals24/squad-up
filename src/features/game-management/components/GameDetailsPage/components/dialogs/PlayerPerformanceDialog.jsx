import React, { useState, useMemo } from "react";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Textarea } from "@/shared/ui/primitives/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/primitives/dialog";

export default function PlayerPerformanceDialog({ 
  open, 
  onOpenChange, 
  player, 
  data, 
  onDataChange, 
  onSave, 
  isReadOnly,
  isStarting = false,
}) {
  if (!player) return null;

  const [errorMessage, setErrorMessage] = useState("");

  const minutesPlayed = useMemo(() => Number(data?.minutesPlayed || 0), [data]);

  const handleSaveClick = () => {
    // Block save if player is in starting lineup and minutesPlayed is 0
    if (isStarting && minutesPlayed <= 0) {
      setErrorMessage("Starting lineup players must have minutes played (greater than 0).");
      return;
    }
    setErrorMessage("");
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-white">
              {player.kitNumber || "?"}
            </div>
            <div>
              <div className="text-lg font-bold">{player.fullName}</div>
              <div className="text-sm text-slate-400">{player.position}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Minutes Played */}
          <div>
            <label className="text-sm font-semibold text-slate-400 mb-1 block">Minutes Played</label>
            <Input
              type="number"
              min="0"
              max="120"
              value={data.minutesPlayed}
              onChange={(e) => onDataChange({ ...data, minutesPlayed: parseInt(e.target.value) || 0 })}
              disabled={isReadOnly}
              className="bg-slate-800 border-slate-700 text-white"
            />
            {isStarting && errorMessage && (
              <div className="mt-1 text-xs text-red-400">{errorMessage}</div>
            )}
          </div>

          {/* Goals */}
          <div>
            <label className="text-sm font-semibold text-slate-400 mb-1 block">Goals</label>
            <Input
              type="number"
              min="0"
              max="99"
              value={data.goals}
              onChange={(e) => onDataChange({ ...data, goals: parseInt(e.target.value) || 0 })}
              disabled={isReadOnly}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {/* Assists */}
          <div>
            <label className="text-sm font-semibold text-slate-400 mb-1 block">Assists</label>
            <Input
              type="number"
              min="0"
              max="99"
              value={data.assists}
              onChange={(e) => onDataChange({ ...data, assists: parseInt(e.target.value) || 0 })}
              disabled={isReadOnly}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="text-sm font-semibold text-slate-400 mb-1 block">General Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => !isReadOnly && onDataChange({ ...data, rating: star })}
                  disabled={isReadOnly}
                  className={`
                    text-2xl transition-all
                    ${data.rating >= star ? "text-yellow-400" : "text-slate-600"}
                    ${!isReadOnly ? "hover:text-yellow-400 hover:scale-110" : ""}
                  `}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-semibold text-slate-400 mb-1 block">Performance Notes</label>
            <Textarea
              value={data.notes}
              onChange={(e) => onDataChange({ ...data, notes: e.target.value })}
              disabled={isReadOnly}
              placeholder="Detailed observations about player performance..."
              className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
            />
          </div>
        </div>

        {!isReadOnly && (
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-400">
              Cancel
            </Button>
            <Button onClick={handleSaveClick} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white">
              Save Report
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

