const authService = require('../services/authService');

exports.verifyToken = async (req, res) => {
  try {
    const user = await authService.verifyToken(req.user);
    res.json({ success: true, user });
  } catch (error) {
    console.error('Auth verify error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await authService.getCurrentUser(req.user);
    res.json({ success: true, user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await authService.updateProfile(req.user._id, req.body);
    res.json({ success: true, user });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, ...result });
  } catch (error) {
    if (error.message === 'Email and password are required') {
      return res.status(400).json({ success: false, error: error.message });
    }
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({ success: false, error: error.message });
    }
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    if (error.message === 'Full name, email, role, and password are required' ||
        error.message === 'Password must be at least 6 characters long' ||
        error.message === 'User with this email already exists') {
      return res.status(400).json({ success: false, error: error.message });
    }
    console.error('Registration error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

