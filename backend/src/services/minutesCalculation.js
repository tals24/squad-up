const Game = require('../models/Game');
const GameRoster = require('../models/GameRoster');
const { getMatchTimeline } = require('./timelineService');

/**
 * Calculate player minutes from game events (substitutions and red cards)
 * Uses session-based algorithm: tracks play sessions for each player
 * 
 * @param {string} gameId - The game ID
 * @returns {Object} Map of playerId -> calculated minutes
 */
async function calculatePlayerMinutes(gameId) {
  try {
    // Fetch game to get match duration
    const game = await Game.findById(gameId);
    if (!game) {
      throw new Error(`Game ${gameId} not found`);
    }

    // Calculate total match duration
    const totalMatchDuration = game.totalMatchDuration || 
      (game.matchDuration?.regularTime || 90) +
      (game.matchDuration?.firstHalfExtraTime || 0) +
      (game.matchDuration?.secondHalfExtraTime || 0);

    // Fetch starting lineup from GameRoster
    const gameRosters = await GameRoster.find({ 
      game: gameId,
      status: 'Starting Lineup'
    }).populate('player', '_id fullName');

    if (gameRosters.length === 0) {
      console.log(`No starting lineup found for game ${gameId}`);
      return {};
    }

    if (gameRosters.length !== 11) {
      console.warn(`Warning: Starting lineup has ${gameRosters.length} players (expected 11) for game ${gameId}`);
    }

    // Fetch unified timeline from timeline service
    const timeline = await getMatchTimeline(gameId);
    
    // Filter events that affect minutes: substitutions and red cards
    const substitutions = timeline.filter(event => event.type === 'substitution');
    const redCards = timeline.filter(event => 
      event.type === 'card' && 
      (event.cardType === 'red' || event.cardType === 'second-yellow')
    );

    console.log(`Calculating minutes for game ${gameId}: ${gameRosters.length} starters, ${substitutions.length} substitutions, ${redCards.length} red cards`);

    // Initialize player sessions
    // Map: playerId -> array of sessions [{ startTime, endTime }]
    const playerSessions = new Map();

    // Initialize starting lineup players with full match session
    gameRosters.forEach(roster => {
      const playerId = roster.player._id.toString();
      playerSessions.set(playerId, [{
        startTime: 0,
        endTime: totalMatchDuration
      }]);
    });

    // Combine all events and sort chronologically
    const allEvents = [];
    
    substitutions.forEach(sub => {
      // Timeline service normalizes playerOut and playerIn (populated objects)
      // Handle both ObjectId and string formats
      const playerOutId = sub.playerOut?._id 
        ? sub.playerOut._id.toString() 
        : (sub.playerOut?.toString() || null);
      const playerInId = sub.playerIn?._id 
        ? sub.playerIn._id.toString() 
        : (sub.playerIn?.toString() || null);
      const playerOutName = sub.playerOut?.fullName || 'Unknown Player';
      const playerInName = sub.playerIn?.fullName || 'Unknown Player';
      
      if (!playerOutId || !playerInId) {
        console.warn(`Warning: Substitution at minute ${sub.minute} missing player IDs`);
        return;
      }
      
      allEvents.push({
        type: 'substitution',
        minute: sub.minute,
        playerOutId,
        playerInId,
        playerOutName,
        playerInName
      });
    });

    redCards.forEach(card => {
      // Timeline service normalizes player (populated object)
      // Handle both ObjectId and string formats
      const playerId = card.player?._id 
        ? card.player._id.toString() 
        : (card.player?.toString() || null);
      const playerName = card.player?.fullName || 'Unknown Player';
      
      if (!playerId) {
        console.warn(`Warning: Red card at minute ${card.minute} missing player ID`);
        return;
      }
      
      allEvents.push({
        type: 'redCard',
        minute: card.minute,
        playerId,
        playerName
      });
    });

    // Timeline is already sorted chronologically, but sort events by minute to be safe
    allEvents.sort((a, b) => a.minute - b.minute);

    // Validate events are in valid order (no duplicate minutes for same player)
    validateEventOrder(allEvents);

    // Process events chronologically
    for (const event of allEvents) {
      if (event.type === 'substitution') {
        // End playerOut session at substitution minute
        const playerOutSessions = playerSessions.get(event.playerOutId);
        if (playerOutSessions && playerOutSessions.length > 0) {
          // Find the active session (endTime is still totalMatchDuration)
          const activeSessionIndex = playerOutSessions.findIndex(
            session => session.endTime === totalMatchDuration
          );
          
          if (activeSessionIndex !== -1) {
            // Update endTime to substitution minute
            playerOutSessions[activeSessionIndex].endTime = event.minute;
            console.log(`Substitution at ${event.minute}': ${event.playerOutName} out (session ended)`);
          } else {
            console.warn(`Warning: Player ${event.playerOutName} not on field at minute ${event.minute} (substitution)`);
          }
        } else {
          console.warn(`Warning: Player ${event.playerOutName} not in starting lineup but being subbed out at minute ${event.minute}`);
        }

        // Create new session for playerIn starting at substitution minute
        const playerInSessions = playerSessions.get(event.playerInId) || [];
        playerInSessions.push({
          startTime: event.minute,
          endTime: totalMatchDuration
        });
        playerSessions.set(event.playerInId, playerInSessions);
        console.log(`Substitution at ${event.minute}': ${event.playerInName} in (session started)`);

      } else if (event.type === 'redCard') {
        // End player session at red card minute (only if player is on field)
        const playerSessionsArray = playerSessions.get(event.playerId);
        if (playerSessionsArray && playerSessionsArray.length > 0) {
          // Find the active session (endTime is still totalMatchDuration)
          const activeSessionIndex = playerSessionsArray.findIndex(
            session => session.endTime === totalMatchDuration
          );
          
          if (activeSessionIndex !== -1) {
            // Update endTime to red card minute
            playerSessionsArray[activeSessionIndex].endTime = event.minute;
            console.log(`Red card at ${event.minute}': ${event.playerName} ejected (session ended)`);
          } else {
            console.warn(`Warning: Player ${event.playerName} not on field at minute ${event.minute} (red card - ignoring)`);
          }
        } else {
          console.warn(`Warning: Player ${event.playerName} not in starting lineup but received red card at minute ${event.minute}`);
        }
      }
    }

    // Calculate total minutes for each player
    const calculatedMinutes = {};
    
    // Calculate for all players who have sessions (starters + substitutes)
    playerSessions.forEach((sessions, playerId) => {
      const totalMinutes = sessions.reduce((sum, session) => {
        return sum + (session.endTime - session.startTime);
      }, 0);
      
      calculatedMinutes[playerId] = Math.round(totalMinutes); // Round to nearest minute
    });

    // Also include players from roster who might not have sessions (bench players with 0 minutes)
    const allRosters = await GameRoster.find({ game: gameId }).populate('player', '_id');
    allRosters.forEach(roster => {
      const playerId = roster.player._id.toString();
      if (!calculatedMinutes.hasOwnProperty(playerId)) {
        calculatedMinutes[playerId] = 0; // Bench players with no substitutions = 0 minutes
      }
    });

    console.log(`✅ Calculated minutes for ${Object.keys(calculatedMinutes).length} players`);
    return calculatedMinutes;

  } catch (error) {
    console.error('Error calculating player minutes:', error);
    throw error;
  }
}

