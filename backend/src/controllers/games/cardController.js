const cardService = require('../../services/games/cardService');

/**
 * POST /api/games/:gameId/cards
 * Create a new card for a game
 */
exports.createCard = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const card = await cardService.createCard(gameId, req.body);

    res.status(201).json({
      message: 'Card created successfully',
      card
    });
  } catch (error) {
    console.error('Error creating card:', error);
    
    // Handle specific errors
    if (error.message === 'Player not found') {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    if (error.message.includes('Invalid card assignment')) {
      return res.status(400).json({
        message: 'Invalid card assignment',
        error: error.message.replace('Invalid card assignment: ', '')
      });
    }

    res.status(500).json({ 
      message: 'Failed to create card', 
      error: error.message 
    });
  }
};

/**
 * GET /api/games/:gameId/cards
 * Get all cards for a game
 */
exports.getAllCards = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const cards = await cardService.getAllCards(gameId);

    res.json({
      gameId,
      totalCards: cards.length,
      cards
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ 
      message: 'Failed to fetch cards', 
      error: error.message 
    });
  }
};

/**
 * GET /api/games/:gameId/cards/player/:playerId
 * Get cards for a specific player in a game
 */
exports.getPlayerCards = async (req, res, next) => {
  try {
    const { gameId, playerId } = req.params;
    const cards = await cardService.getPlayerCards(gameId, playerId);

    res.json({
      gameId,
      playerId,
      totalCards: cards.length,
      cards
    });
  } catch (error) {
    console.error('Error fetching player cards:', error);
    res.status(500).json({ 
      message: 'Failed to fetch player cards', 
      error: error.message 
    });
  }
};

/**
 * PUT /api/games/:gameId/cards/:cardId
 * Update an existing card
 */
exports.updateCard = async (req, res, next) => {
  try {
    const { gameId, cardId } = req.params;
    const card = await cardService.updateCard(gameId, cardId, req.body);

    res.json({
      message: 'Card updated successfully',
      card
    });
  } catch (error) {
    console.error('Error updating card:', error);
    
    // Handle specific errors
    if (error.message === 'Card not found') {
      return res.status(404).json({ message: 'Card not found' });
    }
    
    if (error.message.includes('Invalid card assignment')) {
      return res.status(400).json({
        message: 'Invalid card assignment',
        error: error.message.replace('Invalid card assignment: ', '')
      });
    }

    res.status(500).json({ 
      message: 'Failed to update card', 
      error: error.message 
    });
  }
};

/**
 * DELETE /api/games/:gameId/cards/:cardId
 * Delete a card
 */
exports.deleteCard = async (req, res, next) => {
  try {
    const { gameId, cardId } = req.params;
    await cardService.deleteCard(gameId, cardId);

    res.json({
      message: 'Card deleted successfully',
      cardId
    });
  } catch (error) {
    console.error('Error deleting card:', error);
    
    if (error.message === 'Card not found') {
      return res.status(404).json({ message: 'Card not found' });
    }

    res.status(500).json({ 
      message: 'Failed to delete card', 
      error: error.message 
    });
  }
};

