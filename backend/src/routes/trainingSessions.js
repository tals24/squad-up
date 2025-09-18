const express = require('express');
const { authenticateToken, checkTeamAccess } = require('../middleware/auth');
const TrainingSession = require('../models/TrainingSession');

const router = express.Router();

// Get all training sessions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    let query = {};

    // Apply role-based filtering
    if (user.role === 'Coach') {
      const Team = require('../models/Team');
      const teams = await Team.find({ coach: user._id });
      const teamIds = teams.map(team => team._id);
      query.team = { $in: teamIds };
    }

    const trainingSessions = await TrainingSession.find(query)
      .populate('team', 'teamName season division')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: trainingSessions
    });
  } catch (error) {
    console.error('Get training sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get training session by ID
router.get('/:id', authenticateToken, checkTeamAccess, async (req, res) => {
  try {
    const trainingSession = await TrainingSession.findById(req.params.id)
      .populate('team', 'teamName season division');

    if (!trainingSession) {
      return res.status(404).json({ error: 'Training session not found' });
    }

    res.json({
      success: true,
      data: trainingSession
    });
  } catch (error) {
    console.error('Get training session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new training session
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { date, team, status, weekIdentifier, notes, duration, location, weather } = req.body;

    // Get team details for lookups
    const Team = require('../models/Team');
    const teamDoc = await Team.findById(team);
    if (!teamDoc) {
      return res.status(400).json({ error: 'Team not found' });
    }

    const trainingSession = new TrainingSession({
      date,
      team,
      teamName: teamDoc.teamName,
      status: status || 'Planned',
      weekIdentifier,
      notes,
      duration,
      location,
      weather
    });

    await trainingSession.save();
    await trainingSession.populate('team', 'teamName season division');

    res.status(201).json({
      success: true,
      data: trainingSession
    });
  } catch (error) {
    console.error('Create training session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update training session
router.put('/:id', authenticateToken, checkTeamAccess, async (req, res) => {
  try {
    const { date, status, weekIdentifier, notes, duration, location, weather } = req.body;

    const trainingSession = await TrainingSession.findByIdAndUpdate(
      req.params.id,
      { date, status, weekIdentifier, notes, duration, location, weather },
      { new: true }
    ).populate('team', 'teamName season division');

    if (!trainingSession) {
      return res.status(404).json({ error: 'Training session not found' });
    }

    res.json({
      success: true,
      data: trainingSession
    });
  } catch (error) {
    console.error('Update training session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete training session
router.delete('/:id', authenticateToken, checkTeamAccess, async (req, res) => {
  try {
    const trainingSession = await TrainingSession.findByIdAndDelete(req.params.id);

    if (!trainingSession) {
      return res.status(404).json({ error: 'Training session not found' });
    }

    res.json({
      success: true,
      message: 'Training session deleted successfully'
    });
  } catch (error) {
    console.error('Delete training session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

