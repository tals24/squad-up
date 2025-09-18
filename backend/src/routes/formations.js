const express = require('express');
const { authenticateToken, checkTeamAccess } = require('../middleware/auth');
const Formation = require('../models/Formation');

const router = express.Router();

// Get all formations
router.get('/', authenticateToken, async (req, res) => {
  try {
    const formations = await Formation.find()
      .populate('team', 'teamName season division')
      .populate('createdBy', 'fullName role')
      .sort({ formationName: 1 });

    res.json({
      success: true,
      data: formations
    });
  } catch (error) {
    console.error('Get formations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get formation by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const formation = await Formation.findById(req.params.id)
      .populate('team', 'teamName season division')
      .populate('createdBy', 'fullName role');

    if (!formation) {
      return res.status(404).json({ error: 'Formation not found' });
    }

    res.json({
      success: true,
      data: formation
    });
  } catch (error) {
    console.error('Get formation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new formation
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { formationName, gameSize, formationLayout, team, description, isDefault } = req.body;

    const formation = new Formation({
      formationName,
      gameSize,
      formationLayout,
      team,
      createdBy: req.user._id,
      description,
      isDefault: isDefault || false
    });

    await formation.save();
    await formation.populate('team', 'teamName season division');
    await formation.populate('createdBy', 'fullName role');

    res.status(201).json({
      success: true,
      data: formation
    });
  } catch (error) {
    console.error('Create formation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update formation
router.put('/:id', authenticateToken, checkTeamAccess, async (req, res) => {
  try {
    const { formationName, gameSize, formationLayout, description, isDefault } = req.body;

    const formation = await Formation.findByIdAndUpdate(
      req.params.id,
      { formationName, gameSize, formationLayout, description, isDefault },
      { new: true }
    )
    .populate('team', 'teamName season division')
    .populate('createdBy', 'fullName role');

    if (!formation) {
      return res.status(404).json({ error: 'Formation not found' });
    }

    res.json({
      success: true,
      data: formation
    });
  } catch (error) {
    console.error('Update formation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete formation
router.delete('/:id', authenticateToken, checkTeamAccess, async (req, res) => {
  try {
    const formation = await Formation.findByIdAndDelete(req.params.id);

    if (!formation) {
      return res.status(404).json({ error: 'Formation not found' });
    }

    res.json({
      success: true,
      message: 'Formation deleted successfully'
    });
  } catch (error) {
    console.error('Delete formation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

