const express = require('express');
const { authenticateJWT } = require('../middleware/jwtAuth');
const GameReport = require('../models/GameReport');
const Game = require('../models/Game');

const router = express.Router();

// Get all game reports
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const gameReports = await GameReport.find()
      .populate('player', 'fullName kitNumber position')
      .populate('game', 'gameTitle opponent date')
      .populate('author', 'fullName role')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: gameReports
    });
  } catch (error) {
    console.error('Get game reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get game reports by game ID
router.get('/game/:gameId', authenticateJWT, async (req, res) => {
  try {
    const gameReports = await GameReport.find({ game: req.params.gameId })
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
router.post('/batch', authenticateJWT, async (req, res) => {
  try {
    const { gameId, reports } = req.body;
    // reports should be array of { playerId, minutesPlayed, goals, assists, rating_physical, rating_technical, rating_tactical, rating_mental, notes }

    if (!gameId || !Array.isArray(reports)) {
      return res.status(400).json({ error: 'Invalid request format. Expected { gameId, reports: [{ playerId, ... }] }' });
    }

    // Get the game to check team score
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Validate: Total assists cannot exceed team goals
    // Every assist must have a goal (team scored), but not every goal must have an assist
    const totalAssists = reports.reduce((sum, report) => sum + (report.assists || 0), 0);
    const teamGoals = game.ourScore || 0;

    if (totalAssists > teamGoals) {
      return res.status(400).json({ 
        error: `Total assists (${totalAssists}) cannot exceed team goals (${teamGoals}). Every assist must correspond to a goal scored by the team.` 
      });
    }

    const results = [];
    
    for (const reportData of reports) {
      const { playerId, minutesPlayed, goals, assists, rating_physical, rating_technical, rating_tactical, rating_mental, notes } = reportData;
      
      // Find existing report or create new
      let gameReport = await GameReport.findOne({ 
        game: gameId, 
        player: playerId 
      });

      if (gameReport) {
        // Update existing
        gameReport.minutesPlayed = minutesPlayed !== undefined ? minutesPlayed : gameReport.minutesPlayed;
        gameReport.goals = goals !== undefined ? goals : gameReport.goals;
        gameReport.assists = assists !== undefined ? assists : gameReport.assists;
        gameReport.rating_physical = rating_physical !== undefined ? rating_physical : gameReport.rating_physical;
        gameReport.rating_technical = rating_technical !== undefined ? rating_technical : gameReport.rating_technical;
        gameReport.rating_tactical = rating_tactical !== undefined ? rating_tactical : gameReport.rating_tactical;
        gameReport.rating_mental = rating_mental !== undefined ? rating_mental : gameReport.rating_mental;
        gameReport.notes = notes !== undefined ? notes : gameReport.notes;
        gameReport.author = req.user._id;
        await gameReport.save();
      } else {
        // Create new
        gameReport = new GameReport({
          game: gameId,
          player: playerId,
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
      }
      
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

