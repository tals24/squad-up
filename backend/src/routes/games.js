const express = require('express');
const { authenticateToken, checkTeamAccess } = require('../middleware/auth');
const Game = require('../models/Game');
const Team = require('../models/Team');

const router = express.Router();

// Get all games (with role-based filtering)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    let query = {};

    // Apply role-based filtering
    if (user.role === 'Coach') {
      const teams = await Team.find({ coach: user._id });
      const teamIds = teams.map(team => team._id);
      query.team = { $in: teamIds };
    }

    const games = await Game.find(query)
      .populate('team', 'teamName season division')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: games
    });
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get game by ID
router.get('/:id', authenticateToken, checkTeamAccess, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate('team', 'teamName season division');

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json({
      success: true,
      data: game
    });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new game
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { team, opponent, date, location, status } = req.body;

    // Get team details for lookups
    const teamDoc = await Team.findById(team);
    if (!teamDoc) {
      return res.status(400).json({ error: 'Team not found' });
    }

    const game = new Game({
      team,
      season: teamDoc.season,
      teamName: teamDoc.teamName,
      opponent,
      date,
      location,
      status: status || 'Scheduled'
    });

    await game.save();
    await game.populate('team', 'teamName season division');

    res.status(201).json({
      success: true,
      data: game
    });
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update game
router.put('/:id', authenticateToken, checkTeamAccess, async (req, res) => {
  try {
    const { opponent, date, location, status, ourScore, opponentScore, defenseSummary, midfieldSummary, attackSummary, generalSummary } = req.body;

    const game = await Game.findByIdAndUpdate(
      req.params.id,
      { opponent, date, location, status, ourScore, opponentScore, defenseSummary, midfieldSummary, attackSummary, generalSummary },
      { new: true }
    ).populate('team', 'teamName season division');

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json({
      success: true,
      data: game
    });
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete game
router.delete('/:id', authenticateToken, checkTeamAccess, async (req, res) => {
  try {
    const game = await Game.findByIdAndDelete(req.params.id);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json({
      success: true,
      message: 'Game deleted successfully'
    });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

