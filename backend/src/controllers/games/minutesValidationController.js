const minutesValidationService = require('../../services/games/minutesValidationService');

/**
 * PUT /api/games/:gameId/match-duration
 * Update match duration (regular time + extra time)
 */
exports.updateMatchDuration = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const result = await minutesValidationService.updateMatchDuration(gameId, req.body);

    res.status(200).json({
      message: 'Match duration updated successfully',
      ...result
    });
  } catch (error) {
    console.error('Error updating match duration:', error);
    
    if (error.message === 'Game not found') {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    if (error.message.includes('Invalid') || error.message.includes('must be')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

