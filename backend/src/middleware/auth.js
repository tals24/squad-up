const { admin } = require('../config/firebase-admin');
const User = require('../models/User');

// Middleware to verify Firebase token and get user info
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get user from our database
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    // If user doesn't exist in our database, create them
    if (!user) {
      user = new User({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        fullName: decodedToken.name || decodedToken.email,
        role: 'Coach', // Default role, can be updated later
        profileImage: decodedToken.picture || null
      });
      
      await user.save();
    }

    // Add user info to request object
    req.user = user;
    req.firebaseUid = decodedToken.uid;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Middleware to check user roles
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
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
          return res.status(403).json({ error: 'Access denied to this team' });
        }
      }
    }

    next();
  } catch (error) {
    console.error('Team access check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  checkTeamAccess
};



