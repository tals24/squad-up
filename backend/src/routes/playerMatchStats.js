const express = require('express');
const router = express.Router();
const PlayerMatchStat = require('../models/PlayerMatchStat');
const Player = require('../models/Player');
const { authenticateJWT, checkGameAccess } = require('../middleware/jwtAuth');

// Apply authentication middleware to all routes
router.use(authenticateJWT);

/**
 * GET /api/games/:gameId/player-match-stats
 * Get all player match stats for a game
 */
router.get('/:gameId/player-match-stats', checkGameAccess, async (req, res) => {
  try {
    const { gameId } = req.params;

    // Get all player match stats for the game
    const stats = await PlayerMatchStat.find({ gameId })
      .populate('playerId', 'fullName kitNumber position')
      .sort({ 'playerId': 1 });

    res.json({
      gameId,
      totalStats: stats.length,
      stats
    });
  } catch (error) {
    console.error('Error fetching player match stats:', error);
    res.status(500).json({ 
      message: 'Failed to fetch player match stats', 
      error: error.message 
    });
  }
});

/**
 * GET /api/games/:gameId/player-match-stats/player/:playerId
 * Get player match stats for a specific player in a game
 */
router.get('/:gameId/player-match-stats/player/:playerId', checkGameAccess, async (req, res) => {
  try {
    const { gameId, playerId } = req.params;

    // Find stats for this player in this game
    const stats = await PlayerMatchStat.findOne({ gameId, playerId })
      .populate('playerId', 'fullName kitNumber position');

    if (!stats) {
      return res.status(404).json({ 
        message: 'Player match stats not found',
        gameId,
        playerId
      });
    }

    res.json({
      gameId,
      playerId,
      stats
    });
  } catch (error) {
    console.error('Error fetching player match stats:', error);
    res.status(500).json({ 
      message: 'Failed to fetch player match stats', 
      error: error.message 
    });
  }
});

/**
 * PUT /api/games/:gameId/player-match-stats/player/:playerId
 * Update or create player match stats (upsert pattern)
 */
router.put('/:gameId/player-match-stats/player/:playerId', checkGameAccess, async (req, res) => {
  try {
    const { gameId, playerId } = req.params;
    const { fouls, shooting, passing, duels } = req.body;

    // Validate player exists
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Build update object (only include fields that are provided)
    const updateData = {
      gameId,
      playerId
    };

    if (fouls !== undefined) {
      updateData.fouls = fouls;
    }
    if (shooting !== undefined) {
      updateData.shooting = shooting;
    }
    if (passing !== undefined) {
      updateData.passing = passing;
    }
    if (duels !== undefined) {
      updateData.duels = duels;
    }

    // Upsert stats (create if doesn't exist, update if exists)
    const stats = await PlayerMatchStat.findOneAndUpdate(
      { gameId, playerId },
      updateData,
      { upsert: true, new: true, runValidators: true }
    );

    await stats.populate('playerId', 'fullName kitNumber position');

    res.json({
      message: 'Player match stats updated successfully',
      stats
    });
  } catch (error) {
    console.error('Error updating player match stats:', error);
    res.status(500).json({ 
      message: 'Failed to update player match stats', 
      error: error.message 
    });
  }
});

module.exports = router;

