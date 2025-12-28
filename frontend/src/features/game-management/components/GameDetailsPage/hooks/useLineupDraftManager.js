import { useState, useEffect } from 'react';

/**
 * useLineupDraftManager
 * 
 * Custom hook that manages lineup draft loading and autosave for Scheduled games.
 * Handles draft precedence, merge logic, and debounced autosave.
 * 
 * **Behavior**:
 * 1. Load draft with precedence: draft → gameRosters → default
 * 2. Merge draft rosters with all players (ensure all players have a status)
 * 3. Restore formation from draft (if exists)
 * 4. Autosave draft changes with 2.5s debounce
 * 5. Skip autosave while game is being finalized (prevents write conflicts)
 * 
 * **Draft Precedence** (for Scheduled games):
 * - Priority 1: game.lineupDraft (most recent, includes formation)
 * - Priority 2: gameRosters (fallback if no draft)
 * - Priority 3: Empty/default (all players "Not in Squad")
 * 
 * **Autosave Logic**:
 * - Debounce: 2.5 seconds after last change
 * - Endpoint: PUT /api/games/${gameId}/draft
 * - Payload: { rosters, formation, formationType }
 * - Guards: Skip if finalizing, skip if Scheduled status, skip on initial load
 * 
 * @param {Object} config - Configuration object
 * @param {string} config.gameId - Game ID
 * @param {Object|null} config.game - Game object
 * @param {Array} config.gamePlayers - Players for this game's team
 * @param {Array} config.gameRosters - Game rosters from DataProvider
 * @param {boolean} config.isFinalizingGame - Whether game is being finalized
 * @param {Object} config.formation - Current formation (position -> player map)
 * @param {Function} config.setFormation - Setter for formation
 * @param {string} config.formationType - Current formation type (e.g., "1-4-4-2")
 * @param {Function} config.setFormationType - Setter for formation type
 * @param {boolean} config.manualFormationMode - Whether manual formation mode is enabled
 * @param {Function} config.setManualFormationMode - Setter for manual formation mode
 * 
 * @returns {Object} Lineup draft state and autosave status
 * @returns {Object} return.localRosterStatuses - Player roster statuses (playerId -> status)
 * @returns {Function} return.setLocalRosterStatuses - Setter for roster statuses
 * @returns {boolean} return.isAutosaving - Whether draft is currently being saved
 * @returns {string|null} return.autosaveError - Autosave error message (if any)
 * @returns {Function} return.setIsAutosaving - Setter for autosaving state
 * @returns {Function} return.setAutosaveError - Setter for autosave error
 */
