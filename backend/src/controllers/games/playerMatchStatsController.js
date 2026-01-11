const playerMatchStatsService = require('../../services/games/playerMatchStatsService');

/**
 * GET /api/games/:gameId/player-match-stats
 * Get all player match stats for a game
 */
exports.getAllPlayerMatchStats = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const stats = await playerMatchStatsService.getAllPlayerMatchStats(gameId);

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
};

/**
 * GET /api/games/:gameId/player-match-stats/player/:playerId
 * Get player match stats for a specific player in a game
 */
exports.getPlayerMatchStatsByPlayer = async (req, res, next) => {
  try {
    const { gameId, playerId } = req.params;
    const stats = await playerMatchStatsService.getPlayerMatchStatsByPlayer(gameId, playerId);

    res.json({
      gameId,
      playerId,
      stats
    });
  } catch (error) {
    console.error('Error fetching player match stats:', error);
    
    if (error.message === 'Player match stats not found') {
      return res.status(404).json({ 
        message: 'Player match stats not found',
        gameId: req.params.gameId,
        playerId: req.params.playerId
      });
    }

    res.status(500).json({ 
      message: 'Failed to fetch player match stats', 
      error: error.message 
    });
  }
};

/**
 * PUT /api/games/:gameId/player-match-stats/player/:playerId
 * Update or create player match stats (upsert pattern)
 */
exports.updatePlayerMatchStats = async (req, res, next) => {
  try {
    const { gameId, playerId } = req.params;
    const stats = await playerMatchStatsService.updatePlayerMatchStats(gameId, playerId, req.body);

    res.json({
      message: 'Player match stats updated successfully',
      stats
    });
  } catch (error) {
    console.error('Error updating player match stats:', error);
    
    if (error.message === 'Player not found') {
      return res.status(404).json({ message: 'Player not found' });
    }

    res.status(500).json({ 
      message: 'Failed to update player match stats', 
      error: error.message 
    });
  }
};

