import React from 'react';
import { AlertCircle } from 'lucide-react';

import { Input } from '@/shared/ui/primitives/input';
import { Label } from '@/shared/ui/primitives/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/primitives/select';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/primitives/radio-group';
import { Textarea } from '@/shared/ui/primitives/textarea';

const CARD_TYPES = [
  { value: 'yellow', label: 'Yellow Card', emoji: '🟨' },
  { value: 'red', label: 'Red Card', emoji: '🟥' },
  { value: 'second-yellow', label: 'Second Yellow', emoji: '🟨🟥' }
];

export function CardForm({
  cardData,
  setCardData,
  errors,
  validationError,
  availableOptions,
  gamePlayers,
  matchDuration,
  isReadOnly,
  isEditing,
}) {
  return (
    <div className="space-y-4">
      {/* Player */}
      <div className="space-y-2">
        <Label htmlFor="player" className="text-slate-300">Player *</Label>
        <Select
          value={cardData.playerId || ''}
          onValueChange={(value) => setCardData(prev => ({ ...prev, playerId: value }))}
          disabled={isReadOnly}
        >
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Select player..." />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {gamePlayers.map(player => (
              <SelectItem key={player._id} value={player._id} className="text-white">
                #{player.kitNumber || '?'} {player.fullName || player.name || 'Unknown'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.playerId && <p className="text-red-400 text-sm">{errors.playerId}</p>}
      </div>

      {/* Card Type */}
      <div className="space-y-2">
        <Label className="text-slate-300">Card Type *</Label>
        
        {availableOptions.isSentOff && !isEditing && (
          <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-400 text-sm font-medium">Player Already Sent Off</p>
              <p className="text-red-300 text-xs mt-1">
                This player has already received a red card or second yellow and cannot receive additional cards.
              </p>
            </div>
          </div>
        )}
        
        <RadioGroup
          value={cardData.cardType}
          onValueChange={(value) => setCardData(prev => ({ ...prev, cardType: value }))}
          disabled={isReadOnly || availableOptions.isSentOff}
          className="flex gap-4"
        >
          {CARD_TYPES.map(type => {
            const isAvailable = type.value === 'yellow' ? availableOptions.yellow
              : type.value === 'red' ? availableOptions.red
              : availableOptions.secondYellow;
            
            return (
              <div key={type.value} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={type.value}
                  id={type.value}
                  disabled={!isAvailable && !isEditing}
                  className="border-slate-600 text-cyan-500"
                />
                <Label
                  htmlFor={type.value}
                  className={`cursor-pointer ${!isAvailable && !isEditing ? 'opacity-40' : 'text-white'}`}
                >
                  {type.emoji} {type.label}
                </Label>
              </div>
            );
          })}
        </RadioGroup>
        {errors.cardType && <p className="text-red-400 text-sm">{errors.cardType}</p>}
        {validationError && !isEditing && (
          <p className="text-amber-400 text-sm flex items-start gap-1">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{validationError}</span>
          </p>
        )}
      </div>

      {/* Minute */}
      <div className="space-y-2">
        <Label htmlFor="minute" className="text-slate-300">Minute *</Label>
        <Input
          id="minute"
          type="number"
          min={1}
          max={matchDuration}
          value={cardData.minute || ''}
          onChange={(e) => setCardData(prev => ({ ...prev, minute: parseInt(e.target.value) || null }))}
          disabled={isReadOnly}
          className="bg-slate-800 border-slate-700 text-white"
          placeholder={`Enter minute (1-${matchDuration})`}
        />
        {errors.minute && <p className="text-red-400 text-sm">{errors.minute}</p>}
        <p className="text-xs text-slate-500">Match duration: {matchDuration} minutes</p>
      </div>

      {/* Reason */}
      <div className="space-y-2">
        <Label htmlFor="reason" className="text-slate-300">Reason (Optional)</Label>
        <Textarea
          id="reason"
          value={cardData.reason}
          onChange={(e) => setCardData(prev => ({ ...prev, reason: e.target.value }))}
          disabled={isReadOnly}
          className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
          placeholder="Foul description, offense details, etc."
          maxLength={200}
        />
        {errors.reason && <p className="text-red-400 text-sm">{errors.reason}</p>}
        <p className="text-xs text-slate-500">{cardData.reason.length}/200 characters</p>
      </div>
    </div>
  );
}

