const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Verify Firebase token and get user info
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        userID: req.user.userID,
        email: req.user.email,
        fullName: req.user.fullName,
        role: req.user.role,
        profileImage: req.user.profileImage,
        department: req.user.department,
        phoneNumber: req.user.phoneNumber
      }
    });
  } catch (error) {
    console.error('Auth verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        userID: req.user.userID,
        email: req.user.email,
        fullName: req.user.fullName,
        role: req.user.role,
        profileImage: req.user.profileImage,
        department: req.user.department,
        phoneNumber: req.user.phoneNumber
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, phoneNumber, department } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 
        fullName: fullName || req.user.fullName,
        phoneNumber: phoneNumber || req.user.phoneNumber,
        department: department || req.user.department
      },
      { new: true }
    );

    res.json({
      success: true,
      user: {
        id: updatedUser._id,
        userID: updatedUser.userID,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        profileImage: updatedUser.profileImage,
        department: updatedUser.department,
        phoneNumber: updatedUser.phoneNumber
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;



