const express = require('express');
const { authenticateJWT } = require('../middleware/jwtAuth');
const { requireRole } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Get all users (Admin and Department Manager only)
router.get('/', authenticateJWT, requireRole(['Admin', 'Department Manager']), async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ fullName: 1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user (Admin only)
router.post('/', authenticateJWT, requireRole(['Admin']), async (req, res) => {
  try {
    const { email, fullName, role, department, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const user = new User({
      // Password will be set via separate endpoint or admin panel
      email,
      fullName,
      role: role || 'Coach',
      department,
      phoneNumber
    });

    await user.save();

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        userID: user.userID,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (Admin only)
router.put('/:id', authenticateJWT, requireRole(['Admin']), async (req, res) => {
  try {
    const { fullName, role, department, phoneNumber } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { fullName, role, department, phoneNumber },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateJWT, requireRole(['Admin']), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;