/**
 * Validate that events are in valid chronological order
 * Checks for duplicate events at same minute for same player
 */
function validateEventOrder(events) {
  const playerEventsByMinute = new Map();
  
  for (const event of events) {
    const key = `${event.minute}-${event.type === 'substitution' ? event.playerOutId : event.playerId}`;
    
    if (playerEventsByMinute.has(key)) {
      console.warn(`Warning: Duplicate event at minute ${event.minute} for player`);
    }
    
    playerEventsByMinute.set(key, event);
  }
}

/**
 * Recalculate player minutes for a game and optionally update GameReports
 * This is called when events change (substitutions, red cards)
 * 
 * @param {string} gameId - The game ID
 * @param {boolean} updateReports - Whether to update GameReport documents (default: false)
 * @returns {Object} Map of playerId -> calculated minutes
 */
async function recalculatePlayerMinutes(gameId, updateReports = false) {
  try {
    const calculatedMinutes = await calculatePlayerMinutes(gameId);
    
    // Optionally update GameReport documents
    if (updateReports) {
      const GameReport = require('../models/GameReport');
      
      for (const [playerId, minutes] of Object.entries(calculatedMinutes)) {
        await GameReport.updateMany(
          { 
            game: gameId,
            player: playerId
          },
          {
            $set: {
              minutesPlayed: minutes,
              minutesCalculationMethod: 'calculated'
            }
          }
        );
      }
      
      console.log(`✅ Updated GameReports with calculated minutes for game ${gameId}`);
    }
    
    return calculatedMinutes;
  } catch (error) {
    console.error('Error recalculating player minutes:', error);
    throw error;
  }
}

module.exports = {
  calculatePlayerMinutes,
  recalculatePlayerMinutes
};

