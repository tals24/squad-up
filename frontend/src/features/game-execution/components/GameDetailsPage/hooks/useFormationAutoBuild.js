import { useEffect } from 'react';

/**
 * Custom hook to auto-build formation from roster when NOT in manual mode
 * 
 * Responsibilities:
 * 1. Auto-assign players to formation positions based on their natural positions
 * 2. Use 3-phase matching system for intelligent player-position assignment
 * 3. Skip auto-build when in manual formation mode (user/draft control)
 * 4. Reset manual mode after rebuild when formation had players
 * 
 * Matching Strategy:
 * - Phase 1: Exact label match (player.position='RM' → rm position)
 * - Phase 2: Type match (player.position='Midfielder' → any midfielder slot)
 * - Phase 3: Fallback (any Starting Lineup player → any empty slot)
 * 
 * @param {Object} params
 * @param {Object} params.positions - Formation positions config (from formations[formationType])
 * @param {Array} params.gamePlayers - All players for the team
 * @param {Object} params.localRosterStatuses - Player ID -> status mapping
 * @param {Object} params.formation - Current formation object
 * @param {Function} params.setFormation - Setter for formation
 * @param {boolean} params.manualFormationMode - Whether manual mode is active
 * @param {Function} params.setManualFormationMode - Setter for manual mode
 */
export function useFormationAutoBuild({
  positions,
  gamePlayers,
  localRosterStatuses,
  formation,
  setFormation,
  manualFormationMode,
  setManualFormationMode,
}) {
  
  useEffect(() => {
    console.log('🔍 [useFormationAutoBuild] Effect triggered:', {
      hasGamePlayers: !!gamePlayers,
      gamePlayersCount: gamePlayers?.length || 0,
      hasRosterStatuses: !!localRosterStatuses,
      rosterStatusesCount: localRosterStatuses ? Object.keys(localRosterStatuses).length : 0,
      manualFormationMode,
      currentFormationCount: Object.values(formation).filter(p => p !== null).length
    });

    // Guard: Skip if no game players
    if (!gamePlayers || gamePlayers.length === 0) {
      console.log('⚠️ [useFormationAutoBuild] Skipping - no game players');
      return;
    }
    
    // Guard: Skip if no roster statuses
    if (!localRosterStatuses || Object.keys(localRosterStatuses).length === 0) {
      console.log('⚠️ [useFormationAutoBuild] Skipping - no roster statuses');
      return;
    }
    
    // Guard: Skip if manual formation mode
    // Manual mode means: user manually set it OR we restored from draft
    const hasFormationWithPlayers = Object.values(formation).some(p => p !== null);
    if (manualFormationMode) {
      if (hasFormationWithPlayers) {
        console.log('⚠️ [useFormationAutoBuild] Manual formation mode with existing formation - skipping auto-build');
      } else {
        console.log('⚠️ [useFormationAutoBuild] Manual formation mode active (likely restoring from draft) - skipping auto-build');
      }
      return;
    }

    console.log('🤖 [useFormationAutoBuild] Auto-building formation from roster...');
    const newFormation = {};
    const startingPlayers = gamePlayers.filter(player => localRosterStatuses[player._id] === "Starting Lineup");
    
    console.log('🔍 [useFormationAutoBuild] Starting players:', {
      count: startingPlayers.length,
      players: startingPlayers.map(p => ({ name: p.fullName, position: p.position, id: p._id }))
    });
    
    // Phase 1: Match players with exact position labels (e.g., player.position = "RM" → rm position)
    Object.entries(positions).forEach(([posId, posData]) => {
      const matchingPlayer = startingPlayers.find((player) => {
        const notYetPlaced = !Object.values(newFormation).some((p) => p?._id === player._id);
        const exactLabelMatch = player.position === posData.label;
        return notYetPlaced && exactLabelMatch;
      });

      if (matchingPlayer) {
        newFormation[posId] = matchingPlayer;
        console.log(`✅ [useFormationAutoBuild - Phase 1] Exact match: ${matchingPlayer.fullName} (${matchingPlayer.position}) → ${posId} (${posData.label})`);
      }
    });
    
    // Phase 2: Fill remaining positions by type (e.g., any "Midfielder" → any empty midfielder slot)
    Object.entries(positions).forEach(([posId, posData]) => {
      if (newFormation[posId]) return; // Already filled in Phase 1
      
      const matchingPlayer = startingPlayers.find((player) => {
        const notYetPlaced = !Object.values(newFormation).some((p) => p?._id === player._id);
        const typeMatch = player.position === posData.type;
        return notYetPlaced && typeMatch;
      });

      if (matchingPlayer) {
        newFormation[posId] = matchingPlayer;
        console.log(`✅ [useFormationAutoBuild - Phase 2] Type match: ${matchingPlayer.fullName} (${matchingPlayer.position}) → ${posId} (${posData.label})`);
      }
    });
    
    // Phase 3: Fill any remaining empty positions with unplaced players (fallback)
    Object.entries(positions).forEach(([posId, posData]) => {
      if (newFormation[posId]) return; // Already filled
      
      const anyUnplacedPlayer = startingPlayers.find((player) => {
        const notYetPlaced = !Object.values(newFormation).some((p) => p?._id === player._id);
        return notYetPlaced;
      });

      if (anyUnplacedPlayer) {
        newFormation[posId] = anyUnplacedPlayer;
        console.log(`⚠️ [useFormationAutoBuild - Phase 3] Fallback: ${anyUnplacedPlayer.fullName} (${anyUnplacedPlayer.position}) → ${posId} (${posData.label}) [Out of position]`);
      } else {
        newFormation[posId] = null;
      }
    });

    const assignedCount = Object.values(newFormation).filter(p => p !== null).length;
    const totalPositions = Object.keys(positions).length;
    console.log(`✅ [useFormationAutoBuild] Complete - ${assignedCount}/${totalPositions} positions filled`);
    
    if (assignedCount < startingPlayers.length) {
      console.warn(`⚠️ [useFormationAutoBuild] ${startingPlayers.length - assignedCount} starting players could not be placed`);
    }
    
    setFormation(newFormation);
    
    // Reset manual mode after rebuilding so it can rebuild again if needed
    // This allows auto-rebuild when roster changes
    if (hasFormationWithPlayers) {
      console.log('🔄 [useFormationAutoBuild] Resetting manual formation mode to allow future auto-builds');
      setManualFormationMode(false);
    }
  }, [positions, gamePlayers, localRosterStatuses]);
  
  // This hook doesn't return anything - it manages formation state via setters
}

