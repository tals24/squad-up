import { useState, useEffect, useMemo } from 'react';

import { formations } from '../formations';

/**
 * Formation management hook
 * Handles formation state, auto-build, and draft save/restore
 * @param {Array} gamePlayers - List of team players
 * @param {object} localRosterStatuses - Current roster statuses
 * @param {object} game - The game object
 * @param {string} gameId - The ID of the game
 * @param {boolean} isFinalizingGame - Flag to prevent autosave during finalization
 */
export function useFormationManagement(gamePlayers, localRosterStatuses, game, gameId, isFinalizingGame = false) {
  const [formationType, setFormationType] = useState("1-4-4-2");
  const [formation, setFormation] = useState({});
  const [manualFormationMode, setManualFormationMode] = useState(false);

  // Get current formation positions
  const positions = useMemo(() => formations[formationType]?.positions || {}, [formationType]);

  // Restore formation from draft (for Scheduled games)
  useEffect(() => {
    if (!game || !gamePlayers || gamePlayers.length === 0) return;
    if (game.status !== 'Scheduled' || !game.lineupDraft) return;

    const draft = game.lineupDraft;
    const draftFormation = draft.formation || {};
    const draftFormationType = draft.formationType || formationType;
    
    if (Object.keys(draftFormation).length > 0) {
      setManualFormationMode(true);
      
      const restoredFormation = {};
      Object.keys(draftFormation).forEach((posId) => {
        const draftPlayer = draftFormation[posId];
        if (draftPlayer && draftPlayer._id) {
          const fullPlayer = gamePlayers.find(p => p._id === draftPlayer._id);
          if (fullPlayer) {
            restoredFormation[posId] = fullPlayer;
          }
        }
      });
      
      console.log('✅ [useFormationManagement] Restored formation from draft:', {
        positionCount: Object.keys(restoredFormation).length,
      });
      
      setFormation(restoredFormation);
      setFormationType(draftFormationType);
    }
  }, [game, gamePlayers]);

  // Auto-build formation from roster (only when NOT in manual mode)
  useEffect(() => {
    if (!gamePlayers || gamePlayers.length === 0) return;
    if (!localRosterStatuses || Object.keys(localRosterStatuses).length === 0) return;
    
    const hasFormationWithPlayers = Object.values(formation).some(p => p !== null);
    if (manualFormationMode) {
      if (!hasFormationWithPlayers) {
        console.log('⚠️ [useFormationManagement] Manual mode active - skipping auto-build');
      }
      return;
    }

    console.log('🤖 [useFormationManagement] Auto-building formation from roster...');
    const newFormation = {};
    const startingPlayers = gamePlayers.filter(
      player => localRosterStatuses[player._id] === "Starting Lineup"
    );
    
    Object.entries(positions).forEach(([posId, posData]) => {
      const matchingPlayer = startingPlayers.find((player) => {
        const notYetPlaced = !Object.values(newFormation).some((p) => p?._id === player._id);
        const positionMatch = player.position === posData.type || player.position === posData.label;
        return notYetPlaced && positionMatch;
      });

      newFormation[posId] = matchingPlayer || null;
    });

    const assignedCount = Object.values(newFormation).filter(p => p !== null).length;
    console.log(`✅ [useFormationManagement] Complete - ${assignedCount} players assigned`);
    setFormation(newFormation);
    
    if (hasFormationWithPlayers) {
      setManualFormationMode(false);
    }
  }, [positions, gamePlayers, localRosterStatuses, manualFormationMode, formation]);

  // Autosave formation draft for Scheduled games
  useEffect(() => {
    if (isFinalizingGame) {
      console.log('⏸️ [useFormationManagement] Skipping autosave - game is being finalized');
      return;
    }
    
    if (!game || game.status !== 'Scheduled') return;
    if (Object.keys(localRosterStatuses).length === 0) return;

    // Create AbortController for this fetch
    const abortController = new AbortController();
    let isMounted = true;

    const autosaveTimer = setTimeout(async () => {
      if (!isMounted) return;
      
      try {
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
          signal: abortController.signal,
        });

        if (!isMounted) return;

        if (!response.ok) {
          throw new Error('Failed to save draft');
        }

        console.log('✅ [useFormationManagement] Draft autosaved');
      } catch (error) {
        // Ignore abort errors (component unmounted)
        if (error.name === 'AbortError') {
          console.log('🚫 [useFormationManagement] Autosave cancelled (component unmounted)');
          return;
        }
        if (isMounted) {
          console.error('❌ Error autosaving formation draft:', error);
        }
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearTimeout(autosaveTimer);
      abortController.abort();
    };
  }, [localRosterStatuses, formation, formationType, gameId, game, isFinalizingGame]);

  const handleFormationChange = (newFormationType) => {
    if (window.confirm("Changing formation will clear all current position assignments. Continue?")) {
      setFormationType(newFormationType);
      setFormation({});
    }
  };

  return {
    formationType,
    setFormationType,
    formation,
    setFormation,
    positions,
    manualFormationMode,
    setManualFormationMode,
    handleFormationChange,
  };
}

