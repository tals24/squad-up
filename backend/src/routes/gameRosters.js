const express = require('express');
const { authenticateJWT } = require('../middleware/jwtAuth');
const { checkTeamAccess } = require('../middleware/auth');
const GameRoster = require('../models/GameRoster');

const router = express.Router();

// Get all game rosters
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const gameRosters = await GameRoster.find()
      .populate('game', 'gameTitle team')
      .populate('player', 'fullName kitNumber position')
      .sort({ gameTitle: 1, playerName: 1 });

    res.json({
      success: true,
      data: gameRosters
    });
  } catch (error) {
    console.error('Get game rosters error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get game rosters by game ID
router.get('/game/:gameId', authenticateJWT, async (req, res) => {
  try {
    const gameRosters = await GameRoster.find({ game: req.params.gameId })
      .populate('game', 'gameTitle team')
      .populate('player', 'fullName kitNumber position team age')
      .sort({ status: 1, playerName: 1 });

    res.json({
      success: true,
      data: gameRosters
    });
  } catch (error) {
    console.error('Get game rosters by game ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get game roster by ID
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const gameRoster = await GameRoster.findById(req.params.id)
      .populate('game', 'gameTitle team')
      .populate('player', 'fullName kitNumber position');

    if (!gameRoster) {
      return res.status(404).json({ error: 'Game roster not found' });
    }

    res.json({
      success: true,
      data: gameRoster
    });
  } catch (error) {
    console.error('Get game roster error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new game roster entry
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { game, player, status } = req.body;

    const gameRoster = new GameRoster({
      game,
      player,
      status: status || 'Not in Squad'
    });

    await gameRoster.save();
    await gameRoster.populate('game', 'gameTitle team');
    await gameRoster.populate('player', 'fullName kitNumber position');

    res.status(201).json({
      success: true,
      data: gameRoster
    });
  } catch (error) {
    console.error('Create game roster error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update game roster
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const { status } = req.body;

    const gameRoster = await GameRoster.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
    .populate('game', 'gameTitle team')
    .populate('player', 'fullName kitNumber position');

    if (!gameRoster) {
      return res.status(404).json({ error: 'Game roster not found' });
    }

    res.json({
      success: true,
      data: gameRoster
    });
  } catch (error) {
    console.error('Update game roster error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete game roster
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const gameRoster = await GameRoster.findByIdAndDelete(req.params.id);

    if (!gameRoster) {
      return res.status(404).json({ error: 'Game roster not found' });
    }

    res.json({
      success: true,
      message: 'Game roster deleted successfully'
    });
  } catch (error) {
    console.error('Delete game roster error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Batch update game rosters (for initializing/updating all players for a game)
router.post('/batch', authenticateJWT, async (req, res) => {
  try {
    const { gameId, rosters } = req.body;
    // rosters should be array of { playerId, status }

    if (!gameId || !Array.isArray(rosters)) {
      return res.status(400).json({ error: 'Invalid request format. Expected { gameId, rosters: [{ playerId, status }] }' });
    }

    const results = [];
    
    for (const rosterData of rosters) {
      const { playerId, status } = rosterData;
      
      // Find existing roster entry or create new
      let gameRoster = await GameRoster.findOne({ 
        game: gameId, 
        player: playerId 
      });

      if (gameRoster) {
        // Update existing
        gameRoster.status = status;
        await gameRoster.save();
      } else {
        // Create new
        gameRoster = new GameRoster({
          game: gameId,
          player: playerId,
          status: status || 'Not in Squad'
        });
        await gameRoster.save();
      }
      
      await gameRoster.populate('game player');
      results.push(gameRoster);
    }

    res.json({
      success: true,
      data: results,
      message: `Updated ${results.length} roster entries`
    });
  } catch (error) {
    console.error('Batch update game rosters error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

