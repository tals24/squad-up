const express = require('express');
const { authenticateJWT } = require('../middleware/jwtAuth');
const { checkTeamAccess } = require('../middleware/auth');
const ScoutReport = require('../models/ScoutReport');

const router = express.Router();

// Get all scout reports
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const scoutReports = await ScoutReport.find()
      .populate('player', 'fullName kitNumber position')
      .populate({
        path: 'game',
        select: 'gameTitle opponent date',
        options: { strictPopulate: false }
      })
      .populate('author', 'fullName role')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: scoutReports
    });
  } catch (error) {
    console.error('Get scout reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get scout report by ID
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const scoutReport = await ScoutReport.findById(req.params.id)
      .populate('player', 'fullName kitNumber position')
      .populate({
        path: 'game',
        select: 'gameTitle opponent date',
        options: { strictPopulate: false }
      })
      .populate('author', 'fullName role');

    if (!scoutReport) {
      return res.status(404).json({ error: 'Scout report not found' });
    }

    res.json({
      success: true,
      data: scoutReport
    });
  } catch (error) {
    console.error('Get scout report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new scout report
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { 
      player, 
      game, 
      title, 
      content, 
      generalRating, 
      notes 
    } = req.body;

    const scoutReport = new ScoutReport({
      player,
      game: game || null, // Optional for scout reports
      author: req.user._id,
      title,
      content,
      generalRating: generalRating || 3,
      notes
    });

    await scoutReport.save();
    await scoutReport.populate('player', 'fullName kitNumber position');
    if (scoutReport.game) {
      await scoutReport.populate('game', 'gameTitle opponent date');
    }
    await scoutReport.populate('author', 'fullName role');

    res.status(201).json({
      success: true,
      data: scoutReport
    });
  } catch (error) {
    console.error('Create scout report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update scout report
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const { 
      title, 
      content, 
      generalRating, 
      notes 
    } = req.body;

    const scoutReport = await ScoutReport.findByIdAndUpdate(
      req.params.id,
      { title, content, generalRating, notes },
      { new: true }
    )
    .populate('player', 'fullName kitNumber position')
    .populate({
      path: 'game',
      select: 'gameTitle opponent date',
      options: { strictPopulate: false }
    })
    .populate('author', 'fullName role');

    if (!scoutReport) {
      return res.status(404).json({ error: 'Scout report not found' });
    }

    res.json({
      success: true,
      data: scoutReport
    });
  } catch (error) {
    console.error('Update scout report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete scout report
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const scoutReport = await ScoutReport.findByIdAndDelete(req.params.id);

    if (!scoutReport) {
      return res.status(404).json({ error: 'Scout report not found' });
    }

    res.json({
      success: true,
      message: 'Scout report deleted successfully'
    });
  } catch (error) {
    console.error('Delete scout report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

