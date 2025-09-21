const express = require('express');
const { authenticateJWT } = require('../middleware/jwtAuth');
const { checkTeamAccess } = require('../middleware/auth');
const GameReport = require('../models/GameReport');

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

module.exports = router;

