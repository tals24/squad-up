const express = require('express');
const { authenticateJWT } = require('../middleware/jwtAuth');
const { requireRole, checkTeamAccess } = require('../middleware/auth');
const Team = require('../models/Team');
const User = require('../models/User');

const router = express.Router();

// Get all teams (all teams visible to all users)
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('coach', 'fullName email role')
      .populate('divisionManager', 'fullName email role')
      .populate('departmentManager', 'fullName email role')
      .sort({ teamName: 1 });

    res.json({
      success: true,
      data: teams
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get team by ID
router.get('/:id', authenticateJWT, checkTeamAccess, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('coach', 'fullName email role')
      .populate('divisionManager', 'fullName email role')
      .populate('departmentManager', 'fullName email role');

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new team (Admin and Department Manager only)
router.post('/', authenticateJWT, requireRole(['Admin', 'Department Manager']), async (req, res) => {
  try {
    const { teamName, season, division, coach, divisionManager, departmentManager } = req.body;

    // Validate coach exists
    if (coach) {
      const coachUser = await User.findById(coach);
      if (!coachUser) {
        return res.status(400).json({ error: 'Coach not found' });
      }
    }

    const team = new Team({
      teamName,
      season,
      division,
      coach,
      divisionManager,
      departmentManager
    });

    await team.save();

    // Populate the created team
    await team.populate('coach', 'fullName email role');
    await team.populate('divisionManager', 'fullName email role');
    await team.populate('departmentManager', 'fullName email role');

    res.status(201).json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update team (Admin, Department Manager, and assigned Coach)
router.put('/:id', authenticateJWT, checkTeamAccess, async (req, res) => {
  try {
    const { teamName, season, division, coach, divisionManager, departmentManager } = req.body;

    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { teamName, season, division, coach, divisionManager, departmentManager },
      { new: true }
    )
    .populate('coach', 'fullName email role')
    .populate('divisionManager', 'fullName email role')
    .populate('departmentManager', 'fullName email role');

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete team (Admin and Department Manager only)
router.delete('/:id', authenticateJWT, requireRole(['Admin', 'Department Manager']), async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;



