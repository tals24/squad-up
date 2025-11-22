import React from "react";
import { Label } from "@/shared/ui/primitives/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/primitives/select";

/**
 * DetailedDisciplinarySection Component
 * 
 * Displays fouls committed/received tracking fields for disciplinary actions.
 * This is the "detailed" part of disciplinary tracking that can be enabled/disabled
 * via organization settings.
 * 
 * @param {string} foulsCommitted - Current fouls committed value (e.g., '0', '1-2', '3-4', '5+')
 * @param {string} foulsReceived - Current fouls received value (e.g., '0', '1-2', '3-4', '5+')
 * @param {Function} onFoulsCommittedChange - Callback when fouls committed changes: (value) => void
 * @param {Function} onFoulsReceivedChange - Callback when fouls received changes: (value) => void
 * @param {boolean} isReadOnly - Whether the section is read-only
 */
export const DetailedDisciplinarySection = ({ 
  foulsCommitted = '0',
  foulsReceived = '0',
  onFoulsCommittedChange,
  onFoulsReceivedChange,
  isReadOnly = false 
}) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label className="text-xs text-slate-400 mb-1 block">Fouls Committed</Label>
        <Select
          value={foulsCommitted}
          onValueChange={onFoulsCommittedChange}
          disabled={isReadOnly}
        >
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="0" className="text-white">0</SelectItem>
            <SelectItem value="1-2" className="text-white">1-2</SelectItem>
            <SelectItem value="3-4" className="text-white">3-4</SelectItem>
            <SelectItem value="5+" className="text-white">5+</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs text-slate-400 mb-1 block">Fouls Received</Label>
        <Select
          value={foulsReceived}
          onValueChange={onFoulsReceivedChange}
          disabled={isReadOnly}
        >
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="0" className="text-white">0</SelectItem>
            <SelectItem value="1-2" className="text-white">1-2</SelectItem>
            <SelectItem value="3-4" className="text-white">3-4</SelectItem>
            <SelectItem value="5+" className="text-white">5+</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

