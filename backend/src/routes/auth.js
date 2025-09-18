const express = require('express');
const jwt = require('jsonwebtoken');
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

// Login with email and password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Register new user (for admin use)
router.post('/register', async (req, res) => {
  try {
    const { FullName, Email, Role, PhoneNumber, Department, Password } = req.body;

    // Validate required fields
    if (!FullName || !Email || !Role || !Password) {
      return res.status(400).json({ 
        success: false,
        error: 'Full name, email, role, and password are required' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: Email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'User with this email already exists' 
      });
    }

    // Validate password length
    if (Password.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Create new user
    const newUser = new User({
      fullName: FullName,
      email: Email.toLowerCase(),
      role: Role,
      phoneNumber: PhoneNumber || null,
      department: Department || null,
      password: Password // Will be hashed by pre-save middleware
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: `${FullName} has been added to the system successfully!`,
      user: newUser.toPublicJSON()
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router;



