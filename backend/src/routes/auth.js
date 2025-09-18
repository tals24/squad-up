const express = require('express');
const jwt = require('jsonwebtoken');
const { authenticateJWT } = require('../middleware/jwtAuth');
const User = require('../models/User');

const router = express.Router();

// Verify JWT token and get user info
router.post('/verify', authenticateJWT, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user.toPublicJSON()
    });
  } catch (error) {
    console.error('Auth verify error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get current user info
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user.toPublicJSON()
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Update user profile
router.put('/profile', authenticateJWT, async (req, res) => {
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
      user: updatedUser.toPublicJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
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
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;



