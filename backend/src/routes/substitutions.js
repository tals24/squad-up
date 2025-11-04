const express = require('express');
const router = express.Router();
const Substitution = require('../models/Substitution');
const Game = require('../models/Game');
const Player = require('../models/Player');
const { authenticateJWT } = require('../middleware/jwtAuth');

// Apply authentication middleware to all routes
router.use(authenticateJWT);

/**
 * POST /api/games/:gameId/substitutions
 * Create a new substitution for a game
 */
router.post('/:gameId/substitutions', async (req, res) => {
  try {
    const { gameId } = req.params;
    const {
      playerOutId,
      playerInId,
      minute,
      reason,
      matchState,
      tacticalNote
    } = req.body;

    // Validate game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Validate players exist
    const playerOut = await Player.findById(playerOutId);
    if (!playerOut) {
      return res.status(404).json({ message: 'Player leaving field not found' });
    }

    const playerIn = await Player.findById(playerInId);
    if (!playerIn) {
      return res.status(404).json({ message: 'Player entering field not found' });
    }

    // Create substitution
    const substitution = new Substitution({
      gameId,
      playerOutId,
      playerInId,
      minute,
      reason: reason || 'tactical',
      matchState: matchState || 'drawing',
      tacticalNote: tacticalNote || ''
    });

    await substitution.save();

    // Populate references for response
    await substitution.populate([
      { path: 'playerOutId', select: 'name jerseyNumber position' },
      { path: 'playerInId', select: 'name jerseyNumber position' }
    ]);

    res.status(201).json({
      message: 'Substitution created successfully',
      substitution
    });
  } catch (error) {
    console.error('Error creating substitution:', error);
    res.status(500).json({ 
      message: 'Failed to create substitution', 
      error: error.message 
    });
  }
});

/**
 * GET /api/games/:gameId/substitutions
 * Get all substitutions for a game
 */
router.get('/:gameId/substitutions', async (req, res) => {
  try {
    const { gameId } = req.params;

    // Validate game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Get all substitutions for the game, sorted by minute
    const substitutions = await Substitution.find({ gameId })
      .sort({ minute: 1 })
      .populate('playerOutId', 'name jerseyNumber position')
      .populate('playerInId', 'name jerseyNumber position');

    res.json({
      gameId,
      totalSubstitutions: substitutions.length,
      substitutions
    });
  } catch (error) {
    console.error('Error fetching substitutions:', error);
    res.status(500).json({ 
      message: 'Failed to fetch substitutions', 
      error: error.message 
    });
  }
});

/**
 * PUT /api/games/:gameId/substitutions/:subId
 * Update an existing substitution
 */
router.put('/:gameId/substitutions/:subId', async (req, res) => {
  try {
    const { gameId, subId } = req.params;
    const {
      playerOutId,
      playerInId,
      minute,
      reason,
      matchState,
      tacticalNote
    } = req.body;

    // Find substitution
    const substitution = await Substitution.findOne({ _id: subId, gameId });
    if (!substitution) {
      return res.status(404).json({ message: 'Substitution not found' });
    }

    // Validate players if changed
    if (playerOutId && playerOutId !== substitution.playerOutId.toString()) {
      const playerOut = await Player.findById(playerOutId);
      if (!playerOut) {
        return res.status(404).json({ message: 'Player leaving field not found' });
      }
      substitution.playerOutId = playerOutId;
    }

    if (playerInId && playerInId !== substitution.playerInId.toString()) {
      const playerIn = await Player.findById(playerInId);
      if (!playerIn) {
        return res.status(404).json({ message: 'Player entering field not found' });
      }
      substitution.playerInId = playerInId;
    }

    // Update other fields
    if (minute !== undefined) substitution.minute = minute;
    if (reason !== undefined) substitution.reason = reason;
    if (matchState !== undefined) substitution.matchState = matchState;
    if (tacticalNote !== undefined) substitution.tacticalNote = tacticalNote;

    await substitution.save();

    // Populate references for response
    await substitution.populate([
      { path: 'playerOutId', select: 'name jerseyNumber position' },
      { path: 'playerInId', select: 'name jerseyNumber position' }
    ]);

    res.json({
      message: 'Substitution updated successfully',
      substitution
    });
  } catch (error) {
    console.error('Error updating substitution:', error);
    res.status(500).json({ 
      message: 'Failed to update substitution', 
      error: error.message 
    });
  }
});

/**
 * DELETE /api/games/:gameId/substitutions/:subId
 * Delete a substitution
 */
router.delete('/:gameId/substitutions/:subId', async (req, res) => {
  try {
    const { gameId, subId } = req.params;

    // Find and delete substitution
    const substitution = await Substitution.findOneAndDelete({ _id: subId, gameId });
    if (!substitution) {
      return res.status(404).json({ message: 'Substitution not found' });
    }

    res.json({
      message: 'Substitution deleted successfully',
      substitutionId: subId
    });
  } catch (error) {
    console.error('Error deleting substitution:', error);
    res.status(500).json({ 
      message: 'Failed to delete substitution', 
      error: error.message 
    });
  }
});

module.exports = router;

