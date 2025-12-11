import React, { useMemo } from 'react';

import { Badge } from '@/shared/ui/primitives/badge';
import { Input } from '@/shared/ui/primitives/input';

/**
 * Player stats display component
 * Shows minutes, goals, assists, and cards
 */
export function PlayerStatsDisplay({
  player,
  data,
  onDataChange,
  isReadOnly,
  maxMinutes,
  displayMinutes,
  displayGoals,
  displayAssists,
  playerCards,
  showStatsLoading,
  useCalculated,
  useCalculatedGA,
  isDoneGame,
  getCardBadgeColor,
}) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Minutes Played */}
      <div>
        <label className="text-sm font-semibold text-slate-400 mb-1 block">
          Minutes Played
        </label>
        <Input
          type="number"
          min="0"
          max={maxMinutes}
          value={displayMinutes ?? 0}
          onChange={(e) => {
            if (!useCalculated && !isDoneGame) {
              onDataChange({ ...data, minutesPlayed: parseInt(e.target.value) || 0 });
            }
          }}
          disabled={isReadOnly || useCalculated || isDoneGame}
          readOnly={useCalculated || isDoneGame}
          className={`bg-slate-800 border-slate-700 text-white ${
            (useCalculated || isDoneGame) ? 'opacity-75 cursor-not-allowed' : ''
          }`}
          placeholder={showStatsLoading ? "Loading..." : undefined}
        />
        {showStatsLoading ? (
          <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
            <span className="animate-spin">⏳</span>
          </p>
        ) : (
          <div className="mt-1 text-xs text-slate-500">
            Max: {maxMinutes} min
          </div>
        )}
      </div>

      {/* Goals */}
      <div>
        <label className="text-sm font-semibold text-slate-400 mb-1 block">
          Goals
        </label>
        <Input
          type="number"
          min="0"
          value={displayGoals ?? 0}
          onChange={(e) => {
            if (!useCalculatedGA && !isDoneGame) {
              onDataChange({ ...data, goals: parseInt(e.target.value) || 0 });
            }
          }}
          disabled={isReadOnly || useCalculatedGA || isDoneGame}
          readOnly={useCalculatedGA || isDoneGame}
          className={`bg-slate-800 border-slate-700 text-white ${
            (useCalculatedGA || isDoneGame) ? 'opacity-75 cursor-not-allowed' : ''
          }`}
          placeholder={showStatsLoading ? "Loading..." : undefined}
        />
        {showStatsLoading && (
          <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
            <span className="animate-spin">⏳</span>
          </p>
        )}
      </div>

      {/* Assists */}
      <div>
        <label className="text-sm font-semibold text-slate-400 mb-1 block">
          Assists
        </label>
        <Input
          type="number"
          min="0"
          value={displayAssists ?? 0}
          onChange={(e) => {
            if (!useCalculatedGA && !isDoneGame) {
              onDataChange({ ...data, assists: parseInt(e.target.value) || 0 });
            }
          }}
          disabled={isReadOnly || useCalculatedGA || isDoneGame}
          readOnly={useCalculatedGA || isDoneGame}
          className={`bg-slate-800 border-slate-700 text-white ${
            (useCalculatedGA || isDoneGame) ? 'opacity-75 cursor-not-allowed' : ''
          }`}
          placeholder={showStatsLoading ? "Loading..." : undefined}
        />
        {showStatsLoading && (
          <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
            <span className="animate-spin">⏳</span>
          </p>
        )}
      </div>

      {/* Cards Display */}
      <div>
        <label className="text-sm font-semibold text-slate-400 mb-1 block">
          Cards
        </label>
        <div className="min-h-[2.5rem] flex flex-col gap-1.5 justify-center">
          {playerCards.length > 0 ? (
            playerCards
              .sort((a, b) => (a.minute || 0) - (b.minute || 0))
              .map((card) => {
                const cardType = card.cardType || card.type;
                const minute = card.minute;
                const cardEmoji = cardType === 'yellow' ? '🟨' : 
                                 cardType === 'red' ? '🟥' : '🟨🟥';
                
                return (
                  <div
                    key={card.id || card._id}
                    className="flex items-center gap-1.5"
                  >
                    <span className={`text-xs ${getCardBadgeColor(cardType)}`}>
                      {cardEmoji}
                    </span>
                    <span className="text-xs text-slate-300">{minute}'</span>
                  </div>
                );
              })
          ) : (
            <span className="text-xs text-slate-500">None</span>
          )}
        </div>
      </div>
    </div>
  );
}

