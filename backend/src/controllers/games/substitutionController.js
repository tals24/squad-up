const substitutionService = require('../../services/games/substitutionService');

/**
 * POST /api/games/:gameId/substitutions
 * Create a new substitution for a game
 */
exports.createSubstitution = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const substitution = await substitutionService.createSubstitution(gameId, req.body);

    res.status(201).json({
      message: 'Substitution created successfully',
      substitution
    });
  } catch (error) {
    console.error('Error creating substitution:', error);
    
    // Handle specific errors
    if (error.message.includes('not found')) {
      return res.status(404).json({ 
        message: 'Failed to create substitution', 
        error: error.message 
      });
    }
    
    if (error.message.includes('Invalid substitution')) {
      return res.status(400).json({
        message: 'Invalid substitution',
        error: error.message.replace('Invalid substitution: ', '')
      });
    }

    res.status(500).json({ 
      message: 'Failed to create substitution', 
      error: error.message 
    });
  }
};

/**
 * GET /api/games/:gameId/substitutions
 * Get all substitutions for a game
 */
exports.getAllSubstitutions = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const substitutions = await substitutionService.getAllSubstitutions(gameId);

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
};

/**
 * PUT /api/games/:gameId/substitutions/:subId
 * Update an existing substitution
 */
exports.updateSubstitution = async (req, res, next) => {
  try {
    const { gameId, subId } = req.params;
    const substitution = await substitutionService.updateSubstitution(gameId, subId, req.body);

    res.json({
      message: 'Substitution updated successfully',
      substitution
    });
  } catch (error) {
    console.error('Error updating substitution:', error);
    
    // Handle specific errors
    if (error.message === 'Substitution not found') {
      return res.status(404).json({ message: 'Substitution not found' });
    }
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    
    if (error.message.includes('Invalid substitution')) {
      return res.status(400).json({
        message: 'Invalid substitution',
        error: error.message.replace('Invalid substitution: ', '')
      });
    }

    res.status(500).json({ 
      message: 'Failed to update substitution', 
      error: error.message 
    });
  }
};

/**
 * DELETE /api/games/:gameId/substitutions/:subId
 * Delete a substitution
 */
exports.deleteSubstitution = async (req, res, next) => {
  try {
    const { gameId, subId } = req.params;
    await substitutionService.deleteSubstitution(gameId, subId);

    res.json({
      message: 'Substitution deleted successfully',
      substitutionId: subId
    });
  } catch (error) {
    console.error('Error deleting substitution:', error);
    
    if (error.message === 'Substitution not found') {
      return res.status(404).json({ message: 'Substitution not found' });
    }

    res.status(500).json({ 
      message: 'Failed to delete substitution', 
      error: error.message 
    });
  }
};

