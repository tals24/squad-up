const express = require('express');
const router = express.Router();
const minutesValidationController = require('../../controllers/games/minutesValidationController');

/**
 * PUT /api/games/:gameId/match-duration
 * Update match duration (regular time + extra time)
 */
router.put('/:gameId/match-duration', minutesValidationController.updateMatchDuration);

module.exports = router;
