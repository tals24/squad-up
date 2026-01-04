import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/primitives/select";
import FormField from "./FormField";

/**
 * PlayerSelect - Standardized player dropdown selector
 * Used across Card, Goal, and Substitution dialogs
 * 
 * @param {Array} players - Array of player objects
 * @param {string} value - Selected player ID
 * @param {function} onChange - Change handler (receives player ID)
 * @param {string} label - Field label
 * @param {string} placeholder - Placeholder text (default: "Select player...")
 * @param {boolean} required - Whether field is required (default: true)
 * @param {boolean} disabled - Whether select is disabled
 * @param {string} error - Error message to display
 * @param {string} id - Select ID
 * @param {function} formatPlayer - Custom player display formatter
 * @param {boolean} showPosition - Whether to show player position (default: false)
 * @param {boolean} allowNone - Whether to include "None" option (default: false)
 * @param {string} noneLabel - Label for "None" option (default: "None")
 */
export default function PlayerSelect({
  players = [],
  value,
  onChange,
  label,
  placeholder = "Select player...",
  required = true,
  disabled = false,
  error,
  id,
  formatPlayer,
  showPosition = false,
  allowNone = false,
  noneLabel = "None"
}) {
  // Default player formatter: #KitNumber FullName
  const defaultFormatter = (player) => {
    const kitNum = player.kitNumber || player.jerseyNumber || '?';
    const name = player.fullName || player.name || 'Unknown';
    const position = showPosition && player.position ? ` - ${player.position}` : '';
    return `#${kitNum} ${name}${position}`;
  };

  const formatter = formatPlayer || defaultFormatter;

  return (
    <FormField
      label={label}
      htmlFor={id}
      required={required}
      error={error}
    >
      <Select
        value={value || (allowNone ? 'none' : '')}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700">
          {allowNone && (
            <SelectItem value="none" className="text-slate-400">
              {noneLabel}
            </SelectItem>
          )}
          {players.map(player => (
            <SelectItem 
              key={player._id} 
              value={player._id} 
              className="text-white"
            >
              {formatter(player)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}
