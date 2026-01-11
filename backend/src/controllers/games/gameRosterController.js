const gameRosterService = require('../../services/games/gameRosterService');

/**
 * GET /api/game-rosters
 * Get all game rosters
 */
exports.getAllGameRosters = async (req, res, next) => {
  try {
    const gameRosters = await gameRosterService.getAllGameRosters();

    res.json({
      success: true,
      data: gameRosters
    });
  } catch (error) {
    console.error('Get game rosters error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/game-rosters/game/:gameId
 * Get game rosters by game ID
 */
exports.getGameRostersByGame = async (req, res, next) => {
  try {
    const gameRosters = await gameRosterService.getGameRostersByGame(req.params.gameId);

    res.json({
      success: true,
      data: gameRosters
    });
  } catch (error) {
    console.error('Get game rosters by game ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/game-rosters/:id
 * Get game roster by ID
 */
exports.getGameRosterById = async (req, res, next) => {
  try {
    const gameRoster = await gameRosterService.getGameRosterById(req.params.id);

    res.json({
      success: true,
      data: gameRoster
    });
  } catch (error) {
    console.error('Get game roster error:', error);
    
    if (error.message === 'Game roster not found') {
      return res.status(404).json({ error: 'Game roster not found' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/game-rosters
 * Create new game roster entry
 */
exports.createGameRoster = async (req, res, next) => {
  try {
    const gameRoster = await gameRosterService.createGameRoster(req.body);

    res.status(201).json({
      success: true,
      data: gameRoster
    });
  } catch (error) {
    console.error('Create game roster error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/game-rosters/:id
 * Update game roster
 */
exports.updateGameRoster = async (req, res, next) => {
  try {
    const gameRoster = await gameRosterService.updateGameRoster(req.params.id, req.body);

    res.json({
      success: true,
      data: gameRoster
    });
  } catch (error) {
    console.error('Update game roster error:', error);
    
    if (error.message === 'Game roster not found') {
      return res.status(404).json({ error: 'Game roster not found' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/game-rosters/:id
 * Delete game roster
 */
exports.deleteGameRoster = async (req, res, next) => {
  try {
    await gameRosterService.deleteGameRoster(req.params.id);

    res.json({
      success: true,
      message: 'Game roster deleted successfully'
    });
  } catch (error) {
    console.error('Delete game roster error:', error);
    
    if (error.message === 'Game roster not found') {
      return res.status(404).json({ error: 'Game roster not found' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