export function useLineupDraftManager({
  gameId,
  game,
  gamePlayers,
  gameRosters,
  isFinalizingGame,
  formation,
  setFormation,
  formationType,
  setFormationType,
  manualFormationMode,
  setManualFormationMode,
}) {
  // Roster statuses state
  const [localRosterStatuses, setLocalRosterStatuses] = useState({});
  
  // Autosave state
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [autosaveError, setAutosaveError] = useState(null);
  
  // Effect 1: Load existing roster statuses (with draft priority)
  useEffect(() => {
    if (!gameId || !game || gamePlayers.length === 0) return;

    // 🔍 DEBUG: Log draft loading check
    console.log('🔍 [useLineupDraftManager] Checking for draft:', {
      gameId,
      gameStatus: game.status,
      hasLineupDraft: !!game.lineupDraft,
      lineupDraft: game.lineupDraft,
      lineupDraftType: typeof game.lineupDraft,
      isScheduled: game.status === 'Scheduled',
      hasGamePlayers: gamePlayers.length > 0
    });

    // Priority 1: Check for draft (only for Scheduled games)
    if (game.status === 'Scheduled' && game.lineupDraft && typeof game.lineupDraft === 'object') {
      console.log('📋 [useLineupDraftManager] Loading draft lineup:', game.lineupDraft);
      
      // Extract rosters and formation from draft
      const draftRosters = game.lineupDraft.rosters || game.lineupDraft; // Support both old and new format
      const draftFormation = game.lineupDraft.formation || {};
      const draftFormationType = game.lineupDraft.formationType || formationType;
      
      // Merge draft rosters with all players (ensure all players have a status)
      const draftStatuses = { ...draftRosters };
      gamePlayers.forEach((player) => {
        if (!draftStatuses[player._id]) {
          draftStatuses[player._id] = 'Not in Squad';
        }
      });
      
      // Restore formation from draft
      if (Object.keys(draftFormation).length > 0) {
        // Set manual mode FIRST to prevent auto-rebuild from interfering
        setManualFormationMode(true);
        
        // Rebuild formation object with full player objects from gamePlayers
        const restoredFormation = {};
        Object.keys(draftFormation).forEach((posId) => {
          const draftPlayer = draftFormation[posId];
          if (draftPlayer && draftPlayer._id) {
            // Find full player object from gamePlayers
            const fullPlayer = gamePlayers.find(p => p._id === draftPlayer._id);
            if (fullPlayer) {
              restoredFormation[posId] = fullPlayer;
            } else {
              console.warn(`⚠️ [useLineupDraftManager] Player not found for position ${posId}:`, draftPlayer._id);
            }
          }
        });
        
        console.log('✅ [useLineupDraftManager] Draft loaded, restoring formation:', {
          restoredFormation,
          positionCount: Object.keys(restoredFormation).length,
          playerIds: Object.values(restoredFormation).map(p => p._id)
        });
        setFormation(restoredFormation);
        setFormationType(draftFormationType);
      }
      
      console.log('✅ [useLineupDraftManager] Draft loaded, setting roster statuses:', draftStatuses);
      setLocalRosterStatuses(draftStatuses);
      return; // Draft loaded, skip gameRosters
    }

    // 🔍 DEBUG: Log why draft wasn't loaded
    if (game.status === 'Scheduled') {
      console.log('⚠️ [useLineupDraftManager] Scheduled game but no draft found:', {
        hasLineupDraft: !!game.lineupDraft,
        lineupDraft: game.lineupDraft,
        fallingBackTo: 'gameRosters or default'
      });
    }

    // Priority 2: Load from gameRosters (for Played/Done games, or if no draft)
    if (gameRosters && gameRosters.length > 0) {
      const rosterForGame = gameRosters.filter(
        (roster) => {
          const rosterGameId = typeof roster.game === "object" && roster.game !== null ? roster.game._id : roster.game;
          return rosterGameId === gameId;
        }
      );

      if (rosterForGame.length > 0) {
        const statuses = {};
        rosterForGame.forEach((roster) => {
          const playerId = typeof roster.player === "object" && roster.player !== null ? roster.player._id : roster.player;
          statuses[playerId] = roster.status;
        });
        setLocalRosterStatuses(statuses);
        return;
      }
    }

    // Priority 3: Default (empty rosters)
    setLocalRosterStatuses({});
  }, [gameId, game, gameRosters, gamePlayers]);
  
  // Effect 2: Debounced autosave for roster statuses and formation
  useEffect(() => {
    // CRITICAL: Don't autosave if game is being finalized (prevents write conflicts)
    if (isFinalizingGame) {
      console.log('⏸️ [useLineupDraftManager] Skipping autosave - game is being finalized');
      return;
    }
    
    // Only autosave for Scheduled games
    if (!game || game.status !== 'Scheduled') return;
    
    // Don't autosave on initial load (wait for user changes)
    if (Object.keys(localRosterStatuses).length === 0) return;
    
    // Set autosaving state
    setIsAutosaving(true);
    setAutosaveError(null);
    
    // Debounce: Wait 2.5 seconds after last change
    const autosaveTimer = setTimeout(async () => {
      try {
        // Prepare formation data for draft (only include player IDs and basic info)
        const formationForDraft = {};
        Object.keys(formation).forEach((posId) => {
          const player = formation[posId];
          if (player && player._id) {
            formationForDraft[posId] = {
              _id: player._id,
              fullName: player.fullName,
              kitNumber: player.kitNumber
            };
          }
        });

        const response = await fetch(`http://localhost:3001/api/games/${gameId}/draft`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({
            rosters: localRosterStatuses,
            formation: formationForDraft,
            formationType: formationType
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `Failed to save draft: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ [useLineupDraftManager] Draft autosaved successfully:', result);
        setIsAutosaving(false);
      } catch (error) {
        console.error('❌ [useLineupDraftManager] Error autosaving draft:', error);
        setAutosaveError(error.message);
        setIsAutosaving(false);
      }
    }, 2500); // 2.5 second debounce

    // Cleanup: Cancel timer if localRosterStatuses, formation, or finalization status changes
    return () => {
      clearTimeout(autosaveTimer);
    };
  }, [localRosterStatuses, formation, formationType, gameId, game, isFinalizingGame]);
  
  return {
    localRosterStatuses,
    setLocalRosterStatuses,
    isAutosaving,
    autosaveError,
    setIsAutosaving,
    setAutosaveError,
  };
}

