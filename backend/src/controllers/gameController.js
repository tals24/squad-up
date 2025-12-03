/**
 * Game Controller
 * Handles HTTP requests and responses for game-related endpoints
 * Orchestrates calls to services and formats responses
 */

const gameService = require('../services/gameService');

/**
 * Get all games with role-based filtering
 * GET /api/games
 */
exports.getAllGames = async (req, res, next) => {
  try {
    const user = req.user;
    const games = await gameService.getAllGames(user);
    
    res.json({
      success: true,
      data: games
    });
  } catch (error) {
    console.error('Get games controller error:', error);
    next(error);
  }
};

/**
 * Get game by ID
 * GET /api/games/:id
 */
exports.getGameById = async (req, res, next) => {
  try {
    // Game is already fetched and validated by checkGameAccess middleware
    const game = req.game;
    
    // Populate team if not already populated
    const populatedGame = await gameService.populateGameTeam(game);
    
    res.json({
      success: true,
      data: populatedGame
    });
  } catch (error) {
    console.error('Get game controller error:', error);
    next(error);
  }
};

/**
 * Create new game
 * POST /api/games
 */
exports.createGame = async (req, res, next) => {
  try {
    const gameData = req.body;
    const game = await gameService.createGame(gameData);
    
    res.status(201).json({
      success: true,
      data: game,
      message: 'Game created successfully'
    });
  } catch (error) {
    console.error('Create game controller error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: error.message 
      });
    }
    next(error);
  }
};

/**
 * Update game
 * PUT /api/games/:id
 */
exports.updateGame = async (req, res, next) => {
  try {
    const gameId = req.params.id;
    const updateData = req.body;
    
    const updatedGame = await gameService.updateGame(gameId, updateData);
    
    res.json({
      success: true,
      data: updatedGame
    });
  } catch (error) {
    console.error('Update game controller error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: error.message 
      });
    }
    next(error);
  }
};

/**
 * Delete game
 * DELETE /api/games/:id
 */
exports.deleteGame = async (req, res, next) => {
  try {
    const gameId = req.params.id;
    await gameService.deleteGame(gameId);
    
    res.json({
      success: true,
      message: 'Game deleted successfully'
    });
  } catch (error) {
    console.error('Delete game controller error:', error);
    if (error.message === 'Game not found') {
      return res.status(404).json({ error: 'Game not found' });
    }
    next(error);
  }
};

/**
 * Start game (move from Scheduled to Played with lineup)
 * POST /api/games/:id/start-game
 */
exports.startGame = async (req, res, next) => {
  try {
    const gameId = req.params.id;
    const { rosters, formation, formationType } = req.body;
    
    const result = await gameService.startGame(gameId, { rosters, formation, formationType });
    
    res.json({
      success: true,
      game: result.game,
      gameRosters: result.gameRosters,
      message: 'Game started successfully'
    });
  } catch (error) {
    console.error('Start game controller error:', error);
    if (error.message.includes('not found') || error.message.includes('Invalid')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * Get game draft (lineup or report)
 * GET /api/games/:id/draft
 */
exports.getGameDraft = async (req, res, next) => {
  try {
    const gameId = req.params.id;
    const draft = await gameService.getGameDraft(gameId);
    
    res.json({
      success: true,
      data: draft
    });
  } catch (error) {
    console.error('Get game draft controller error:', error);
    if (error.message === 'Game not found') {
      return res.status(404).json({ error: 'Game not found' });
    }
    next(error);
  }
};

/**
 * Update game draft (lineup or report)
 * PUT /api/games/:id/draft
 */
exports.updateGameDraft = async (req, res, next) => {
  try {
    const gameId = req.params.id;
    const draftData = req.body;
    
    const updatedGame = await gameService.updateGameDraft(gameId, draftData);
    
    res.json({
      success: true,
      data: updatedGame,
      message: 'Draft saved successfully'
    });
  } catch (error) {
    console.error('Update game draft controller error:', error);
    if (error.message === 'Game not found') {
      return res.status(404).json({ error: 'Game not found' });
    }
    next(error);
  }
};

/**
 * Submit final report (move from Played to Done)
 * POST /api/games/:id/submit-report
 */
exports.submitFinalReport = async (req, res, next) => {
  try {
    const gameId = req.params.id;
    const reportData = req.body;
    
    const result = await gameService.submitFinalReport(gameId, reportData);
    
    res.json({
      success: true,
      game: result.game,
      message: 'Final report submitted successfully. Game marked as Done.'
    });
  } catch (error) {
    console.error('Submit final report controller error:', error);
    if (error.message.includes('not found') || error.message.includes('Invalid') || error.message.includes('required')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

