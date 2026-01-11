const express = require('express');
const router = express.Router();
const { authenticateJWT, checkGameAccess } = require('../../middleware/jwtAuth');
const goalController = require('../../controllers/games/goalController');

// Apply authentication middleware to all routes
router.use(authenticateJWT);

/**
 * POST /api/games/:gameId/goals
 * Create a new goal for a game
 */
router.post('/:gameId/goals', checkGameAccess, goalController.createGoal);

/**
 * GET /api/games/:gameId/goals
 * Get all goals for a game
 */
router.get('/:gameId/goals', checkGameAccess, goalController.getAllGoals);

/**
 * PUT /api/games/:gameId/goals/:goalId
 * Update an existing goal
 */
router.put('/:gameId/goals/:goalId', checkGameAccess, goalController.updateGoal);

/**
 * DELETE /api/games/:gameId/goals/:goalId
 * Delete a goal
 */
router.delete('/:gameId/goals/:goalId', checkGameAccess, goalController.deleteGoal);

module.exports = router;

