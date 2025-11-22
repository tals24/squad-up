const Goal = require('../models/Goal');

/**
 * Calculate player goals and assists from Goals collection
 * Counts goals where scorerId = playerId and assists where assistedById = playerId
 * 
 * @param {string} gameId - The game ID
 * @returns {Object} Map of playerId -> { goals: number, assists: number }
 */
async function calculatePlayerGoalsAssists(gameId) {
  try {
    // Fetch all team goals for this game (exclude opponent goals)
    const teamGoals = await Goal.find({ 
      gameId,
      goalCategory: 'TeamGoal' // Only count team goals
    }).select('scorerId assistedById');

    if (teamGoals.length === 0) {
      console.log(`No team goals found for game ${gameId}`);
      return {};
    }

    // Initialize result map
    const playerStats = {};

    // Count goals and assists for each player
    teamGoals.forEach(goal => {
      // Count goals (scorerId)
      if (goal.scorerId) {
        const scorerId = goal.scorerId.toString();
        if (!playerStats[scorerId]) {
          playerStats[scorerId] = { goals: 0, assists: 0 };
        }
        playerStats[scorerId].goals += 1;
      }

      // Count assists (assistedById)
      if (goal.assistedById) {
        const assisterId = goal.assistedById.toString();
        if (!playerStats[assisterId]) {
          playerStats[assisterId] = { goals: 0, assists: 0 };
        }
        playerStats[assisterId].assists += 1;
      }
    });

    console.log(`✅ Calculated goals/assists for ${Object.keys(playerStats).length} players in game ${gameId}`);
    return playerStats;
  } catch (error) {
    console.error(`❌ Error calculating goals/assists for game ${gameId}:`, error);
    throw error;
  }
}

module.exports = { calculatePlayerGoalsAssists };

