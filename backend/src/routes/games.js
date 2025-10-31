const express = require('express');
const { authenticateJWT } = require('../middleware/jwtAuth');
const { checkTeamAccess } = require('../middleware/auth');
const Game = require('../models/Game');
const Team = require('../models/Team');

const router = express.Router();

// Get all games (with role-based filtering)
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const user = req.user;
    let query = {};

    // Apply role-based filtering
    if (user.role === 'Coach') {
      const teams = await Team.find({ coach: user._id });
      const teamIds = teams.map(team => team._id);
      query.team = { $in: teamIds };
    }

    const games = await Game.find(query)
      .populate('team', 'teamName season division')
      .sort({ date: -1 })
      .lean();

    // Add virtual fields manually since .lean() doesn't include them
    const gamesWithVirtuals = games.map(game => {
      const gameTitle = `${game.teamName} vs ${game.opponent}`;
      
      // 🔍 DEBUG: Log matchDuration for each game
      console.log('🔍 [Backend GET /games] Game matchDuration:', {
        gameId: game._id,
        status: game.status,
        matchDuration: game.matchDuration,
        hasMatchDuration: !!game.matchDuration,
        matchDurationType: typeof game.matchDuration,
        matchDurationKeys: game.matchDuration ? Object.keys(game.matchDuration) : null,
        totalMatchDuration: game.totalMatchDuration
      });
      
      console.log('🔍 Backend gameTitle generation:', {
        teamName: game.teamName,
        opponent: game.opponent,
        generatedTitle: gameTitle
      });
      return {
        ...game,
        gameTitle: gameTitle
      };
    });

    console.log('🔍 Backend sending games:', gamesWithVirtuals.map(g => ({ 
      id: g._id, 
      gameTitle: g.gameTitle, 
      teamName: g.teamName, 
      opponent: g.opponent,
      status: g.status,
      hasMatchDuration: !!g.matchDuration,
      matchDuration: g.matchDuration
    })));

    res.json({
      success: true,
      data: gamesWithVirtuals
    });
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get game by ID
router.get('/:id', authenticateJWT, checkTeamAccess, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate('team', 'teamName season division');

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json({
      success: true,
      data: game
    });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new game
router.post('/', authenticateJWT, async (req, res) => {
  try {
    console.log('🔍 Create game request body:', req.body);
    const { team, opponent, date, location, status, gameType } = req.body;
    console.log('🔍 Extracted fields:', { team, opponent, date, location, status, gameType });

    // Get team details for lookups
    const teamDoc = await Team.findById(team);
    if (!teamDoc) {
      return res.status(400).json({ error: 'Team not found' });
    }

    const game = new Game({
      team,
      season: teamDoc.season,
      teamName: teamDoc.teamName,
      opponent,
      date,
      location,
      status: status || 'Scheduled',
      gameType: gameType || 'League' // Use provided type or default to League
      // gameTitle is now calculated dynamically via virtual field
    });

    await game.save();
    await game.populate('team', 'teamName season division');

    res.status(201).json({
      success: true,
      data: game
    });
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update game
router.put('/:id', authenticateJWT, checkTeamAccess, async (req, res) => {
  try {
    // 🔍 DEBUG: Log request received
    console.log('🔍 [Backend PUT /games/:id] Request received:', {
      gameId: req.params.id,
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : null,
      matchDurationInBody: req.body?.matchDuration,
      matchDurationType: typeof req.body?.matchDuration,
      fullBody: JSON.stringify(req.body)
    });
    
    const { 
      opponent, 
      date, 
      location, 
      status, 
      ourScore, 
      opponentScore, 
      defenseSummary, 
      midfieldSummary, 
      attackSummary, 
      generalSummary,
      matchDuration 
    } = req.body;

    // Prepare update object
    const updateData = {
      opponent,
      date,
      location,
      status,
      ourScore,
      opponentScore,
      defenseSummary,
      midfieldSummary,
      attackSummary,
      generalSummary
    };

    // If matchDuration is provided, update it
    if (matchDuration) {
      // 🔍 DEBUG: Log matchDuration being saved
      console.log('🔍 [Backend PUT /games/:id] Saving matchDuration:', {
        gameId: req.params.id,
        receivedMatchDuration: matchDuration,
        matchDurationType: typeof matchDuration,
        matchDurationKeys: matchDuration ? Object.keys(matchDuration) : null
      });
      
      updateData.matchDuration = {
        regularTime: matchDuration.regularTime || 90,
        firstHalfExtraTime: matchDuration.firstHalfExtraTime || 0,
        secondHalfExtraTime: matchDuration.secondHalfExtraTime || 0
      };
      
      // Calculate and store total match duration
      const { calculateTotalMatchDuration } = require('../services/minutesValidation');
      updateData.totalMatchDuration = calculateTotalMatchDuration(updateData.matchDuration);
      
      // 🔍 DEBUG: Log calculated values
      console.log('🔍 [Backend PUT /games/:id] Calculated matchDuration:', {
        matchDuration: updateData.matchDuration,
        totalMatchDuration: updateData.totalMatchDuration
      });
    } else {
      console.log('🔍 [Backend PUT /games/:id] No matchDuration provided in request');
    }

    const game = await Game.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('team', 'teamName season division');
    
    // 🔍 DEBUG: Log saved game
    console.log('🔍 [Backend PUT /games/:id] Saved game matchDuration:', {
      gameId: game._id,
      status: game.status,
      matchDuration: game.matchDuration,
      totalMatchDuration: game.totalMatchDuration
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json({
      success: true,
      data: game
    });
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete game
router.delete('/:id', authenticateJWT, checkTeamAccess, async (req, res) => {
  try {
    const game = await Game.findByIdAndDelete(req.params.id);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json({
      success: true,
      message: 'Game deleted successfully'
    });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

