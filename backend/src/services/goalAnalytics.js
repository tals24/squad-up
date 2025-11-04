const Goal = require('../models/Goal');

/**
 * Recalculate goal numbers and match states for all goals in a game
 * This should be called when the game status changes to "Done"
 * 
 * @param {string} gameId - The game ID
 * @param {number} finalOurScore - Final score for our team
 * @param {number} finalOpponentScore - Final score for opponent
 */
async function recalculateGoalAnalytics(gameId, finalOurScore, finalOpponentScore) {
  try {
    // Fetch all goals for this game (team goals and opponent goals)
    // Discriminators are stored in same collection, Goal.find() returns both types
    const allGoals = await Goal.find({ gameId })
      .populate('scorerId', 'name')
      .sort({ minute: 1 }); // Sort by minute chronologically

    // Separate team goals and opponent goals using discriminator key
    const teamGoals = allGoals.filter(g => g.goalCategory === 'TeamGoal');
    const opponentGoals = allGoals.filter(g => g.goalCategory === 'OpponentGoal');

    if (teamGoals.length === 0) {
      console.log(`No team goals to recalculate for game ${gameId}`);
      return;
    }

    console.log(`Recalculating analytics for ${teamGoals.length} team goals and ${opponentGoals.length} opponent goals in game ${gameId}`);

    // Calculate goal numbers and match states for team goals
    const updates = [];
    
    for (let i = 0; i < teamGoals.length; i++) {
      const goal = teamGoals[i];
      const goalNumber = i + 1; // Chronological order (1, 2, 3, ...)
      
      // Calculate match state at the time of this goal
      // Count our goals BEFORE this one
      const ourGoalsBeforeThis = i; // Goals scored before this one (0-indexed)
      
      // Count opponent goals BEFORE this goal's minute
      const opponentGoalsBeforeThis = opponentGoals.filter(
        og => og.minute <= goal.minute
      ).length;
      
      // Determine match state
      let matchState;
      if (ourGoalsBeforeThis > opponentGoalsBeforeThis) {
        matchState = 'winning';
      } else if (ourGoalsBeforeThis < opponentGoalsBeforeThis) {
        matchState = 'losing';
      } else {
        matchState = 'drawing';
      }

      // Update the goal
      goal.goalNumber = goalNumber;
      goal.matchState = matchState;
      
      updates.push(goal.save());
      
      console.log(`Goal ${goalNumber} at ${goal.minute}' by ${goal.scorerId?.name}: ${matchState} (Opponent: ${opponentGoalsBeforeThis})`);
    }

    // Save all updates
    await Promise.all(updates);
    
    console.log(`✅ Successfully recalculated analytics for ${teamGoals.length} team goals`);
    return { success: true, goalsUpdated: teamGoals.length };
    
  } catch (error) {
    console.error('Error recalculating goal analytics:', error);
    throw error;
  }
}

module.exports = {
  recalculateGoalAnalytics
};

