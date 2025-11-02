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
    // Fetch all goals for this game
    const goals = await Goal.find({ gameId })
      .populate('scorerId', 'name')
      .sort({ minute: 1 }); // Sort by minute chronologically

    if (goals.length === 0) {
      console.log(`No goals to recalculate for game ${gameId}`);
      return;
    }

    console.log(`Recalculating analytics for ${goals.length} goals in game ${gameId}`);

    // Calculate goal numbers and match states
    const updates = [];
    
    for (let i = 0; i < goals.length; i++) {
      const goal = goals[i];
      const goalNumber = i + 1; // Chronological order (1, 2, 3, ...)
      
      // Calculate match state at the time of this goal
      // Count our goals BEFORE this one
      const ourGoalsBeforeThis = i; // Goals scored before this one (0-indexed)
      
      // We don't track opponent goal minutes, so we need to estimate
      // Assume opponent goals are distributed evenly throughout the match
      // This is a simplification - in the future, you could track opponent goal minutes
      const totalMinutes = goal.minute;
      const estimatedOpponentGoalsBeforeThis = Math.floor(
        (finalOpponentScore * totalMinutes) / 90 // Assume 90 min match
      );
      
      // Determine match state
      let matchState;
      if (ourGoalsBeforeThis > estimatedOpponentGoalsBeforeThis) {
        matchState = 'winning';
      } else if (ourGoalsBeforeThis < estimatedOpponentGoalsBeforeThis) {
        matchState = 'losing';
      } else {
        matchState = 'drawing';
      }

      // Update the goal
      goal.goalNumber = goalNumber;
      goal.matchState = matchState;
      
      updates.push(goal.save());
      
      console.log(`Goal ${goalNumber} at ${goal.minute}' by ${goal.scorerId?.name}: ${matchState}`);
    }

    // Save all updates
    await Promise.all(updates);
    
    console.log(`✅ Successfully recalculated analytics for ${goals.length} goals`);
    return { success: true, goalsUpdated: goals.length };
    
  } catch (error) {
    console.error('Error recalculating goal analytics:', error);
    throw error;
  }
}

module.exports = {
  recalculateGoalAnalytics
};

