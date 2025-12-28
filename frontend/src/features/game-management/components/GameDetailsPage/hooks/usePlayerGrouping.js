import { useMemo } from 'react';

/**
 * Custom hook to group and categorize players based on their formation and roster status
 * 
 * Responsibilities:
 * 1. Compute playersOnPitch (players in formation)
 * 2. Compute benchPlayers (players with "Bench" status)
 * 3. Compute squadPlayers (available players not on pitch or bench)
 * 4. Compute activeGamePlayers (lineup + bench - can score/assist)
 * 5. Build status maps for quick lookups
 * 
 * @param {Object} params
 * @param {Object} params.formation - Current formation (positionId -> player mapping)
 * @param {Array} params.gamePlayers - All players for the team
 * @param {Object} params.localRosterStatuses - Player ID -> status mapping
 * 
 * @returns {Object} return.playersOnPitch - Players currently in formation positions
 * @returns {Object} return.benchPlayers - Players with "Bench" status
 * @returns {Object} return.squadPlayers - Available players not on pitch/bench
 * @returns {Object} return.activeGamePlayers - Lineup + Bench (can score/assist)
 * @returns {Object} return.startingLineupMap - Map of starting lineup player IDs
 * @returns {Object} return.squadPlayersMap - Map of active players (Starting + Bench)
 */
export function usePlayerGrouping({ formation, gamePlayers, localRosterStatuses }) {
  
  // Helper: Get player status
  const getPlayerStatus = (playerId) => {
    return localRosterStatuses[playerId] || "Not in Squad";
  };
  
  // Players currently in formation positions (on the pitch)
  const playersOnPitch = useMemo(() => {
    const players = Object.values(formation).filter((player) => player !== null);
    
    console.log('🔍 [usePlayerGrouping] Players on pitch:', {
      count: players.length,
      players: players.map(p => ({ id: p._id, name: p.fullName }))
    });
    
    return players;
  }, [formation]);

  // Players with "Bench" status
  const benchPlayers = useMemo(() => {
    const players = gamePlayers.filter((player) => {
      const status = getPlayerStatus(player._id);
      return status === "Bench";
    });
    
    console.log('🔍 [usePlayerGrouping] Bench players:', {
      count: players.length,
      players: players.map(p => ({ id: p._id, name: p.fullName }))
    });
    
    return players;
  }, [gamePlayers, localRosterStatuses]);

  // Available squad players (not on pitch, not on bench, but available)
  // These are players who could be added to the lineup or bench
  const squadPlayers = useMemo(() => {
    const players = gamePlayers.filter((player) => {
      const status = getPlayerStatus(player._id);
      const isOnPitch = playersOnPitch.some((p) => p._id === player._id);
      const isBench = status === "Bench";
      
      // Squad players are those not on pitch and not on bench
      // They're available to be added to either
      return !isOnPitch && !isBench;
    });
    
    console.log('🔍 [usePlayerGrouping] Squad players:', {
      count: players.length,
      players: players.map(p => ({ id: p._id, name: p.fullName, status: getPlayerStatus(p._id) }))
    });
    
    return players;
  }, [gamePlayers, playersOnPitch, localRosterStatuses]);

  // Active game players (lineup + bench) - only these can score/assist
  const activeGamePlayers = useMemo(() => {
    const players = [...playersOnPitch, ...benchPlayers];
    
    console.log('🔍 [usePlayerGrouping] Active game players:', {
      count: players.length,
      onPitch: playersOnPitch.length,
      bench: benchPlayers.length
    });
    
    return players;
  }, [playersOnPitch, benchPlayers]);

  // Build starting lineup map for quick lookups
  // Used for game state reconstruction and validation
  const startingLineupMap = useMemo(() => {
    const map = {};
    gamePlayers.forEach(player => {
      const status = getPlayerStatus(player._id);
      if (status === 'Starting Lineup') {
        map[player._id] = true;
      }
    });
    
    console.log('🔍 [usePlayerGrouping] Starting lineup map:', {
      count: Object.keys(map).length,
      playerIds: Object.keys(map)
    });
    
    return map;
  }, [gamePlayers, localRosterStatuses]);

  // Build squad players map (Starting + Bench)
  // Used for game state reconstruction and determining who can participate
  const squadPlayersMap = useMemo(() => {
    const map = {};
    gamePlayers.forEach(player => {
      const status = getPlayerStatus(player._id);
      if (status === 'Starting Lineup' || status === 'Bench') {
        map[player._id] = status;
      }
    });
    
    console.log('🔍 [usePlayerGrouping] Squad players map:', {
      count: Object.keys(map).length,
      starting: Object.values(map).filter(s => s === 'Starting Lineup').length,
      bench: Object.values(map).filter(s => s === 'Bench').length
    });
    
    return map;
  }, [gamePlayers, localRosterStatuses]);

  return {
    playersOnPitch,
    benchPlayers,
    squadPlayers,
    activeGamePlayers,
    startingLineupMap,
    squadPlayersMap,
  };
}

