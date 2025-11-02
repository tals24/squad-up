const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const Game = require('../models/Game');
const Player = require('../models/Player');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * GET /api/analytics/goal-partnerships
 * Get goal partnerships (scorer-assister combinations)
 * Query params: teamId, season (optional)
 */
router.get('/goal-partnerships', async (req, res) => {
  try {
    const { teamId, season } = req.query;

    if (!teamId) {
      return res.status(400).json({ message: 'teamId is required' });
    }

    // Build game filter
    const gameFilter = { teamId };
    if (season) {
      // Assuming season is in format "2024" or "2024-2025"
      const seasonYear = parseInt(season.split('-')[0]);
      const seasonStart = new Date(seasonYear, 0, 1); // Jan 1
      const seasonEnd = new Date(seasonYear + 1, 0, 1); // Jan 1 next year
      gameFilter.date = { $gte: seasonStart, $lt: seasonEnd };
    }

    // Get all games for the team
    const games = await Game.find(gameFilter).select('_id');
    const gameIds = games.map(g => g._id);

    // Get all goals with assists for these games
    const goals = await Goal.find({
      gameId: { $in: gameIds },
      assistedById: { $ne: null }
    })
      .populate('scorerId', 'name position')
      .populate('assistedById', 'name position')
      .populate('gameId', '_id date');

    // Group by scorer-assister pairs
    const partnerships = {};

    for (const goal of goals) {
      const scorerId = goal.scorerId._id.toString();
      const assisterId = goal.assistedById._id.toString();
      const pairKey = `${scorerId}-${assisterId}`;

      if (!partnerships[pairKey]) {
        partnerships[pairKey] = {
          scorer: {
            id: goal.scorerId._id,
            name: goal.scorerId.name,
            position: goal.scorerId.position
          },
          assister: {
            id: goal.assistedById._id,
            name: goal.assistedById.name,
            position: goal.assistedById.position
          },
          goals: 0,
          games: [],
          minutes: []
        };
      }

      partnerships[pairKey].goals++;
      if (!partnerships[pairKey].games.includes(goal.gameId._id.toString())) {
        partnerships[pairKey].games.push(goal.gameId._id.toString());
      }
      partnerships[pairKey].minutes.push(goal.minute);
    }

    // Convert to array and calculate average minute
    const partnershipsArray = Object.values(partnerships).map(p => ({
      ...p,
      avgMinute: p.minutes.reduce((a, b) => a + b, 0) / p.minutes.length,
      gameCount: p.games.length,
      // Remove the raw minutes and games arrays from response
      minutes: undefined,
      games: undefined
    }));

    // Sort by number of goals (descending)
    partnershipsArray.sort((a, b) => b.goals - a.goals);

    res.json({
      teamId,
      season: season || 'all',
      totalPartnerships: partnershipsArray.length,
      partnerships: partnershipsArray
    });
  } catch (error) {
    console.error('Error fetching goal partnerships:', error);
    res.status(500).json({ 
      message: 'Failed to fetch goal partnerships', 
      error: error.message 
    });
  }
});

/**
 * GET /api/analytics/player-goals
 * Get goal statistics for a specific player
 * Query params: playerId, season (optional)
 */
router.get('/player-goals', async (req, res) => {
  try {
    const { playerId, season } = req.query;

    if (!playerId) {
      return res.status(400).json({ message: 'playerId is required' });
    }

    // Build game filter if season is provided
    let gameIds = null;
    if (season) {
      const seasonYear = parseInt(season.split('-')[0]);
      const seasonStart = new Date(seasonYear, 0, 1);
      const seasonEnd = new Date(seasonYear + 1, 0, 1);
      const games = await Game.find({
        date: { $gte: seasonStart, $lt: seasonEnd }
      }).select('_id');
      gameIds = games.map(g => g._id);
    }

    // Build goal filter
    const goalFilter = { scorerId: playerId };
    if (gameIds) {
      goalFilter.gameId = { $in: gameIds };
    }

    // Get goals scored
    const goalsScored = await Goal.find(goalFilter)
      .populate('assistedById', 'name')
      .populate('gameId', 'date opponent');

    // Get assists
    const assistFilter = { assistedById: playerId };
    if (gameIds) {
      assistFilter.gameId = { $in: gameIds };
    }

    const assists = await Goal.find(assistFilter)
      .populate('scorerId', 'name')
      .populate('gameId', 'date opponent');

    // Calculate statistics
    const stats = {
      playerId,
      season: season || 'all',
      goalsScored: goalsScored.length,
      assists: assists.length,
      goalContributions: goalsScored.length + assists.length,
      goalsByType: {},
      goalsByMatchState: {},
      averageGoalMinute: 0
    };

    // Group by goal type
    goalsScored.forEach(goal => {
      stats.goalsByType[goal.goalType] = (stats.goalsByType[goal.goalType] || 0) + 1;
    });

    // Group by match state
    goalsScored.forEach(goal => {
      stats.goalsByMatchState[goal.matchState] = (stats.goalsByMatchState[goal.matchState] || 0) + 1;
    });

    // Calculate average goal minute
    if (goalsScored.length > 0) {
      const totalMinutes = goalsScored.reduce((sum, goal) => sum + goal.minute, 0);
      stats.averageGoalMinute = Math.round(totalMinutes / goalsScored.length);
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching player goals:', error);
    res.status(500).json({ 
      message: 'Failed to fetch player goals', 
      error: error.message 
    });
  }
});

module.exports = router;

