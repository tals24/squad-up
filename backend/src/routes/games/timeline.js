/**
 * Game Timeline Routes
 * Handles match timeline and event sequences
 */

const express = require('express');
const { authenticateJWT, checkGameAccess } = require('../../middleware/jwtAuth');
const { getMatchTimeline } = require('../../services/games/utils/gameEventsAggregator');

const router = express.Router();

/**
 * Get match timeline
 * GET /api/games/:gameId/timeline
 */
router.get('/:gameId/timeline', authenticateJWT, checkGameAccess, async (req, res, next) => {
  try {
    const gameId = req.params.gameId;
    const timeline = await getMatchTimeline(gameId);
    
    res.json({
      success: true,
      data: timeline
    });
  } catch (error) {
    console.error('Get timeline error:', error);
    next(error);
  }
});

module.exports = router;

