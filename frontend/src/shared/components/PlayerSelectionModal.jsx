import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/primitives/dialog';
import { Button } from '@/shared/ui/primitives/button';
import { Input } from '@/shared/ui/primitives/input';
import { Label } from '@/shared/ui/primitives/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/primitives/select';
import { Card, CardContent } from '@/shared/ui/primitives/card';
import { Badge } from '@/shared/ui/primitives/badge';
import { Checkbox } from '@/shared/ui/primitives/checkbox';
import { Search, Users, User, Target, Shield, Zap, TrendingUp } from 'lucide-react';

const PlayerSelectionModal = ({
  isOpen,
  onClose,
  onConfirm,
  gameId,
  existingRoster = [],
  teamPlayers = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedPlayers([]);
      setStatusFilter('all');
      setPositionFilter('all');
    }
  }, [isOpen]);

  // Get existing player IDs in roster
  const existingPlayerIds = existingRoster.map(
    (roster) => roster.player?._id || roster.player || roster.Player?.[0]
  );

  // Filter available players (not already in roster)
  const availablePlayers = teamPlayers.filter((player) => {
    const playerId = player._id || player.id;
    return !existingPlayerIds.includes(playerId);
  });

  // Filter players based on search and filters
  const filteredPlayers = availablePlayers.filter((player) => {
    const fullName = player.fullName || player.FullName || '';
    const position = player.position || player.Position || '';
    const kitNumber = player.kitNumber || player.KitNumber || '';

    // Search filter
    const matchesSearch =
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kitNumber.toString().includes(searchTerm);

    // Position filter
    const matchesPosition = positionFilter === 'all' || position === positionFilter;

    return matchesSearch && matchesPosition;
  });

  // Group players by position
  const playersByPosition = filteredPlayers.reduce((acc, player) => {
    const position = player.position || player.Position || 'Other';
    if (!acc[position]) acc[position] = [];
    acc[position].push(player);
    return acc;
  }, {});

  const positionOrder = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Other'];

  const handlePlayerToggle = (playerId) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  const handleConfirm = () => {
    const playersToAdd = filteredPlayers.filter((player) =>
      selectedPlayers.includes(player._id || player.id)
    );
    onConfirm(playersToAdd);
    onClose();
  };

  const getPositionIcon = (position) => {
    switch (position) {
      case 'Goalkeeper':
        return <Shield className="w-4 h-4 text-purple-400" />;
      case 'Defender':
        return <Shield className="w-4 h-4 text-blue-400" />;
      case 'Midfielder':
        return <Zap className="w-4 h-4 text-green-400" />;
      case 'Forward':
        return <TrendingUp className="w-4 h-4 text-red-400" />;
      default:
        return <User className="w-4 h-4 text-slate-400" />;
    }
  };

  const getPositionColor = (position) => {
    switch (position) {
      case 'Goalkeeper':
        return 'bg-purple-500/10 text-purple-400 border-purple-400';
      case 'Defender':
        return 'bg-blue-500/10 text-blue-400 border-blue-400';
      case 'Midfielder':
        return 'bg-green-500/10 text-green-400 border-green-400';
      case 'Forward':
        return 'bg-red-500/10 text-red-400 border-red-400';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-400';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] bg-slate-800/95 backdrop-blur-sm border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5 text-cyan-400" />
            Add Players to Game Roster
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-slate-300">Search Players</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or kit number..."
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="w-48">
              <Label className="text-slate-300">Position</Label>
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                  <SelectItem value="Defender">Defender</SelectItem>
                  <SelectItem value="Midfielder">Midfielder</SelectItem>
                  <SelectItem value="Forward">Forward</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected Players Count */}
          {selectedPlayers.length > 0 && (
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
              <p className="text-cyan-400 font-medium">
                {selectedPlayers.length} player{selectedPlayers.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}

          {/* Players List */}
          <div className="max-h-96 overflow-y-auto space-y-4">
            {positionOrder.map((position) => {
              const players = playersByPosition[position] || [];
              if (players.length === 0) return null;

              return (
                <div key={position} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getPositionIcon(position)}
                    <h3 className="font-semibold text-slate-300">{position}s</h3>
                    <Badge variant="outline" className={`${getPositionColor(position)} text-xs`}>
                      {players.length}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {players.map((player) => {
                      const playerId = player._id || player.id;
                      const isSelected = selectedPlayers.includes(playerId);
                      const fullName = player.fullName || player.FullName || 'Unknown';
                      const kitNumber = player.kitNumber || player.KitNumber || '';
                      const age = player.age || player.Age || '';

                      return (
                        <Card
                          key={playerId}
                          className={`cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'bg-cyan-500/20 border-cyan-500/50'
                              : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700/70'
                          }`}
                          onClick={() => handlePlayerToggle(playerId)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={isSelected}
                                onChange={() => handlePlayerToggle(playerId)}
                                className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                              />

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  {kitNumber && (
                                    <div className="w-6 h-6 bg-slate-600 rounded text-xs flex items-center justify-center font-bold">
                                      {kitNumber}
                                    </div>
                                  )}
                                  <p className="font-medium text-white truncate">{fullName}</p>
                                </div>
                                {age && <p className="text-xs text-slate-400">Age: {age}</p>}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPlayers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">
                {searchTerm
                  ? 'No players found matching your search.'
                  : 'All players are already in the roster.'}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={onClose}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedPlayers.length === 0}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            Add {selectedPlayers.length} Player{selectedPlayers.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerSelectionModal;
