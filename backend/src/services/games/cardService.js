const Card = require('../../models/Card');
const Player = require('../../models/Player');
const Job = require('../../models/Job');
const Goal = require('../../models/Goal');
const Substitution = require('../../models/Substitution');
const GameRoster = require('../../models/GameRoster');
const { canReceiveCard } = require('../../utils/cardValidation');
const { validateCardEligibility, validateFutureConsistency, getPlayerStateAtMinute, getMatchTimeline } = require('./utils/gameRules');

/**
 * Create a new card for a game
 * @param {String} gameId - Game ID
 * @param {Object} cardData - Card data
 * @returns {Object} Created card
 */
exports.createCard = async (gameId, cardData) => {
  const { playerId, cardType, minute, reason } = cardData;

  // Validate player exists
  const player = await Player.findById(playerId);
  if (!player) {
    throw new Error('Player not found');
  }

  // ✅ SAFETY CHECK: Fetch existing cards for this player in this game
  const existingCards = await Card.find({ gameId, playerId }).lean();
  
  // Validate card type rules (yellow -> second yellow -> red)
  const cardTypeValidation = canReceiveCard(existingCards, cardType);
  if (!cardTypeValidation.valid) {
    throw new Error(`Invalid card assignment: ${cardTypeValidation.error}`);
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
    const pid = roster.player?.toString() || roster.player?._id?.toString();
    if (pid) {
      squadPlayers[pid] = roster.status;
      if (roster.status === 'Starting Lineup') {
        startingLineup[pid] = true;
      }
    }
  });
  
  console.log('\n👥 ALL PLAYERS STATUS AT MINUTE', minute, ':');
  const allPlayers = await Player.find({ _id: { $in: Object.keys(squadPlayers) } }).lean();
  for (const p of allPlayers) {
    const pid = p._id.toString();
    const state = getPlayerStateAtMinute(timeline, pid, minute, startingLineup, squadPlayers);
    const playerName = p.fullName || p.name || 'Unknown';
    const rosterStatus = squadPlayers[pid] || 'Not in Squad';
    console.log(`  - ${playerName} (${rosterStatus}): ${state}`);
  }
  console.log('=====================================\n');

  // ✅ GAME RULES VALIDATION: Validate player eligibility (must be on pitch or bench, not sent off)
  const eligibilityValidation = await validateCardEligibility(gameId, playerId, minute);
  if (!eligibilityValidation.valid) {
    throw new Error(`Invalid card assignment: ${eligibilityValidation.error}`);
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
      throw new Error(`Invalid card assignment: ${futureConsistency.error}`);
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

  return card;
};

/**
 * Get all cards for a game
 * @param {String} gameId - Game ID
 * @returns {Array} Cards
 */
exports.getAllCards = async (gameId) => {
  const cards = await Card.find({ gameId })
    .sort({ minute: 1, createdAt: 1 })
    .populate('playerId', 'fullName kitNumber position');

  return cards;
};

/**
 * Get cards for a specific player in a game
 * @param {String} gameId - Game ID
 * @param {String} playerId - Player ID
 * @returns {Array} Cards
 */
exports.getPlayerCards = async (gameId, playerId) => {
  const cards = await Card.find({ gameId, playerId })
    .sort({ minute: 1, createdAt: 1 })
    .populate('playerId', 'fullName kitNumber position');

  return cards;
};

/**
 * Update an existing card
 * @param {String} gameId - Game ID
 * @param {String} cardId - Card ID
 * @param {Object} updateData - Update data
 * @returns {Object} Updated card
 */
exports.updateCard = async (gameId, cardId, updateData) => {
  const { playerId, cardType, minute, reason } = updateData;

  // Find card
  const card = await Card.findOne({ _id: cardId, gameId });
  if (!card) {
    throw new Error('Card not found');
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
      throw new Error(`Invalid card assignment: ${cardTypeValidation.error}`);
    }
  }

  // ✅ GAME RULES VALIDATION: Validate player eligibility if player or minute changed
  const finalMinute = minute !== undefined ? minute : card.minute;
  const finalPlayerId = playerId !== undefined ? playerId : card.playerId.toString();
  
  if (playerId !== undefined || minute !== undefined) {
    const eligibilityValidation = await validateCardEligibility(gameId, finalPlayerId, finalMinute);
    if (!eligibilityValidation.valid) {
      throw new Error(`Invalid card assignment: ${eligibilityValidation.error}`);
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

  return card;
};

/**
 * Delete a card
 * @param {String} gameId - Game ID
 * @param {String} cardId - Card ID
 * @returns {Object} Deleted card
 */
exports.deleteCard = async (gameId, cardId) => {
  const card = await Card.findOneAndDelete({ _id: cardId, gameId });
  if (!card) {
    throw new Error('Card not found');
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

  return card;
};

