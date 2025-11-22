const Substitution = require('../models/Substitution');
const Goal = require('../models/Goal');

/**
 * Recalculate match states for all substitutions in a game
 * This should be called when the game status changes to "Done"
 * 
 * Match state is calculated based on the score at the time of substitution:
 * - Winning: Our goals > Opponent goals at that minute
 * - Drawing: Our goals = Opponent goals at that minute
 * - Losing: Our goals < Opponent goals at that minute
 * 
 * @param {string} gameId - The game ID
 * @param {number} finalOurScore - Final score for our team
 * @param {number} finalOpponentScore - Final score for opponent
 */
async function recalculateSubstitutionAnalytics(gameId, finalOurScore, finalOpponentScore) {
  try {
    // Fetch all substitutions for this game
    const substitutions = await Substitution.find({ gameId })
      .populate('playerOutId', 'name')
      .populate('playerInId', 'name')
      .sort({ minute: 1 }); // Sort by minute chronologically

    if (substitutions.length === 0) {
      console.log(`No substitutions to recalculate for game ${gameId}`);
      return;
    }

    // Fetch all goals for this game (team goals and opponent goals)
    // Discriminators are stored in same collection, Goal.find() returns both types
    const allGoals = await Goal.find({ gameId })
      .sort({ minute: 1 });

    // Separate team goals and opponent goals using discriminator key
    const teamGoals = allGoals.filter(g => g.goalCategory === 'TeamGoal');
    const opponentGoals = allGoals.filter(g => g.goalCategory === 'OpponentGoal');

    console.log(`Recalculating analytics for ${substitutions.length} substitutions in game ${gameId} (${teamGoals.length} team goals, ${opponentGoals.length} opponent goals)`);

    // Calculate match states for each substitution
    const updates = [];
    
    for (const substitution of substitutions) {
      const substitutionMinute = substitution.minute;
      
      // Count our goals before this substitution minute
      const ourGoalsBeforeThis = teamGoals.filter(goal => goal.minute <= substitutionMinute).length;
      
      // Count opponent goals before this substitution minute (using actual minutes)
      const opponentGoalsBeforeThis = opponentGoals.filter(goal => goal.minute <= substitutionMinute).length;
      
      // Determine match state at the time of substitution
      let matchState;
      if (ourGoalsBeforeThis > opponentGoalsBeforeThis) {
        matchState = 'winning';
      } else if (ourGoalsBeforeThis < opponentGoalsBeforeThis) {
        matchState = 'losing';
      } else {
        matchState = 'drawing';
      }

      // Update the substitution
      substitution.matchState = matchState;
      updates.push(substitution.save());
      
      console.log(`Substitution at ${substitutionMinute}' (${substitution.playerOutId?.name} → ${substitution.playerInId?.name}): ${matchState} (Score: ${ourGoalsBeforeThis}-${opponentGoalsBeforeThis})`);
    }

    // Save all updates
    await Promise.all(updates);
    
    console.log(`✅ Successfully recalculated analytics for ${substitutions.length} substitutions`);
    return { success: true, substitutionsUpdated: substitutions.length };
    
  } catch (error) {
    console.error('Error recalculating substitution analytics:', error);
    throw error;
  }
}

module.exports = {
  recalculateSubstitutionAnalytics
};

