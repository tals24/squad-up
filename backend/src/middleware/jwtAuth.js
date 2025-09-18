const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token and get user info
const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Access token required' 
      });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from our database
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Add user info to request object
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    console.error('JWT Authentication error:', error);
    return res.status(403).json({ 
      success: false,
      error: 'Invalid or expired token' 
    });
  }
};

// Middleware to check user roles
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient permissions' 
      });
    }

    next();
  };
};

// Middleware to check if user can access team data
const checkTeamAccess = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Admin and Department Manager can access all teams
    if (user.role === 'Admin' || user.role === 'Department Manager') {
      return next();
    }

    // Division Manager can access teams in their division
    if (user.role === 'Division Manager') {
      // This will be implemented based on your division logic
      return next();
    }

    // Coach can only access their assigned team
    if (user.role === 'Coach') {
      // Check if the requested team belongs to this coach
      const teamId = req.params.teamId || req.body.team;
      if (teamId) {
        const Team = require('../models/Team');
        const team = await Team.findById(teamId);
        
        if (!team || team.coach.toString() !== user._id.toString()) {
          return res.status(403).json({ 
            success: false,
            error: 'Access denied to this team' 
          });
        }
      }
    }

    next();
  } catch (error) {
    console.error('Team access check error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

module.exports = {
  authenticateJWT,
  requireRole,
  checkTeamAccess
};
