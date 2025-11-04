const express = require('express');
const router = express.Router();
const DisciplinaryAction = require('../models/DisciplinaryAction');
const Game = require('../models/Game');
const Player = require('../models/Player');
const { authenticateJWT } = require('../middleware/jwtAuth');

// Apply authentication middleware to all routes
router.use(authenticateJWT);

/**
 * POST /api/games/:gameId/disciplinary-actions
 * Create a new disciplinary action for a game
 */
router.post('/:gameId/disciplinary-actions', async (req, res) => {
  try {
    const { gameId } = req.params;
    const {
      playerId,
      cardType,
      minute,
      foulsCommitted,
      foulsReceived,
      reason
    } = req.body;

    // Validate game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Validate player exists
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Create disciplinary action
    const disciplinaryAction = new DisciplinaryAction({
      gameId,
      playerId,
      cardType,
      minute,
      foulsCommitted: foulsCommitted || 0,
      foulsReceived: foulsReceived || 0,
      reason: reason || ''
    });

    await disciplinaryAction.save();

    // Populate references for response
    await disciplinaryAction.populate('playerId', 'name jerseyNumber position');

    res.status(201).json({
      message: 'Disciplinary action created successfully',
      disciplinaryAction
    });
  } catch (error) {
    console.error('Error creating disciplinary action:', error);
    res.status(500).json({ 
      message: 'Failed to create disciplinary action', 
      error: error.message 
    });
  }
});

/**
 * GET /api/games/:gameId/disciplinary-actions
 * Get all disciplinary actions for a game
 */
router.get('/:gameId/disciplinary-actions', async (req, res) => {
  try {
    const { gameId } = req.params;

    // Validate game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Get all disciplinary actions for the game, sorted by minute
    const disciplinaryActions = await DisciplinaryAction.find({ gameId })
      .sort({ minute: 1 })
      .populate('playerId', 'name jerseyNumber position');

    res.json({
      gameId,
      totalActions: disciplinaryActions.length,
      disciplinaryActions
    });
  } catch (error) {
    console.error('Error fetching disciplinary actions:', error);
    res.status(500).json({ 
      message: 'Failed to fetch disciplinary actions', 
      error: error.message 
    });
  }
});

/**
 * GET /api/games/:gameId/disciplinary-actions/player/:playerId
 * Get disciplinary actions for a specific player in a game
 */
router.get('/:gameId/disciplinary-actions/player/:playerId', async (req, res) => {
  try {
    const { gameId, playerId } = req.params;

    // Find disciplinary actions for this player in this game
    const actions = await DisciplinaryAction.find({ gameId, playerId })
      .sort({ minute: 1 })
      .populate('playerId', 'name jerseyNumber position');

    res.json({
      gameId,
      playerId,
      totalActions: actions.length,
      actions
    });
  } catch (error) {
    console.error('Error fetching player disciplinary actions:', error);
    res.status(500).json({ 
      message: 'Failed to fetch player disciplinary actions', 
      error: error.message 
    });
  }
});

/**
 * PUT /api/games/:gameId/disciplinary-actions/:actionId
 * Update an existing disciplinary action
 */
router.put('/:gameId/disciplinary-actions/:actionId', async (req, res) => {
  try {
    const { gameId, actionId } = req.params;
    const {
      cardType,
      minute,
      foulsCommitted,
      foulsReceived,
      reason
    } = req.body;

    // Find disciplinary action
    const action = await DisciplinaryAction.findOne({ _id: actionId, gameId });
    if (!action) {
      return res.status(404).json({ message: 'Disciplinary action not found' });
    }

    // Update fields
    if (cardType !== undefined) action.cardType = cardType;
    if (minute !== undefined) action.minute = minute;
    if (foulsCommitted !== undefined) action.foulsCommitted = foulsCommitted;
    if (foulsReceived !== undefined) action.foulsReceived = foulsReceived;
    if (reason !== undefined) action.reason = reason;

    await action.save();

    // Populate references for response
    await action.populate('playerId', 'name jerseyNumber position');

    res.json({
      message: 'Disciplinary action updated successfully',
      disciplinaryAction: action
    });
  } catch (error) {
    console.error('Error updating disciplinary action:', error);
    res.status(500).json({ 
      message: 'Failed to update disciplinary action', 
      error: error.message 
    });
  }
});

/**
 * DELETE /api/games/:gameId/disciplinary-actions/:actionId
 * Delete a disciplinary action
 */
router.delete('/:gameId/disciplinary-actions/:actionId', async (req, res) => {
  try {
    const { gameId, actionId } = req.params;

    // Find and delete disciplinary action
    const action = await DisciplinaryAction.findOneAndDelete({ _id: actionId, gameId });
    if (!action) {
      return res.status(404).json({ message: 'Disciplinary action not found' });
    }

    res.json({
      message: 'Disciplinary action deleted successfully',
      actionId
    });
  } catch (error) {
    console.error('Error deleting disciplinary action:', error);
    res.status(500).json({ 
      message: 'Failed to delete disciplinary action', 
      error: error.message 
    });
  }
});

module.exports = router;

