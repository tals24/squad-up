const express = require('express');
const { authenticateJWT } = require('../middleware/jwtAuth');
const { checkTeamAccess } = require('../middleware/auth');
const GameRoster = require('../models/GameRoster');

const router = express.Router();

// Get all game rosters
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const gameRosters = await GameRoster.find()
      .populate('game', 'gameTitle team')
      .populate('player', 'fullName kitNumber position')
      .sort({ gameTitle: 1, playerName: 1 });

    res.json({
      success: true,
      data: gameRosters
    });
  } catch (error) {
    console.error('Get game rosters error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get game roster by ID
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const gameRoster = await GameRoster.findById(req.params.id)
      .populate('game', 'gameTitle team')
      .populate('player', 'fullName kitNumber position');

    if (!gameRoster) {
      return res.status(404).json({ error: 'Game roster not found' });
    }

    res.json({
      success: true,
      data: gameRoster
    });
  } catch (error) {
    console.error('Get game roster error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new game roster entry
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { game, player, status } = req.body;

    const gameRoster = new GameRoster({
      game,
      player,
      status: status || 'Not in Squad'
    });

    await gameRoster.save();
    await gameRoster.populate('game', 'gameTitle team');
    await gameRoster.populate('player', 'fullName kitNumber position');

    res.status(201).json({
      success: true,
      data: gameRoster
    });
  } catch (error) {
    console.error('Create game roster error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update game roster
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const { status } = req.body;

    const gameRoster = await GameRoster.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
    .populate('game', 'gameTitle team')
    .populate('player', 'fullName kitNumber position');

    if (!gameRoster) {
      return res.status(404).json({ error: 'Game roster not found' });
    }

    res.json({
      success: true,
      data: gameRoster
    });
  } catch (error) {
    console.error('Update game roster error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete game roster
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const gameRoster = await GameRoster.findByIdAndDelete(req.params.id);

    if (!gameRoster) {
      return res.status(404).json({ error: 'Game roster not found' });
    }

    res.json({
      success: true,
      message: 'Game roster deleted successfully'
    });
  } catch (error) {
    console.error('Delete game roster error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

