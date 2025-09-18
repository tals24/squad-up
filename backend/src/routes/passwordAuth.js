const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

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

// Verify token and get user info
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Access token required' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ 
      success: false,
      error: 'Invalid or expired token' 
    });
  }
});

module.exports = router;
