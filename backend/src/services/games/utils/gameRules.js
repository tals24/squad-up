const { getMatchTimeline: getTimelineFromService } = require('../../timelineService');
const GameRoster = require('../../../models/GameRoster');

// Re-export getMatchTimeline for convenience
const getMatchTimeline = getTimelineFromService;

/**
 * Player State Enum
 * Represents the possible states a player can be in during a match
 */
const PlayerState = {
  NOT_IN_SQUAD: 'NOT_IN_SQUAD',      // Not in the game roster
  BENCH: 'BENCH',                     // On the bench (not in starting lineup)
  ON_PITCH: 'ON_PITCH',               // Currently playing
  SUBSTITUTED_OUT: 'SUBSTITUTED_OUT', // Was substituted out (for rolling subs support)
  SENT_OFF: 'SENT_OFF'                // Sent off (red card or second yellow)
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
 * @returns {string} PlayerState enum value
 */
function getPlayerStateAtMinute(timeline, playerId, targetMinute, startingLineup = {}, squadPlayers = {}) {
  // Check if player is in squad at all
  if (!squadPlayers[playerId]) {
    return PlayerState.NOT_IN_SQUAD;
  }
  
  // Initialize state based on starting lineup
  let currentState = startingLineup[playerId] 
    ? PlayerState.ON_PITCH 
    : PlayerState.BENCH;
  
  // Iterate through timeline events up to targetMinute
  const eventsUpToMinute = timeline.filter(event => event.minute <= targetMinute);
  
  for (const event of eventsUpToMinute) {
    // Handle substitutions
    if (event.type === 'substitution') {
      const playerOutId = event.playerOut?._id?.toString() || event.playerOutId?.toString() || event.playerOut?.toString();
      const playerInId = event.playerIn?._id?.toString() || event.playerInId?.toString() || event.playerIn?.toString();
      
      // Player going out
      if (playerOutId === playerId) {
        if (currentState === PlayerState.ON_PITCH) {
          currentState = PlayerState.SUBSTITUTED_OUT;
        }
        // If already substituted out or sent off, state doesn't change
      }
      
      // Player coming in
      if (playerInId === playerId) {
        if (currentState === PlayerState.BENCH || currentState === PlayerState.SUBSTITUTED_OUT) {
          currentState = PlayerState.ON_PITCH;
        }
        // If sent off, cannot come back on
      }
    }
    
    // Handle red cards (red or second-yellow)
    if (event.type === 'card') {
      const cardPlayerId = event.player?._id?.toString() || event.playerId?.toString() || event.player?.toString();
      
      if (cardPlayerId === playerId && (event.cardType === 'red' || event.cardType === 'second-yellow')) {
        // Red card sends player off (regardless of current state)
        currentState = PlayerState.SENT_OFF;
      }
    }
  }
  
  return currentState;
}

/**
 * Get starting lineup map for a game
 * 
 * @param {string} gameId - Game ID
 * @returns {Promise<Object>} Map of playerId -> true for starting lineup players
 */
async function getStartingLineup(gameId) {
  const rosters = await GameRoster.find({ 
    game: gameId, 
    status: 'Starting Lineup' 
  }).lean();
  
  const startingLineup = {};
  rosters.forEach(roster => {
    const playerId = roster.player?.toString() || roster.player?._id?.toString();
    if (playerId) {
      startingLineup[playerId] = true;
    }
  });
  
  return startingLineup;
}

/**
 * Get all players in squad (starting lineup + bench)
 * 
 * @param {string} gameId - Game ID
 * @returns {Promise<Object>} Map of playerId -> status ('Starting Lineup' | 'Bench')
 */
async function getSquadPlayers(gameId) {
  const rosters = await GameRoster.find({ 
    game: gameId,
    status: { $in: ['Starting Lineup', 'Bench'] }
  }).lean();
  
  const squadPlayers = {};
  rosters.forEach(roster => {
    const playerId = roster.player?.toString() || roster.player?._id?.toString();
    if (playerId) {
      squadPlayers[playerId] = roster.status;
    }
  });
  
  return squadPlayers;
}

/**
 * Validate if a player can score a goal at a specific minute
 * 
 * Rules:
 * - Scorer must be ON_PITCH at the minute
 * - Assister (if provided) must be ON_PITCH at the minute
 * - Scorer and assister cannot be the same player
 * 
 * @param {string} gameId - Game ID
 * @param {string} scorerId - Scorer player ID
 * @param {string|null} assisterId - Assister player ID (optional)
 * @param {number} minute - Minute of the goal
 * @returns {Promise<{valid: boolean, error: string|null}>}
 */
async function validateGoalEligibility(gameId, scorerId, assisterId, minute) {
  try {
    // Get timeline and starting lineup
    const timeline = await getMatchTimeline(gameId);
    const startingLineup = await getStartingLineup(gameId);
    const squadPlayers = await getSquadPlayers(gameId);
    
    // Check if scorer is in squad
    if (!squadPlayers[scorerId]) {
      return {
        valid: false,
        error: 'Scorer must be in the game squad (starting lineup or bench)'
      };
    }
    
    // Get scorer state at minute
    const scorerState = getPlayerStateAtMinute(timeline, scorerId, minute, startingLineup, squadPlayers);
    
    if (scorerState !== PlayerState.ON_PITCH) {
      return {
        valid: false,
        error: `Scorer must be on the pitch. Current state: ${scorerState === PlayerState.SENT_OFF ? 'sent off' : scorerState === PlayerState.BENCH ? 'on bench' : 'substituted out'}`
      };
    }
    
    // Validate assister if provided
    if (assisterId) {
      if (assisterId === scorerId) {
        return {
          valid: false,
          error: 'Assister cannot be the same as scorer'
        };
      }
      
      if (!squadPlayers[assisterId]) {
        return {
          valid: false,
          error: 'Assister must be in the game squad (starting lineup or bench)'
        };
      }
      
      const assisterState = getPlayerStateAtMinute(timeline, assisterId, minute, startingLineup, squadPlayers);
      
      if (assisterState !== PlayerState.ON_PITCH) {
        return {
          valid: false,
          error: `Assister must be on the pitch. Current state: ${assisterState === PlayerState.SENT_OFF ? 'sent off' : assisterState === PlayerState.BENCH ? 'on bench' : 'substituted out'}`
        };
      }
    }
    
    return { valid: true, error: null };
  } catch (error) {
    console.error('Error validating goal eligibility:', error);
    return {
      valid: false,
      error: `Validation error: ${error.message}`
    };
  }
}

/**
 * Validate if a substitution can be made at a specific minute
 * 
 * Rules:
 * - PlayerOut must be ON_PITCH at the minute
 * - PlayerOut cannot be SENT_OFF
 * - PlayerIn must be BENCH or SUBSTITUTED_OUT at the minute
 * - PlayerIn cannot be SENT_OFF
 * - Players must be different
 * 
 * @param {string} gameId - Game ID
 * @param {string} playerOutId - Player leaving the pitch
 * @param {string} playerInId - Player entering the pitch
 * @param {number} minute - Minute of substitution
 * @returns {Promise<{valid: boolean, error: string|null}>}
 */
async function validateSubstitutionEligibility(gameId, playerOutId, playerInId, minute) {
  try {
    // Basic validation
    if (playerOutId === playerInId) {
      return {
        valid: false,
        error: 'Player out and player in must be different'
      };
    }
    
    // Get timeline and starting lineup
    const timeline = await getMatchTimeline(gameId);
    const startingLineup = await getStartingLineup(gameId);
    const squadPlayers = await getSquadPlayers(gameId);
    
    // Check if players are in squad
    if (!squadPlayers[playerOutId]) {
      return {
        valid: false,
        error: 'Player leaving field must be in the game squad'
      };
    }
    
    if (!squadPlayers[playerInId]) {
      return {
        valid: false,
        error: 'Player entering field must be in the game squad'
      };
    }
    
    // Get player states at minute
    const playerOutState = getPlayerStateAtMinute(timeline, playerOutId, minute, startingLineup, squadPlayers);
    const playerInState = getPlayerStateAtMinute(timeline, playerInId, minute, startingLineup, squadPlayers);
    
    // Validate playerOut state
    if (playerOutState === PlayerState.SENT_OFF) {
      return {
        valid: false,
        error: 'Cannot substitute a player who has been sent off'
      };
    }
    
    if (playerOutState !== PlayerState.ON_PITCH) {
      return {
        valid: false,
        error: `Player leaving field must be on the pitch. Current state: ${playerOutState === PlayerState.BENCH ? 'on bench' : 'already substituted out'}`
      };
    }
    
    // Validate playerIn state
    if (playerInState === PlayerState.SENT_OFF) {
      return {
        valid: false,
        error: 'Cannot substitute in a player who has been sent off'
      };
    }
    
    if (playerInState === PlayerState.ON_PITCH) {
      return {
        valid: false,
        error: 'Player entering field is already on the pitch'
      };
    }
    
    // PlayerIn can be BENCH or SUBSTITUTED_OUT (rolling subs support)
    if (playerInState !== PlayerState.BENCH && playerInState !== PlayerState.SUBSTITUTED_OUT) {
      return {
        valid: false,
        error: `Player entering field must be on bench or previously substituted out. Current state: ${playerInState}`
      };
    }
    
    return { valid: true, error: null };
  } catch (error) {
    console.error('Error validating substitution eligibility:', error);
    return {
      valid: false,
      error: `Validation error: ${error.message}`
    };
  }
}

/**
 * Validate if a player can receive a card at a specific minute
 * 
 * Rules:
 * - Player must be ON_PITCH or BENCH at the minute (cards can be given to bench players)
 * - Player cannot be SENT_OFF (already sent off)
 * - Note: Card type validation (yellow -> second yellow) is handled separately in cardValidation.js
 * 
 * @param {string} gameId - Game ID
 * @param {string} playerId - Player receiving the card
 * @param {number} minute - Minute of the card
 * @returns {Promise<{valid: boolean, error: string|null}>}
 */
async function validateCardEligibility(gameId, playerId, minute) {
  try {
    // Get timeline and starting lineup
    const timeline = await getMatchTimeline(gameId);
    const startingLineup = await getStartingLineup(gameId);
    const squadPlayers = await getSquadPlayers(gameId);
    
    // Check if player is in squad
    if (!squadPlayers[playerId]) {
      return {
        valid: false,
        error: 'Player must be in the game squad (starting lineup or bench) to receive a card'
      };
    }
    
    // Get player state at minute
    const playerState = getPlayerStateAtMinute(timeline, playerId, minute, startingLineup, squadPlayers);
    
    // Cannot give card to player who is already sent off
    if (playerState === PlayerState.SENT_OFF) {
      return {
        valid: false,
        error: 'Cannot give a card to a player who has already been sent off'
      };
    }
    
    // Cards can be given to players on pitch or on bench
    // (In football, bench players can receive cards for misconduct)
    if (playerState !== PlayerState.ON_PITCH && playerState !== PlayerState.BENCH) {
      return {
        valid: false,
        error: `Player must be on the pitch or on the bench to receive a card. Current state: ${playerState === PlayerState.SUBSTITUTED_OUT ? 'substituted out' : 'not in squad'}`
      };
    }
    
    return { valid: true, error: null };
  } catch (error) {
    console.error('Error validating card eligibility:', error);
    return {
      valid: false,
      error: `Validation error: ${error.message}`
    };
  }
}

/**
 * Validate future consistency - prevents out-of-order event corruption
 * 
 * When adding a new event (Sub Out or Red Card) at minute T, check if it conflicts
 * with any existing events that happen AFTER minute T involving the same player.
 * 
 * @param {string} gameId - Game ID
 * @param {Object} newEvent - New event being created
 * @param {string} newEvent.type - 'substitution' | 'card'
 * @param {number} newEvent.minute - Minute of the new event
 * @param {string} newEvent.playerId - Player ID (for cards or playerOut in substitutions)
 * @param {string} newEvent.playerOutId - Player ID going out (for substitutions)
 * @param {string} newEvent.cardType - Card type (for cards, only check if 'red' or 'second-yellow')
 * @returns {Promise<{valid: boolean, error: string|null}>}
 */
async function validateFutureConsistency(gameId, newEvent) {
  try {
    const { type, minute, playerId, playerOutId, cardType } = newEvent;
    
    // Only check for Sub Out and Red Cards (events that remove player from pitch)
    if (type === 'card') {
      // Only check red cards and second yellow (they send player off)
      if (cardType !== 'red' && cardType !== 'second-yellow') {
        return { valid: true, error: null }; // Yellow cards don't send off, skip check
      }
    } else if (type === 'substitution') {
      // Only check if playerOutId is provided (sub out)
      if (!playerOutId) {
        return { valid: true, error: null }; // Sub in doesn't remove player, skip check
      }
    } else {
      return { valid: true, error: null }; // Not a relevant event type
    }
    
    // Get the player ID to check
    const targetPlayerId = type === 'card' ? playerId : playerOutId;
    if (!targetPlayerId) {
      return { valid: true, error: null }; // No player to check
    }
    
    // Get timeline to check for future events
    const timeline = await getMatchTimeline(gameId);
    
    // Find all events involving this player AFTER the new event's minute
    const futureEvents = timeline.filter(event => {
      if (event.minute <= minute) {
        return false; // Only events after the new event
      }
      
      // Check if event involves the target player
      if (event.type === 'goal') {
        const scorerId = event.scorer?._id?.toString() || event.scorerId?.toString() || event.scorer?.toString();
        const assisterId = event.assister?._id?.toString() || event.assistedById?.toString() || event.assister?.toString();
        return scorerId === targetPlayerId || assisterId === targetPlayerId;
      }
      
      if (event.type === 'card') {
        const cardPlayerId = event.player?._id?.toString() || event.playerId?.toString() || event.player?.toString();
        return cardPlayerId === targetPlayerId;
      }
      
      if (event.type === 'substitution') {
        const playerOutId = event.playerOut?._id?.toString() || event.playerOutId?.toString() || event.playerOut?.toString();
        const playerInId = event.playerIn?._id?.toString() || event.playerInId?.toString() || event.playerIn?.toString();
        return playerOutId === targetPlayerId || playerInId === targetPlayerId;
      }
      
      return false;
    });
    
    if (futureEvents.length === 0) {
      return { valid: true, error: null }; // No conflicts
    }
    
    // Build detailed error message
    const conflicts = [];
    futureEvents.forEach(event => {
      if (event.type === 'goal') {
        const scorerId = event.scorer?._id?.toString() || event.scorerId?.toString() || event.scorer?.toString();
        const assisterId = event.assister?._id?.toString() || event.assistedById?.toString() || event.assister?.toString();
        if (scorerId === targetPlayerId) {
          conflicts.push(`scored a goal at minute ${event.minute}`);
        }
        if (assisterId === targetPlayerId) {
          conflicts.push(`assisted a goal at minute ${event.minute}`);
        }
      } else if (event.type === 'card') {
        conflicts.push(`received a ${event.cardType} card at minute ${event.minute}`);
      } else if (event.type === 'substitution') {
        const playerOutId = event.playerOut?._id?.toString() || event.playerOutId?.toString() || event.playerOut?.toString();
        const playerInId = event.playerIn?._id?.toString() || event.playerInId?.toString() || event.playerIn?.toString();
        if (playerOutId === targetPlayerId) {
          conflicts.push(`was substituted out at minute ${event.minute}`);
        }
        if (playerInId === targetPlayerId) {
          conflicts.push(`was substituted in at minute ${event.minute}`);
        }
      }
    });
    
    if (conflicts.length > 0) {
      const eventType = type === 'card' 
        ? `receive a ${cardType} card` 
        : 'be substituted out';
      const conflictList = conflicts.join(', ');
      return {
        valid: false,
        error: `Cannot ${eventType} at minute ${minute} because the player ${conflictList}. Please delete or modify the conflicting events first.`
      };
    }
    
    return { valid: true, error: null };
  } catch (error) {
    console.error('Error validating future consistency:', error);
    return {
      valid: false,
      error: `Validation error: ${error.message}`
    };
  }
}

module.exports = {
  PlayerState,
  getPlayerStateAtMinute,
  getStartingLineup,
  getSquadPlayers,
  getMatchTimeline,
  validateGoalEligibility,
  validateSubstitutionEligibility,
  validateCardEligibility,
  validateFutureConsistency
};

