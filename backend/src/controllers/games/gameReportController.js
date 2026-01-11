const gameReportService = require('../../services/games/gameReportService');

/**
 * GET /api/game-reports
 * Get all game reports (filtered by playedInGame)
 */
exports.getAllGameReports = async (req, res, next) => {
  try {
    const gameReports = await gameReportService.getAllGameReports();

    res.json({
      success: true,
      data: gameReports
    });
  } catch (error) {
    console.error('Get game reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/game-reports/game/:gameId
 * Get game reports by game ID (filtered by playedInGame)
 */
exports.getGameReportsByGame = async (req, res, next) => {
  try {
    const gameReports = await gameReportService.getGameReportsByGame(req.params.gameId);

    res.json({
      success: true,
      data: gameReports
    });
  } catch (error) {
    console.error('Get game reports by game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/game-reports/:id
 * Get game report by ID
 */
exports.getGameReportById = async (req, res, next) => {
  try {
    const gameReport = await gameReportService.getGameReportById(req.params.id);

    res.json({
      success: true,
      data: gameReport
    });
  } catch (error) {
    console.error('Get game report error:', error);
    
    if (error.message === 'Game report not found') {
      return res.status(404).json({ error: 'Game report not found' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/game-reports
 * Create new game report
 */
exports.createGameReport = async (req, res, next) => {
  try {
    const gameReport = await gameReportService.createGameReport(req.body, req.user);

    res.status(201).json({
      success: true,
      data: gameReport
    });
  } catch (error) {
    console.error('Create game report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/game-reports/:id
 * Update game report
 */
exports.updateGameReport = async (req, res, next) => {
  try {
    const gameReport = await gameReportService.updateGameReport(req.params.id, req.body);

    res.json({
      success: true,
      data: gameReport
    });
  } catch (error) {
    console.error('Update game report error:', error);
    
    if (error.message === 'Game report not found') {
      return res.status(404).json({ error: 'Game report not found' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/game-reports/:id
 * Delete game report
 */
exports.deleteGameReport = async (req, res, next) => {
  try {
    await gameReportService.deleteGameReport(req.params.id);

    res.json({
      success: true,
      message: 'Game report deleted successfully'
    });
  } catch (error) {
    console.error('Delete game report error:', error);
    
    if (error.message === 'Game report not found') {
      return res.status(404).json({ error: 'Game report not found' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/game-reports/batch
 * Batch create/update game reports (for final submission)
 */
exports.batchUpdateGameReports = async (req, res, next) => {
  try {
    const { gameId, reports } = req.body;
    const results = await gameReportService.batchUpdateGameReports(gameId, reports, req.user);

    res.json({
      success: true,
      data: results,
      message: `Updated ${results.length} game reports`
    });
  } catch (error) {
    console.error('Batch update game reports error:', error);
    
    if (error.message.includes('Invalid request format')) {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.message.includes('Server-calculated fields')) {
      return res.status(400).json({ 
        error: error.message,
        details: error.details,
        message: 'The following fields are server-calculated and must not be sent: minutesPlayed, goals, assists'
      });
    }
    
    if (error.message.includes('Missing required field')) {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.message.includes('Failed to calculate')) {
      return res.status(500).json({ 
        error: error.message,
        message: error.message
      });
    }

    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

