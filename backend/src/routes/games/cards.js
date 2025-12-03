const express = require('express');
const router = express.Router();
const { authenticateJWT, checkGameAccess } = require('../../middleware/jwtAuth');
const cardController = require('../../controllers/games/cardController');

// Apply authentication middleware to all routes
router.use(authenticateJWT);

/**
 * POST /api/games/:gameId/cards
 * Create a new card for a game
 */
router.post('/:gameId/cards', checkGameAccess, cardController.createCard);

/**
 * GET /api/games/:gameId/cards
 * Get all cards for a game
 */
router.get('/:gameId/cards', checkGameAccess, cardController.getAllCards);

/**
 * GET /api/games/:gameId/cards/player/:playerId
 * Get cards for a specific player in a game
 */
router.get('/:gameId/cards/player/:playerId', checkGameAccess, cardController.getPlayerCards);

/**
 * PUT /api/games/:gameId/cards/:cardId
 * Update an existing card
 */
router.put('/:gameId/cards/:cardId', checkGameAccess, cardController.updateCard);

/**
 * DELETE /api/games/:gameId/cards/:cardId
 * Delete a card
 */
router.delete('/:gameId/cards/:cardId', checkGameAccess, cardController.deleteCard);

module.exports = router;
