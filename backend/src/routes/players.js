const express = require('express');
const { authenticateJWT } = require('../middleware/jwtAuth');
const { checkTeamAccess } = require('../middleware/auth');
const Player = require('../models/Player');
const Team = require('../models/Team');

const router = express.Router();

// Get all players (with role-based filtering)
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const user = req.user;
    let query = {};

    // Apply role-based filtering
    if (user.role === 'Coach') {
      // Get teams where user is coach
      const teams = await Team.find({ coach: user._id });
      const teamIds = teams.map(team => team._id);
      query.team = { $in: teamIds };
    }

    const players = await Player.find(query)
      .populate('team', 'teamName season division')
      .sort({ fullName: 1 });

    res.json({
      success: true,
      data: players
    });
  } catch (error) {
    console.error('Get players error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get player by ID
router.get('/:id', authenticateJWT, checkTeamAccess, async (req, res) => {
  try {
    const player = await Player.findById(req.params.id)
      .populate('team', 'teamName season division');

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json({
      success: true,
      data: player
    });
  } catch (error) {
    console.error('Get player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new player
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { fullName, kitNumber, position, dateOfBirth, team, nationalID, phoneNumber, email } = req.body;

    // Validate team exists
    const teamDoc = await Team.findById(team);
    if (!teamDoc) {
      return res.status(400).json({ error: 'Team not found' });
    }

    const player = new Player({
      fullName,
      kitNumber,
      position,
      dateOfBirth,
      team,
      teamRecordID: teamDoc.teamID,
      nationalID,
      phoneNumber,
      email
    });

    await player.save();
    await player.populate('team', 'teamName season division');

    res.status(201).json({
      success: true,
      data: player
    });
  } catch (error) {
    console.error('Create player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update player
router.put('/:id', authenticateJWT, checkTeamAccess, async (req, res) => {
  try {
    const { fullName, kitNumber, position, dateOfBirth, team, nationalID, phoneNumber, email, profileImage } = req.body;

    const player = await Player.findByIdAndUpdate(
      req.params.id,
      { fullName, kitNumber, position, dateOfBirth, team, nationalID, phoneNumber, email, profileImage },
      { new: true }
    ).populate('team', 'teamName season division');

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json({
      success: true,
      data: player
    });
  } catch (error) {
    console.error('Update player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete player
router.delete('/:id', authenticateJWT, checkTeamAccess, async (req, res) => {
  try {
    const player = await Player.findByIdAndDelete(req.params.id);

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json({
      success: true,
      message: 'Player deleted successfully'
    });
  } catch (error) {
    console.error('Delete player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

