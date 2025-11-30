const express = require('express');
const router = express.Router();
const Card = require('../models/Card');
const Player = require('../models/Player');
const Job = require('../models/Job');
const Goal = require('../models/Goal');
const Substitution = require('../models/Substitution');
const GameRoster = require('../models/GameRoster');
const { authenticateJWT, checkGameAccess } = require('../middleware/jwtAuth');
const { canReceiveCard } = require('../utils/cardValidation');
const { validateCardEligibility, validateFutureConsistency, getPlayerStateAtMinute, PlayerState, getMatchTimeline } = require('../services/gameRules');

// Apply authentication middleware to all routes
router.use(authenticateJWT);

/**
 * POST /api/games/:gameId/cards
 * Create a new card for a game
 */
router.post('/:gameId/cards', checkGameAccess, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, cardType, minute, reason } = req.body;

    // Validate player exists
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // ✅ SAFETY CHECK: Fetch existing cards for this player in this game
    const existingCards = await Card.find({ gameId, playerId }).lean();
    
    // Validate card type rules (yellow -> second yellow -> red)
    const cardTypeValidation = canReceiveCard(existingCards, cardType);
    if (!cardTypeValidation.valid) {
      return res.status(400).json({ 
        message: 'Invalid card assignment',
        error: cardTypeValidation.error 
      });
    }

    // ✅ DEBUG: Log all existing events before validation
    const [allGoals, allSubstitutions, allCards] = await Promise.all([
      Goal.find({ gameId }).populate('scorerId', 'fullName').populate('assistedById', 'fullName').lean(),
      Substitution.find({ gameId }).populate('playerOutId', 'fullName').populate('playerInId', 'fullName').lean(),
      Card.find({ gameId }).populate('playerId', 'fullName').lean()
    ]);

    console.log('\n🟨🟥 ========== CREATING CARD ==========');
    console.log(`📅 New Card: Minute ${minute}, ${player.fullName} - ${cardType.toUpperCase()}`);
    console.log('\n📊 ALL EXISTING EVENTS:');
    
    console.log('\n⚽ GOALS:');
    allGoals.forEach(g => {
      const scorerName = g.scorerId?.fullName || g.scorerId || 'Opponent Goal';
      const assisterName = g.assistedById?.fullName || g.assistedById || '';
      console.log(`  - Min ${g.minute}: ${scorerName}${assisterName ? ` (assisted by ${assisterName})` : ''}`);
    });
    
    console.log('\n🔄 SUBSTITUTIONS:');
    allSubstitutions.forEach(s => {
      const playerOutName = s.playerOutId?.fullName || s.playerOutId || 'Unknown';
      const playerInName = s.playerInId?.fullName || s.playerInId || 'Unknown';
      console.log(`  - Min ${s.minute}: ${playerOutName} OUT → ${playerInName} IN`);
    });
    
    console.log('\n🟨🟥 CARDS:');
    allCards.forEach(c => {
      const playerName = c.playerId?.fullName || c.playerId || 'Unknown';
      console.log(`  - Min ${c.minute}: ${playerName} - ${c.cardType.toUpperCase()}`);
    });
    
    // ✅ DEBUG: Show all players' states at the target minute
    const timeline = await getMatchTimeline(gameId);
    const rosters = await GameRoster.find({ game: gameId, status: { $in: ['Starting Lineup', 'Bench'] } }).lean();
    const startingLineup = {};
    const squadPlayers = {};
    rosters.forEach(roster => {
      const playerId = roster.player?.toString() || roster.player?._id?.toString();
      if (playerId) {
        squadPlayers[playerId] = roster.status;
        if (roster.status === 'Starting Lineup') {
          startingLineup[playerId] = true;
        }
      }
    });
    
    console.log('\n👥 ALL PLAYERS STATUS AT MINUTE', minute, ':');
    const allPlayers = await Player.find({ _id: { $in: Object.keys(squadPlayers) } }).lean();
    for (const player of allPlayers) {
      const playerId = player._id.toString();
      const state = getPlayerStateAtMinute(timeline, playerId, minute, startingLineup, squadPlayers);
      const playerName = player.fullName || player.name || 'Unknown';
      const rosterStatus = squadPlayers[playerId] || 'Not in Squad';
      console.log(`  - ${playerName} (${rosterStatus}): ${state}`);
    }
    console.log('=====================================\n');

    // ✅ GAME RULES VALIDATION: Validate player eligibility (must be on pitch or bench, not sent off)
    const eligibilityValidation = await validateCardEligibility(gameId, playerId, minute);
    if (!eligibilityValidation.valid) {
      return res.status(400).json({
        message: 'Invalid card assignment',
        error: eligibilityValidation.error
      });
    }

    // ✅ FUTURE CONSISTENCY CHECK: Prevent out-of-order event corruption (only for red cards)
    if (cardType === 'red' || cardType === 'second-yellow') {
      const futureConsistency = await validateFutureConsistency(gameId, {
        type: 'card',
        minute,
        playerId,
        cardType
      });
      if (!futureConsistency.valid) {
        return res.status(400).json({
          message: 'Invalid card assignment',
          error: futureConsistency.error
        });
      }
    }

    // Create card
    const card = new Card({
      gameId,
      playerId,
      cardType,
      minute,
      reason: reason || ''
    });

    await card.save();

    // ✅ CRITICAL: Trigger recalc-minutes job for red cards
    if (cardType === 'red' || cardType === 'second-yellow') {
      try {
        await Job.create({
          jobType: 'recalc-minutes',
          payload: { gameId },
          status: 'pending',
          runAt: new Date()
        });
        console.log(`📋 Created recalc-minutes job for game ${gameId} after red card`);
      } catch (error) {
        console.error(`❌ Error creating recalc-minutes job:`, error);
      }
    }

    await card.populate('playerId', 'fullName kitNumber position');

    res.status(201).json({
      message: 'Card created successfully',
      card
    });
  } catch (error) {
    console.error('Error creating card:', error);
    res.status(500).json({ 
      message: 'Failed to create card', 
      error: error.message 
    });
  }
});

