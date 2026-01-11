/**
 * Player State Enum
 * Represents the possible states a player can be in during a match
 */
export const PlayerState = {
  NOT_IN_SQUAD: 'NOT_IN_SQUAD', // Not in the game roster
  BENCH: 'BENCH', // On the bench (not in starting lineup)
  ON_PITCH: 'ON_PITCH', // Currently playing
  SUBSTITUTED_OUT: 'SUBSTITUTED_OUT', // Was substituted out (for rolling subs support)
  SENT_OFF: 'SENT_OFF', // Sent off (red card or second yellow)
};

/**
 * Get player's state at a specific minute by reconstructing timeline
 *
 * This function iterates through timeline events chronologically to determine
 * the player's state at the target minute. This approach is robust and handles
 * edge cases like rolling subs, multiple substitutions, etc.
 *
 * @param {Array} timeline - Chronologically sorted timeline events from getMatchTimeline
 * @param {string} playerId - Player ID to track
 * @param {number} targetMinute - Minute to check state at
 * @param {Object} startingLineup - Map of playerId -> true for starting lineup players
 * @param {Object} squadPlayers - Map of playerId -> status ('Starting Lineup' | 'Bench')
 * @returns {string} PlayerState enum value
 */
export function getPlayerStateAtMinute(
  timeline,
  playerId,
  targetMinute,
  startingLineup = {},
  squadPlayers = {}
) {
  // Check if player is in squad at all
  if (!squadPlayers[playerId]) {
    return PlayerState.NOT_IN_SQUAD;
  }

  // Initialize state based on starting lineup
  let currentState = startingLineup[playerId] ? PlayerState.ON_PITCH : PlayerState.BENCH;

  // Iterate through timeline events up to targetMinute
  const eventsUpToMinute = timeline.filter((event) => event.minute <= targetMinute);

  for (const event of eventsUpToMinute) {
    // Handle substitutions
    if (event.type === 'substitution') {
      // Handle different player ID formats
      const playerOutId =
        event.playerOut?._id?.toString() ||
        event.playerOutId?.toString() ||
        event.playerOut?._id ||
        event.playerOutId ||
        event.playerOut?.toString();
      const playerInId =
        event.playerIn?._id?.toString() ||
        event.playerInId?.toString() ||
        event.playerIn?._id ||
        event.playerInId ||
        event.playerIn?.toString();

      // Normalize playerId for comparison
      const normalizedPlayerId = playerId?.toString();

      // Player going out
      if (playerOutId?.toString() === normalizedPlayerId) {
        if (currentState === PlayerState.ON_PITCH) {
          currentState = PlayerState.SUBSTITUTED_OUT;
        }
        // If already substituted out or sent off, state doesn't change
      }

      // Player coming in
      if (playerInId?.toString() === normalizedPlayerId) {
        if (currentState === PlayerState.BENCH || currentState === PlayerState.SUBSTITUTED_OUT) {
          currentState = PlayerState.ON_PITCH;
        }
        // If sent off, cannot come back on
      }
    }

    // Handle red cards (red or second-yellow)
    if (event.type === 'card') {
      const cardPlayerId =
        event.player?._id?.toString() ||
        event.playerId?.toString() ||
        event.player?._id ||
        event.playerId ||
        event.player?.toString();

      const normalizedPlayerId = playerId?.toString();

      if (
        cardPlayerId?.toString() === normalizedPlayerId &&
        (event.cardType === 'red' || event.cardType === 'second-yellow')
      ) {
        // Red card sends player off (regardless of current state)
        currentState = PlayerState.SENT_OFF;
      }
    }
  }

  return currentState;
}

/**
 * Filter players by their state at a specific minute
 *
 * @param {Array} players - Array of player objects
 * @param {Array} timeline - Chronologically sorted timeline events
 * @param {number} minute - Minute to check state at
 * @param {Object} startingLineup - Map of playerId -> true for starting lineup players
 * @param {Object} squadPlayers - Map of playerId -> status
 * @param {string} requiredState - Required PlayerState value
 * @returns {Array} Filtered array of players
 */
export function filterPlayersByState(
  players,
  timeline,
  minute,
  startingLineup,
  squadPlayers,
  requiredState
) {
  if (!minute || minute < 1) {
    return players; // Return all players if no minute specified
  }

  return players.filter((player) => {
    const playerId = player._id || player.id;
    const state = getPlayerStateAtMinute(timeline, playerId, minute, startingLineup, squadPlayers);
    return state === requiredState;
  });
}
