const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Game = require('../models/Game');
const Team = require('../models/Team');

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
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    console.log('🔐 JWT Secret being used:', jwtSecret ? 'Set from env' : 'Using fallback');
    console.log('🔍 Attempting to verify token...');
    const decoded = jwt.verify(token, jwtSecret);
    
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

/**
 * Middleware to check if user has access to a specific game
 * Must be placed AFTER authenticateJWT middleware
 * 
 * IMPORTANT: Routes using this middleware MUST use :gameId parameter naming.
 * Example: router.get('/:gameId', checkGameAccess, handler)
 * 
 * This middleware:
 * 1. Validates gameId parameter
 * 2. Fetches the game from database
 * 3. Checks if user has access to the game's team
 * 4. Attaches game object to req.game for optimization
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const checkGameAccess = async (req, res, next) => {
  try {
    // Step 1: Get gameId from params
    const gameId = req.params.gameId;
    
    // Step 2: Validate gameId exists and is valid format
    if (!gameId) {
      return res.status(400).json({
        success: false,
        error: 'Game ID is required'
      });
    }
    
    // Validate ObjectId format (MongoDB)
    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid game ID format'
      });
    }
    
    // Step 3: Fetch game from database
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }
    
    // Step 4: Get teamId from game
    const teamId = game.team;
    
    if (!teamId) {
      return res.status(500).json({
        success: false,
        error: 'Game has no associated team'
      });
    }
    
    // Step 5: Check user access based on role
    const user = req.user;
    
    // Admin and Department Manager can access all games
    if (user.role === 'Admin' || user.role === 'Department Manager') {
      req.game = game; // Attach game for optimization
      return next();
    }
    
    // Division Manager: Check if team is in their division
    if (user.role === 'Division Manager') {
      // Fetch team to check division
      const team = await Team.findById(teamId);
      
      if (!team) {
        return res.status(404).json({
          success: false,
          error: 'Team not found'
        });
      }
      
      // Check if user is the division manager for this team
      if (team.divisionManager && team.divisionManager.toString() === user._id.toString()) {
        req.game = game;
        return next();
      }
      
      // If division manager logic is more complex, implement here
      // For now, deny access if not explicitly assigned
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to access this game'
      });
    }
    
    // Coach: Check if they are the coach of the team
    if (user.role === 'Coach') {
      const team = await Team.findById(teamId);
      
      if (!team) {
        return res.status(404).json({
          success: false,
          error: 'Team not found'
        });
      }
      
      // Check if user is the coach of this team
      if (team.coach.toString() === user._id.toString()) {
        req.game = game; // Attach game for optimization
        return next();
      }
      
      // Access denied
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to access this game'
      });
    }
    
    // Unknown role - deny access
    return res.status(403).json({
      success: false,
      error: 'Access denied: Insufficient permissions'
    });
    
  } catch (error) {
    console.error('Game access check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during access check'
    });
  }
};

module.exports = {
  authenticateJWT,
  requireRole,
  checkTeamAccess,
  checkGameAccess
};
