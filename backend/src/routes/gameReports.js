const express = require('express');
const { authenticateJWT, checkGameAccess } = require('../middleware/jwtAuth');
const GameReport = require('../models/GameReport');
const Game = require('../models/Game');
const GameRoster = require('../models/GameRoster');
const { calculatePlayerMinutes } = require('../services/minutesCalculation');
const { calculatePlayerGoalsAssists } = require('../services/goalsAssistsCalculation');

/**
 * Special middleware for routes that have gameId in request body instead of params
 * This temporarily sets gameId in params so checkGameAccess can be reused
 */
const checkGameAccessFromBody = async (req, res, next) => {
  try {
    const { gameId } = req.body;
    
    if (!gameId) {
      return res.status(400).json({
        success: false,
        error: 'Game ID is required in request body'
      });
    }
    
    // Temporarily set gameId in params for checkGameAccess
    req.params.gameId = gameId;
    
    // Call the main checkGameAccess middleware
    return checkGameAccess(req, res, next);
  } catch (error) {
    console.error('Game access check from body error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during access check'
    });
  }
};

const router = express.Router();

// Get all game reports (filtered by playedInGame)
router.get('/', authenticateJWT, async (req, res) => {
  try {
    // Get all GameRoster entries where playedInGame is true
    const playedRosters = await GameRoster.find({ playedInGame: true })
      .select('game player')
      .lean();
    
    // Create a Set of player-game combinations that played
    const playedPlayerGameSet = new Set();
    playedRosters.forEach(roster => {
      const key = `${roster.game.toString()}-${roster.player.toString()}`;
      playedPlayerGameSet.add(key);
    });

    // Fetch all game reports
    const allGameReports = await GameReport.find()
      .populate('player', 'fullName kitNumber position')
      .populate('game', 'gameTitle opponent date')
      .populate('author', 'fullName role')
      .lean();

    // Filter reports to only include players who played
    const gameReports = allGameReports.filter(report => {
      const gameId = typeof report.game === 'object' ? report.game._id.toString() : report.game.toString();
      const playerId = typeof report.player === 'object' ? report.player._id.toString() : report.player.toString();
      const key = `${gameId}-${playerId}`;
      return playedPlayerGameSet.has(key);
    });

    // Sort by date descending
    gameReports.sort((a, b) => {
      const dateA = a.game?.date || a.createdAt || new Date(0);
      const dateB = b.game?.date || b.createdAt || new Date(0);
      return new Date(dateB) - new Date(dateA);
    });

    res.json({
      success: true,
      data: gameReports
    });
  } catch (error) {
    console.error('Get game reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get game reports by game ID (filtered by playedInGame)
router.get('/game/:gameId', authenticateJWT, checkGameAccess, async (req, res) => {
  try {
    const gameId = req.params.gameId;
    
    // Get GameRoster entries for this game where playedInGame is true
    const playedRosters = await GameRoster.find({ 
      game: gameId, 
      playedInGame: true 
    })
      .select('player')
      .lean();
    
    const playedPlayerIds = playedRosters.map(roster => roster.player.toString());

    // Fetch game reports for this game, filtered to only players who played
    const gameReports = await GameReport.find({ 
      game: gameId,
      player: { $in: playedPlayerIds }
    })
      .populate('player', 'fullName kitNumber position')
      .populate('game', 'gameTitle opponent date')
      .populate('author', 'fullName role')
      .sort({ 'player.fullName': 1 });

    res.json({
      success: true,
      data: gameReports
    });
  } catch (error) {
    console.error('Get game reports by game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get game report by ID
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const gameReport = await GameReport.findById(req.params.id)
      .populate('player', 'fullName kitNumber position')
      .populate('game', 'gameTitle opponent date')
      .populate('author', 'fullName role');

    if (!gameReport) {
      return res.status(404).json({ error: 'Game report not found' });
    }

    res.json({
      success: true,
      data: gameReport
    });
  } catch (error) {
    console.error('Get game report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new game report
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { 
      player, 
      game, 
      minutesPlayed, 
      goals, 
      assists, 
      rating_physical, 
      rating_technical, 
      rating_tactical, 
      rating_mental, 
      notes 
    } = req.body;

    const gameReport = new GameReport({
      player,
      game,
      author: req.user._id,
      minutesPlayed: minutesPlayed || 0,
      goals: goals || 0,
      assists: assists || 0,
      rating_physical: rating_physical || 3,
      rating_technical: rating_technical || 3,
      rating_tactical: rating_tactical || 3,
      rating_mental: rating_mental || 3,
      notes
    });

    await gameReport.save();
    await gameReport.populate('player', 'fullName kitNumber position');
    await gameReport.populate('game', 'gameTitle opponent date');
    await gameReport.populate('author', 'fullName role');

    res.status(201).json({
      success: true,
      data: gameReport
    });
  } catch (error) {
    console.error('Create game report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update game report
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const { 
      minutesPlayed, 
      goals, 
      assists, 
      rating_physical, 
      rating_technical, 
      rating_tactical, 
      rating_mental, 
      notes 
    } = req.body;

    const gameReport = await GameReport.findByIdAndUpdate(
      req.params.id,
      { 
        minutesPlayed, 
        goals, 
        assists, 
        rating_physical, 
        rating_technical, 
        rating_tactical, 
        rating_mental, 
        notes 
      },
      { new: true }
    )
    .populate('player', 'fullName kitNumber position')
    .populate('game', 'gameTitle opponent date')
    .populate('author', 'fullName role');

    if (!gameReport) {
      return res.status(404).json({ error: 'Game report not found' });
    }

    res.json({
      success: true,
      data: gameReport
    });
  } catch (error) {
    console.error('Update game report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete game report
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const gameReport = await GameReport.findByIdAndDelete(req.params.id);

    if (!gameReport) {
      return res.status(404).json({ error: 'Game report not found' });
    }

    res.json({
      success: true,
      message: 'Game report deleted successfully'
    });
  } catch (error) {
    console.error('Delete game report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Batch create/update game reports (for final submission)
router.post('/batch', authenticateJWT, checkGameAccessFromBody, async (req, res) => {
  try {
    const { gameId, reports } = req.body;
    // Game access already validated by checkGameAccessFromBody middleware
    const game = req.game;
    // reports should be array of { playerId, rating_physical, rating_technical, rating_tactical, rating_mental, notes }
    // Server-calculated fields (minutesPlayed, goals, assists) are FORBIDDEN in request

    if (!gameId || !Array.isArray(reports)) {
      return res.status(400).json({ error: 'Invalid request format. Expected { gameId, reports: [{ playerId, ... }] }' });
    }

    // Game is already validated and attached by checkGameAccessFromBody middleware

    // Strict validation: Reject any calculated fields from client
    const forbiddenFields = ['minutesPlayed', 'goals', 'assists'];
    const invalidFields = [];

    for (const reportData of reports) {
      for (const field of forbiddenFields) {
        if (reportData[field] !== undefined) {
          invalidFields.push(`${field} in report for playerId: ${reportData.playerId || 'unknown'}`);
        }
      }
    }

    if (invalidFields.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid request: Server-calculated fields cannot be provided by client.',
        details: invalidFields,
        message: 'The following fields are server-calculated and must not be sent: minutesPlayed, goals, assists'
      });
    }

    // Always calculate minutes (server is authoritative)
    let calculatedMinutesMap = {};
    try {
      calculatedMinutesMap = await calculatePlayerMinutes(gameId);
      console.log(`✅ Calculated minutes for game ${gameId}`);
    } catch (error) {
      console.error(`❌ Error calculating minutes:`, error);
      return res.status(500).json({ 
        error: 'Failed to calculate player minutes',
        message: 'Please ensure game events (substitutions, red cards) are properly recorded.'
      });
    }

    // Always calculate goals/assists (server is authoritative)
    let calculatedGoalsAssistsMap = {};
    try {
      calculatedGoalsAssistsMap = await calculatePlayerGoalsAssists(gameId);
      console.log(`✅ Calculated goals/assists for game ${gameId}`);
    } catch (error) {
      console.error(`❌ Error calculating goals/assists:`, error);
      return res.status(500).json({ 
        error: 'Failed to calculate goals/assists',
        message: 'Please ensure goals are properly recorded in the Goals collection.'
      });
    }

    const results = [];

    for (const reportData of reports) {
      // Extract ONLY allowed fields from client
      const { 
        playerId, 
        notes, 
        rating_physical, 
        rating_technical, 
        rating_tactical, 
        rating_mental 
      } = reportData;
      
      // Validate required fields
      if (!playerId) {
        return res.status(400).json({ error: 'Missing required field: playerId' });
      }
      
      // Get calculated values from server (authoritative)
      const calculatedMinutes = calculatedMinutesMap[playerId] || 0;
      const calculatedGoals = calculatedGoalsAssistsMap[playerId]?.goals || 0;
      const calculatedAssists = calculatedGoalsAssistsMap[playerId]?.assists || 0;
      
      // Determine calculation method for minutes
      const minutesCalculationMethod = calculatedMinutesMap[playerId] !== undefined 
        ? 'calculated' 
        : 'manual';
      
      // Use findOneAndUpdate with upsert for atomic operation
      const gameReport = await GameReport.findOneAndUpdate(
        { 
          game: gameId, 
          player: playerId 
        },
        {
          // Server-calculated fields (always from calculation services)
          minutesPlayed: calculatedMinutes,
          minutesCalculationMethod: minutesCalculationMethod,
          goals: calculatedGoals,
          assists: calculatedAssists,
          
          // Client-provided fields (user-editable)
          rating_physical: rating_physical !== undefined ? rating_physical : 3,
          rating_technical: rating_technical !== undefined ? rating_technical : 3,
          rating_tactical: rating_tactical !== undefined ? rating_tactical : 3,
          rating_mental: rating_mental !== undefined ? rating_mental : 3,
          notes: notes !== undefined ? notes : null,
          
          // Metadata
          author: req.user._id,
        },
        {
          new: true, // Return updated document
          upsert: true, // Create if doesn't exist
          setDefaultsOnInsert: true // Apply schema defaults on insert
        }
      );
      
      await gameReport.populate('player game author');
      results.push(gameReport);
    }

    res.json({
      success: true,
      data: results,
      message: `Updated ${results.length} game reports`
    });
  } catch (error) {
    console.error('Batch update game reports error:', error);
    // Return the actual error message from validation or other errors
    const errorMessage = error.message || 'Internal server error';
    res.status(500).json({ error: errorMessage });
  }
});

module.exports = router;

