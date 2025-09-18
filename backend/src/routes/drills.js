const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Drill = require('../models/Drill');

const router = express.Router();

// Get all drills
router.get('/', authenticateToken, async (req, res) => {
  try {
    const drills = await Drill.find()
      .populate('author', 'fullName role')
      .sort({ drillName: 1 });

    res.json({
      success: true,
      data: drills
    });
  } catch (error) {
    console.error('Get drills error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get drill by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const drill = await Drill.findById(req.params.id)
      .populate('author', 'fullName role');

    if (!drill) {
      return res.status(404).json({ error: 'Drill not found' });
    }

    res.json({
      success: true,
      data: drill
    });
  } catch (error) {
    console.error('Get drill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new drill
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { drillName, description, category, targetAgeGroup, videoLink, instructions, details, layoutData, duration, playersRequired, equipment } = req.body;

    const drill = new Drill({
      drillName,
      description,
      category,
      targetAgeGroup,
      videoLink,
      author: req.user._id,
      instructions,
      details,
      layoutData,
      duration,
      playersRequired,
      equipment: equipment || []
    });

    await drill.save();
    await drill.populate('author', 'fullName role');

    res.status(201).json({
      success: true,
      data: drill
    });
  } catch (error) {
    console.error('Create drill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update drill
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { drillName, description, category, targetAgeGroup, videoLink, instructions, details, layoutData, duration, playersRequired, equipment } = req.body;

    const drill = await Drill.findByIdAndUpdate(
      req.params.id,
      { drillName, description, category, targetAgeGroup, videoLink, instructions, details, layoutData, duration, playersRequired, equipment },
      { new: true }
    ).populate('author', 'fullName role');

    if (!drill) {
      return res.status(404).json({ error: 'Drill not found' });
    }

    res.json({
      success: true,
      data: drill
    });
  } catch (error) {
    console.error('Update drill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete drill
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const drill = await Drill.findByIdAndDelete(req.params.id);

    if (!drill) {
      return res.status(404).json({ error: 'Drill not found' });
    }

    res.json({
      success: true,
      message: 'Drill deleted successfully'
    });
  } catch (error) {
    console.error('Delete drill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

