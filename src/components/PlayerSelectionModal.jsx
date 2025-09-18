import React, { useState, useMemo } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  Button,
  Input 
} from "@/components/ui/design-system-components";
import { Users, Search } from "lucide-react";

export default function PlayerSelectionModal({
  isOpen,
  onClose,
  onSelectPlayer,
  players,
  positionType,
  positionLabel,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPlayers = useMemo(() => {
    if (!players) return [];
    return players.filter((player) => {
      if (player.rosterStatus === 'Starting Lineup' || player.rosterStatus === 'Unavailable') {
        return false;
      }
      if (positionType && player.Position !== positionType) {
        return false;
      }
      if (searchTerm && !player.FullName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [players, positionType, searchTerm]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-bg-secondary/95 backdrop-blur-sm border-border-custom text-text-primary">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-text-primary">
            <Users className="w-5 h-5 text-accent-primary" />
            Select {positionType} for {positionLabel}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input
              type="text"
              placeholder="Search available players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full bg-bg-secondary border-border-custom text-text-primary placeholder-text-secondary focus:border-accent-primary focus:ring-accent-primary/20"
            />
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600">
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map((player) => {
                const positionColorClass = 
                  player.Position === 'Goalkeeper' ? 'bg-purple-500' :
                  player.Position === 'Defender' ? 'bg-primary-500' :
                  player.Position === 'Midfielder' ? 'bg-secondary-500' :
                  'bg-error-500';

                return (
                  <button
                    key={player.id}
                    onClick={() => onSelectPlayer(player)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors duration-200 hover:bg-bg-secondary/50"
                  >
                    <div className={`w-8 h-8 rounded-full ${positionColorClass} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <span className="font-bold text-text-primary text-sm">{player.KitNumber || '?'}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{player.FullName}</p>
                      <p className="text-xs text-text-secondary">{player.Position}</p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-8 text-neutral-500">
                <p>No available players match your search.</p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border-custom text-text-primary hover:bg-bg-secondary">Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}