/**
 * GET /api/games/:gameId/cards
 * Get all cards for a game
 */
router.get('/:gameId/cards', checkGameAccess, async (req, res) => {
  try {
    const { gameId } = req.params;

    // Get all cards for the game, sorted by minute
    const cards = await Card.find({ gameId })
      .sort({ minute: 1, createdAt: 1 })
      .populate('playerId', 'fullName kitNumber position');

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
});

/**
 * GET /api/games/:gameId/cards/player/:playerId
 * Get cards for a specific player in a game
 */
router.get('/:gameId/cards/player/:playerId', checkGameAccess, async (req, res) => {
  try {
    const { gameId, playerId } = req.params;

    // Find cards for this player in this game
    const cards = await Card.find({ gameId, playerId })
      .sort({ minute: 1, createdAt: 1 })
      .populate('playerId', 'fullName kitNumber position');

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
});

/**
 * PUT /api/games/:gameId/cards/:cardId
 * Update an existing card
 */
router.put('/:gameId/cards/:cardId', checkGameAccess, async (req, res) => {
  try {
    const { gameId, cardId } = req.params;
    const { playerId, cardType, minute, reason } = req.body;

    // Find card
    const card = await Card.findOne({ _id: cardId, gameId });
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // ✅ SAFETY CHECK: If cardType is being changed, validate it
    if (cardType !== undefined && cardType !== card.cardType) {
      // Fetch existing cards for this player (excluding the card being updated)
      const existingCards = await Card.find({ 
        gameId, 
        playerId: playerId || card.playerId,
        _id: { $ne: cardId } // Exclude the card being updated
      }).lean();
      
      // Validate new card type can be received
      const cardTypeValidation = canReceiveCard(existingCards, cardType);
      if (!cardTypeValidation.valid) {
        return res.status(400).json({ 
          message: 'Invalid card assignment',
          error: cardTypeValidation.error 
        });
      }
    }

    // ✅ GAME RULES VALIDATION: Validate player eligibility if player or minute changed
    const finalMinute = minute !== undefined ? minute : card.minute;
    const finalPlayerId = playerId !== undefined ? playerId : card.playerId.toString();
    
    if (playerId !== undefined || minute !== undefined) {
      const eligibilityValidation = await validateCardEligibility(gameId, finalPlayerId, finalMinute);
      if (!eligibilityValidation.valid) {
        return res.status(400).json({
          message: 'Invalid card assignment',
          error: eligibilityValidation.error
        });
      }
    }

    // Track if card type changed to/from red card (affects recalc-minutes)
    const wasRedCard = card.cardType === 'red' || card.cardType === 'second-yellow';
    const willBeRedCard = cardType === 'red' || cardType === 'second-yellow';

    // Update fields
    if (playerId !== undefined) card.playerId = playerId;
    if (cardType !== undefined) card.cardType = cardType;
    if (minute !== undefined) card.minute = minute;
    if (reason !== undefined) card.reason = reason;

    await card.save();

    // ✅ CRITICAL: Trigger recalc-minutes job if red card status changed
    if (wasRedCard !== willBeRedCard) {
      try {
        await Job.create({
          jobType: 'recalc-minutes',
          payload: { gameId },
          status: 'pending',
          runAt: new Date()
        });
        console.log(`📋 Created recalc-minutes job for game ${gameId} after card type change`);
      } catch (error) {
        console.error(`❌ Error creating recalc-minutes job:`, error);
      }
    }

    await card.populate('playerId', 'fullName kitNumber position');

    res.json({
      message: 'Card updated successfully',
      card
    });
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(500).json({ 
      message: 'Failed to update card', 
      error: error.message 
    });
  }
});

/**
 * DELETE /api/games/:gameId/cards/:cardId
 * Delete a card
 */
router.delete('/:gameId/cards/:cardId', checkGameAccess, async (req, res) => {
  try {
    const { gameId, cardId } = req.params;

    // Find and delete card
    const card = await Card.findOneAndDelete({ _id: cardId, gameId });
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // ✅ CRITICAL: Trigger recalc-minutes job if red card was deleted
    if (card.cardType === 'red' || card.cardType === 'second-yellow') {
      try {
        await Job.create({
          jobType: 'recalc-minutes',
          payload: { gameId },
          status: 'pending',
          runAt: new Date()
        });
        console.log(`📋 Created recalc-minutes job for game ${gameId} after red card deletion`);
      } catch (error) {
        console.error(`❌ Error creating recalc-minutes job:`, error);
      }
    }

    res.json({
      message: 'Card deleted successfully',
      cardId
    });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({ 
      message: 'Failed to delete card', 
      error: error.message 
    });
  }
});

module.exports = router;

