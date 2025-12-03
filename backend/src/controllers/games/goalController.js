const goalService = require('../../services/games/goalService');

/**
 * POST /api/games/:gameId/goals
 * Create a new goal for a game
 */
exports.createGoal = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const goal = await goalService.createGoal(gameId, req.body);

    res.status(201).json({
      message: 'Goal created successfully',
      goal
    });
  } catch (error) {
    console.error('Error creating goal:', error);
    
    // Handle specific errors
    if (error.message.includes('not found') || error.message.includes('required')) {
      return res.status(400).json({ 
        message: 'Failed to create goal', 
        error: error.message 
      });
    }
    
    if (error.message.includes('Invalid goal assignment')) {
      return res.status(400).json({
        message: 'Invalid goal assignment',
        error: error.message.replace('Invalid goal assignment: ', '')
      });
    }

    res.status(500).json({ 
      message: 'Failed to create goal', 
      error: error.message 
    });
  }
};

/**
 * GET /api/games/:gameId/goals
 * Get all goals for a game
 */
exports.getAllGoals = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const goals = await goalService.getAllGoals(gameId);

    res.json({
      gameId,
      totalGoals: goals.length,
      goals
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ 
      message: 'Failed to fetch goals', 
      error: error.message 
    });
  }
};

/**
 * PUT /api/games/:gameId/goals/:goalId
 * Update an existing goal
 */
exports.updateGoal = async (req, res, next) => {
  try {
    const { gameId, goalId } = req.params;
    const goal = await goalService.updateGoal(gameId, goalId, req.body);

    res.json({
      message: 'Goal updated successfully',
      goal
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    
    // Handle specific errors
    if (error.message === 'Goal not found') {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    
    if (error.message.includes('Invalid goal assignment')) {
      return res.status(400).json({
        message: 'Invalid goal assignment',
        error: error.message.replace('Invalid goal assignment: ', '')
      });
    }

    res.status(500).json({ 
      message: 'Failed to update goal', 
      error: error.message 
    });
  }
};

/**
 * DELETE /api/games/:gameId/goals/:goalId
 * Delete a goal
 */
exports.deleteGoal = async (req, res, next) => {
  try {
    const { gameId, goalId } = req.params;
    await goalService.deleteGoal(gameId, goalId);

    res.json({
      message: 'Goal deleted successfully',
      goalId
    });
  } catch (error) {
    console.error('Error deleting goal:', error);
    
    if (error.message === 'Goal not found') {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.status(500).json({ 
      message: 'Failed to delete goal', 
      error: error.message 
    });
  }
};

