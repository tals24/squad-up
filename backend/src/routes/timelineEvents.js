const express = require('express');
const { authenticateToken, checkTeamAccess } = require('../middleware/auth');
const TimelineEvent = require('../models/TimelineEvent');

const router = express.Router();

// Get all timeline events
router.get('/', authenticateToken, async (req, res) => {
  try {
    const timelineEvents = await TimelineEvent.find()
      .populate('player', 'fullName kitNumber position')
      .populate('game', 'gameTitle opponent date')
      .populate('author', 'fullName role')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: timelineEvents
    });
  } catch (error) {
    console.error('Get timeline events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get timeline event by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const timelineEvent = await TimelineEvent.findById(req.params.id)
      .populate('player', 'fullName kitNumber position')
      .populate('game', 'gameTitle opponent date')
      .populate('author', 'fullName role');

    if (!timelineEvent) {
      return res.status(404).json({ error: 'Timeline event not found' });
    }

    res.json({
      success: true,
      data: timelineEvent
    });
  } catch (error) {
    console.error('Get timeline event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new timeline event
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { player, game, eventType, minutesPlayed, goals, assists, generalRating, generalNotes } = req.body;

    const timelineEvent = new TimelineEvent({
      player,
      game,
      author: req.user._id,
      eventType,
      minutesPlayed: minutesPlayed || 0,
      goals: goals || 0,
      assists: assists || 0,
      generalRating: generalRating || 3,
      generalNotes
    });

    await timelineEvent.save();
    await timelineEvent.populate('player', 'fullName kitNumber position');
    await timelineEvent.populate('game', 'gameTitle opponent date');
    await timelineEvent.populate('author', 'fullName role');

    res.status(201).json({
      success: true,
      data: timelineEvent
    });
  } catch (error) {
    console.error('Create timeline event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update timeline event
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { eventType, minutesPlayed, goals, assists, generalRating, generalNotes } = req.body;

    const timelineEvent = await TimelineEvent.findByIdAndUpdate(
      req.params.id,
      { eventType, minutesPlayed, goals, assists, generalRating, generalNotes },
      { new: true }
    )
    .populate('player', 'fullName kitNumber position')
    .populate('game', 'gameTitle opponent date')
    .populate('author', 'fullName role');

    if (!timelineEvent) {
      return res.status(404).json({ error: 'Timeline event not found' });
    }

    res.json({
      success: true,
      data: timelineEvent
    });
  } catch (error) {
    console.error('Update timeline event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete timeline event
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const timelineEvent = await TimelineEvent.findByIdAndDelete(req.params.id);

    if (!timelineEvent) {
      return res.status(404).json({ error: 'Timeline event not found' });
    }

    res.json({
      success: true,
      message: 'Timeline event deleted successfully'
    });
  } catch (error) {
    console.error('Delete timeline event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

