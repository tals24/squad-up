import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/primitives/button";
import { Label } from "@/shared/ui/primitives/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/primitives/select";

const CONTRIBUTION_TYPES = [
  { value: 'pre-assist', label: 'Pre-Assist' },
  { value: 'space-creation', label: 'Space Creation' },
  { value: 'defensive-action', label: 'Defensive Action' },
  { value: 'set-piece-delivery', label: 'Set Piece Delivery' },
  { value: 'pressing-action', label: 'Pressing Action' },
  { value: 'other', label: 'Other' }
];

/**
 * GoalInvolvementSection Component
 * 
 * Displays and manages goal involvement tracking (pre-assists and other contributions).
 * Allows adding/removing involved players and selecting their contribution type.
 * 
 * @param {Array} involvements - Array of involvement objects: [{ playerId, contributionType }]
 * @param {Function} onUpdate - Callback when involvements change: (newInvolvements) => void
 * @param {Array} players - Available players for selection
 * @param {Array} excludedPlayerIds - Player IDs to exclude (e.g., scorer, assister)
 * @param {boolean} isReadOnly - Whether the section is read-only
 */
export const GoalInvolvementSection = ({ 
  involvements = [], 
  onUpdate, 
  players = [],
  excludedPlayerIds = [],
  isReadOnly = false 
}) => {
  // Filter out excluded players (scorer, assister)
  const availablePlayers = players.filter(
    player => !excludedPlayerIds.includes(player._id)
  );

  const handleAddInvolvement = () => {
    const newInvolvements = [
      ...involvements,
      { playerId: null, contributionType: 'pre-assist' }
    ];
    onUpdate(newInvolvements);
  };

  const handleRemoveInvolvement = (index) => {
    const newInvolvements = involvements.filter((_, i) => i !== index);
    onUpdate(newInvolvements);
  };

  const handleInvolvementChange = (index, field, value) => {
    const newInvolvements = involvements.map((involvement, i) =>
      i === index ? { ...involvement, [field]: value } : involvement
    );
    onUpdate(newInvolvements);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-slate-300">Other Contributors (Optional)</Label>
        {!isReadOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddInvolvement}
            className="border-slate-700 text-cyan-400 hover:bg-slate-800"
          >
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        )}
      </div>
      
      {involvements.map((involvement, index) => (
        <div key={index} className="flex gap-2 items-start">
          <div className="flex-1 grid grid-cols-2 gap-2">
            <Select
              value={involvement.playerId || ''}
              onValueChange={(value) => handleInvolvementChange(index, 'playerId', value)}
              disabled={isReadOnly}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select player..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {availablePlayers.map(player => (
                  <SelectItem key={player._id} value={player._id} className="text-white">
                    #{player.kitNumber || '?'} {player.fullName || player.name || 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={involvement.contributionType || 'pre-assist'}
              onValueChange={(value) => handleInvolvementChange(index, 'contributionType', value)}
              disabled={isReadOnly}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {CONTRIBUTION_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value} className="text-white">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {!isReadOnly && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveInvolvement(index)}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
      
      {involvements.length === 0 && (
        <p className="text-sm text-slate-500">No contributors added</p>
      )}
    </div>
  );
};

