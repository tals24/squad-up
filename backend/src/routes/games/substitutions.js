const express = require('express');
const router = express.Router();
const { authenticateJWT, checkGameAccess } = require('../../middleware/jwtAuth');
const substitutionController = require('../../controllers/games/substitutionController');

// Apply authentication middleware to all routes
router.use(authenticateJWT);

/**
 * POST /api/games/:gameId/substitutions
 * Create a new substitution for a game
 */
router.post('/:gameId/substitutions', checkGameAccess, substitutionController.createSubstitution);

/**
 * GET /api/games/:gameId/substitutions
 * Get all substitutions for a game
 */
router.get('/:gameId/substitutions', checkGameAccess, substitutionController.getAllSubstitutions);

/**
 * PUT /api/games/:gameId/substitutions/:subId
 * Update an existing substitution
 */
router.put('/:gameId/substitutions/:subId', checkGameAccess, substitutionController.updateSubstitution);

/**
 * DELETE /api/games/:gameId/substitutions/:subId
 * Delete a substitution
 */
router.delete('/:gameId/substitutions/:subId', checkGameAccess, substitutionController.deleteSubstitution);

module.exports = router;
