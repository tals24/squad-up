const express = require('express');
const { authenticateJWT } = require('../middleware/jwtAuth');
const SessionDrill = require('../models/SessionDrill');

const router = express.Router();

// Get all session drills
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const sessionDrills = await SessionDrill.find()
      .populate('trainingSession', 'sessionTitle date team')
      .populate('drill', 'drillName category targetAgeGroup')
      .sort({ order: 1 });

    res.json({
      success: true,
      data: sessionDrills
    });
  } catch (error) {
    console.error('Get session drills error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get session drill by ID
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const sessionDrill = await SessionDrill.findById(req.params.id)
      .populate('trainingSession', 'sessionTitle date team')
      .populate('drill', 'drillName category targetAgeGroup');

    if (!sessionDrill) {
      return res.status(404).json({ error: 'Session drill not found' });
    }

    res.json({
      success: true,
      data: sessionDrill
    });
  } catch (error) {
    console.error('Get session drill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new session drill
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { trainingSession, drill, sessionPart, smallGameNotes, duration, order, notes } = req.body;

    const sessionDrill = new SessionDrill({
      trainingSession,
      drill,
      sessionPart,
      smallGameNotes,
      duration,
      order: order || 0,
      notes
    });

    await sessionDrill.save();
    await sessionDrill.populate('trainingSession', 'sessionTitle date team');
    await sessionDrill.populate('drill', 'drillName category targetAgeGroup');

    res.status(201).json({
      success: true,
      data: sessionDrill
    });
  } catch (error) {
    console.error('Create session drill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update session drill
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const { sessionPart, smallGameNotes, duration, order, notes } = req.body;

    const sessionDrill = await SessionDrill.findByIdAndUpdate(
      req.params.id,
      { sessionPart, smallGameNotes, duration, order, notes },
      { new: true }
    )
    .populate('trainingSession', 'sessionTitle date team')
    .populate('drill', 'drillName category targetAgeGroup');

    if (!sessionDrill) {
      return res.status(404).json({ error: 'Session drill not found' });
    }

    res.json({
      success: true,
      data: sessionDrill
    });
  } catch (error) {
    console.error('Update session drill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete session drill
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const sessionDrill = await SessionDrill.findByIdAndDelete(req.params.id);

    if (!sessionDrill) {
      return res.status(404).json({ error: 'Session drill not found' });
    }

    res.json({
      success: true,
      message: 'Session drill deleted successfully'
    });
  } catch (error) {
    console.error('Delete session drill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

