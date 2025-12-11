import { useState, useEffect } from 'react';

import { useData } from '@/app/providers/DataProvider';

/**
 * Roster management hook
 * Handles player roster statuses, draft loading, and autosave
 * @param {string} gameId - The ID of the game
 * @param {object} game - The game object
 * @param {Array} gamePlayers - List of team players
 * @param {boolean} isFinalizingGame - Flag to prevent autosave during finalization
 */
export function useRosterManagement(gameId, game, gamePlayers, isFinalizingGame = false) {
  const { gameRosters, updateGameRostersInCache } = useData();
  
  const [localRosterStatuses, setLocalRosterStatuses] = useState({});
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [autosaveError, setAutosaveError] = useState(null);

  // Load existing roster statuses (with draft priority)
  useEffect(() => {
    if (!gameId || !game || gamePlayers.length === 0) return;

    console.log('🔍 [useRosterManagement] Loading roster statuses:', {
      gameId,
      gameStatus: game.status,
      hasLineupDraft: !!game.lineupDraft,
    });

    // Priority 1: Check for draft (only for Scheduled games)
    if (game.status === 'Scheduled' && game.lineupDraft && typeof game.lineupDraft === 'object') {
      console.log('📋 Loading draft lineup:', game.lineupDraft);
      
      const draftRosters = game.lineupDraft.rosters || game.lineupDraft;
      const draftStatuses = { ...draftRosters };
      
      gamePlayers.forEach((player) => {
        if (!draftStatuses[player._id]) {
          draftStatuses[player._id] = 'Not in Squad';
        }
      });
      
      console.log('✅ Draft loaded, setting roster statuses:', draftStatuses);
      setLocalRosterStatuses(draftStatuses);
      return;
    }

    // Priority 2: Load from gameRosters (for Played/Done games, or if no draft)
    if (gameRosters && gameRosters.length > 0) {
      const rosterForGame = gameRosters.filter((roster) => {
        const rosterGameId = typeof roster.game === "object" && roster.game !== null 
          ? roster.game._id 
          : roster.game;
        return rosterGameId === gameId;
      });

      if (rosterForGame.length > 0) {
        const statuses = {};
        rosterForGame.forEach((roster) => {
          const playerId = typeof roster.player === "object" && roster.player !== null 
            ? roster.player._id 
            : roster.player;
          statuses[playerId] = roster.status;
        });
        setLocalRosterStatuses(statuses);
        return;
      }
    }

    // Priority 3: Initialize all to "Not in Squad" (fallback)
    const initialStatuses = {};
    gamePlayers.forEach((player) => {
      initialStatuses[player._id] = "Not in Squad";
    });
    setLocalRosterStatuses(initialStatuses);
  }, [gameId, game, gameRosters, gamePlayers]);

  // Helper: Get player status
  const getPlayerStatus = (playerId) => {
    return localRosterStatuses[playerId] || "Not in Squad";
  };

  // Helper: Update player status (local state only - autosave handled by useEffect)
  const updatePlayerStatus = (playerId, newStatus) => {
    setLocalRosterStatuses((prev) => ({ ...prev, [playerId]: newStatus }));
  };

  return {
    localRosterStatuses,
    setLocalRosterStatuses,
    getPlayerStatus,
    updatePlayerStatus,
    isAutosaving,
    autosaveError,
    updateGameRostersInCache,
  };
}

