const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const Substitution = require('../models/Substitution');
const Card = require('../models/Card'); // Replaced DisciplinaryAction
const Game = require('../models/Game');
const Player = require('../models/Player');
const { authenticateJWT } = require('../middleware/jwtAuth');

// Apply authentication middleware to all routes
router.use(authenticateJWT);

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

/**
 * GET /api/analytics/player-substitutions
 * Get substitution patterns for a specific player
 * Query params: playerId, season (optional)
 */
router.get('/player-substitutions', async (req, res) => {
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

    // Build substitution filter
    const subOutFilter = { playerOutId: playerId };
    const subInFilter = { playerInId: playerId };
    if (gameIds) {
      subOutFilter.gameId = { $in: gameIds };
      subInFilter.gameId = { $in: gameIds };
    }

    // Get substitutions where player came off
    const subsOff = await Substitution.find(subOutFilter)
      .populate('playerInId', 'name position')
      .populate('gameId', 'date');

    // Get substitutions where player came on
    const subsOn = await Substitution.find(subInFilter)
      .populate('playerOutId', 'name position')
      .populate('gameId', 'date');

    // Calculate statistics
    const stats = {
      playerId,
      season: season || 'all',
      totalSubstitutions: subsOff.length + subsOn.length,
      timesSubbedOff: subsOff.length,
      timesComingOn: subsOn.length,
      avgSubOffMinute: 0,
      avgSubOnMinute: 0,
      substitutionReasons: {},
      impactAsSubstitute: {
        appearances: subsOn.length,
        avgMinutesPlayed: 0
      }
    };

    // Calculate average substitution minutes
    if (subsOff.length > 0) {
      const totalMinutes = subsOff.reduce((sum, sub) => sum + sub.minute, 0);
      stats.avgSubOffMinute = Math.round(totalMinutes / subsOff.length);
    }

    if (subsOn.length > 0) {
      const totalMinutes = subsOn.reduce((sum, sub) => sum + sub.minute, 0);
      stats.avgSubOnMinute = Math.round(totalMinutes / subsOn.length);
      
      // Calculate average minutes played as substitute
      const avgMinutesPlayed = subsOn.reduce((sum, sub) => {
        const minutesPlayed = 90 - sub.minute; // Simplified, assumes 90 min games
        return sum + minutesPlayed;
      }, 0) / subsOn.length;
      stats.impactAsSubstitute.avgMinutesPlayed = Math.round(avgMinutesPlayed);
    }

    // Group by substitution reason (when subbed off)
    subsOff.forEach(sub => {
      stats.substitutionReasons[sub.reason] = (stats.substitutionReasons[sub.reason] || 0) + 1;
    });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching player substitutions:', error);
    res.status(500).json({ 
      message: 'Failed to fetch player substitutions', 
      error: error.message 
    });
  }
});

/**
 * GET /api/analytics/team-discipline
 * Get team discipline statistics
 * Query params: teamId, season (optional)
 */
router.get('/team-discipline', async (req, res) => {
  try {
    const { teamId, season } = req.query;

    if (!teamId) {
      return res.status(400).json({ message: 'teamId is required' });
    }

    // Build game filter
    const gameFilter = { teamId };
    if (season) {
      const seasonYear = parseInt(season.split('-')[0]);
      const seasonStart = new Date(seasonYear, 0, 1);
      const seasonEnd = new Date(seasonYear + 1, 0, 1);
      gameFilter.date = { $gte: seasonStart, $lt: seasonEnd };
    }

    // Get all games for the team
    const games = await Game.find(gameFilter).select('_id');
    const gameIds = games.map(g => g._id);

    // Get all cards for these games
    const actions = await Card.find({
      gameId: { $in: gameIds }
    }).populate('playerId', 'name position');

    // Calculate statistics
    const stats = {
      teamId,
      season: season || 'all',
      totalYellowCards: 0,
      totalRedCards: 0,
      totalSecondYellows: 0,
      mostCardedPlayers: [],
      cardsByMinute: {}
    };

    // Count cards by type
    const playerCards = {};
    actions.forEach(action => {
      if (action.cardType === 'yellow') stats.totalYellowCards++;
      if (action.cardType === 'red') stats.totalRedCards++;
      if (action.cardType === 'second-yellow') stats.totalSecondYellows++;

      // Track per player
      const playerId = action.playerId._id.toString();
      if (!playerCards[playerId]) {
        playerCards[playerId] = {
          player: {
            id: action.playerId._id,
            name: action.playerId.name,
            position: action.playerId.position
          },
          yellowCards: 0,
          redCards: 0,
          secondYellows: 0,
          totalCards: 0
        };
      }

      if (action.cardType === 'yellow') playerCards[playerId].yellowCards++;
      if (action.cardType === 'red') playerCards[playerId].redCards++;
      if (action.cardType === 'second-yellow') playerCards[playerId].secondYellows++;
      playerCards[playerId].totalCards++;

      // Track by minute ranges
      const minuteRange = `${Math.floor(action.minute / 15) * 15}-${Math.floor(action.minute / 15) * 15 + 15}`;
      stats.cardsByMinute[minuteRange] = (stats.cardsByMinute[minuteRange] || 0) + 1;
    });

    // Sort players by total cards
    stats.mostCardedPlayers = Object.values(playerCards)
      .sort((a, b) => b.totalCards - a.totalCards)
      .slice(0, 10); // Top 10

    res.json(stats);
  } catch (error) {
    console.error('Error fetching team discipline:', error);
    res.status(500).json({ 
      message: 'Failed to fetch team discipline', 
      error: error.message 
    });
  }
});

module.exports = router;

