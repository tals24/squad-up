import React from 'react';
import { Users } from 'lucide-react';
import { Badge } from '@/shared/ui/primitives/badge';
import PlayerCard from './PlayerCard';

export default function GameDayRosterSidebar({
  playersOnPitch,
  benchPlayers,
  squadPlayers,
  hasReport,
  needsReport,
  getPlayerStatus,
  handleOpenPerformanceDialog,
  updatePlayerStatus,
  handleDragStart,
  handleDragEnd,
  isScheduled,
  isPlayed,
  isDone,
}) {
  return (
    <div className="w-[280px] bg-slate-900/95 backdrop-blur-sm border-r border-slate-700/50 flex flex-col">
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" />
          Game Day Roster
        </h2>
        {isScheduled && (
          <p className="text-xs text-slate-400 mt-1">
            Drag players to the formation or click to assign
          </p>
        )}
      </div>

      <div
        className="flex-1 overflow-y-auto p-4 space-y-6"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(148, 163, 184, 0.2) transparent',
        }}
      >
        {/* Players on Pitch */}
        {playersOnPitch.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-green-400 mb-2 flex items-center justify-between">
              <span>Players on Pitch</span>
              <Badge
                variant="secondary"
                className="text-xs bg-green-600/20 text-green-400 border-green-600/30"
              >
                {playersOnPitch.length}
              </Badge>
            </h3>
            <div className="space-y-2">
              {playersOnPitch.map((player) => (
                <PlayerCard
                  key={player._id}
                  player={player}
                  status="Starting Lineup"
                  hasReport={hasReport(player._id)}
                  needsReport={needsReport(player._id)}
                  onOpenPerformance={() => handleOpenPerformanceDialog(player)}
                  isScheduled={isScheduled}
                  isPlayed={isPlayed}
                  isReadOnly={isDone}
                  isDone={isDone}
                />
              ))}
            </div>
          </div>
        )}

        {/* Bench Players */}
        {benchPlayers.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-green-400 mb-2 flex items-center justify-between">
              <span>Bench</span>
              <Badge
                variant="secondary"
                className="text-xs bg-green-600/20 text-green-400 border-green-600/30"
              >
                {benchPlayers.length}
              </Badge>
            </h3>
            <div className="space-y-2">
              {benchPlayers.map((player) => (
                <PlayerCard
                  key={player._id}
                  player={player}
                  status="Bench"
                  hasReport={hasReport(player._id)}
                  needsReport={needsReport(player._id)}
                  onOpenPerformance={() => handleOpenPerformanceDialog(player)}
                  onStatusChange={(newStatus) => updatePlayerStatus(player._id, newStatus)}
                  onDragStart={(e) => handleDragStart(e, player)}
                  onDragEnd={handleDragEnd}
                  isScheduled={isScheduled}
                  isPlayed={isPlayed}
                  isReadOnly={isDone}
                  isDone={isDone}
                />
              ))}
            </div>
          </div>
        )}

        {/* Squad Players */}
        {squadPlayers.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-2 flex items-center justify-between">
              <span>Squad Players</span>
              <Badge
                variant="secondary"
                className="text-xs bg-slate-600/20 text-slate-400 border-slate-600/30"
              >
                {squadPlayers.length}
              </Badge>
            </h3>
            <div className="space-y-2">
              {squadPlayers.map((player) => (
                <PlayerCard
                  key={player._id}
                  player={player}
                  status={getPlayerStatus(player._id)}
                  hasReport={hasReport(player._id)}
                  needsReport={needsReport(player._id)}
                  onOpenPerformance={() => handleOpenPerformanceDialog(player)}
                  onStatusChange={(newStatus) => updatePlayerStatus(player._id, newStatus)}
                  onDragStart={(e) => handleDragStart(e, player)}
                  onDragEnd={handleDragEnd}
                  isScheduled={isScheduled}
                  isPlayed={isPlayed}
                  isReadOnly={isDone}
                  isDone={isDone}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
