const Card = require('../models/Card');
const Goal = require('../models/Goal');
const Substitution = require('../models/Substitution');

/**
 * Get unified match timeline from multiple collections
 * @param {string} gameId - Game ID
 * @returns {Promise<Array>} Chronologically sorted array of timeline events
 */
async function getMatchTimeline(gameId) {
  // Fetch all timeline events in parallel
  const [cards, goals, substitutions] = await Promise.all([
    Card.find({ gameId })
      .populate('playerId', 'fullName kitNumber position')
      .sort({ minute: 1, createdAt: 1 })
      .lean(),
    
    Goal.find({ gameId })
      .populate('scorerId', 'fullName kitNumber position')
      .populate('assistedById', 'fullName kitNumber position')
      .populate('goalInvolvement.playerId', 'fullName kitNumber position')
      .sort({ minute: 1, createdAt: 1 })
      .lean(),
    
    Substitution.find({ gameId })
      .populate('playerOutId', 'fullName kitNumber position')
      .populate('playerInId', 'fullName kitNumber position')
      .sort({ minute: 1, createdAt: 1 })
      .lean()
  ]);

  // Normalize Cards
  const normalizedCards = cards.map(card => ({
    id: card._id,
    type: 'card',
    minute: card.minute,
    timestamp: card.createdAt,
    cardType: card.cardType,
    player: card.playerId,
    reason: card.reason
  }));

  // Normalize Goals
  const normalizedGoals = goals.map(goal => ({
    id: goal._id,
    type: goal.goalCategory === 'TeamGoal' ? 'goal' : 'opponent-goal',
    minute: goal.minute,
    timestamp: goal.createdAt,
    scorer: goal.scorerId,
    assister: goal.assistedById,
    goalInvolvement: goal.goalInvolvement,
    goalType: goal.goalType,
    goalNumber: goal.goalNumber,
    matchState: goal.matchState,
    goalCategory: goal.goalCategory
  }));

  // Normalize Substitutions
  const normalizedSubs = substitutions.map(sub => ({
    id: sub._id,
    type: 'substitution',
    minute: sub.minute,
    timestamp: sub.createdAt,
    playerOut: sub.playerOutId,
    playerIn: sub.playerInId,
    reason: sub.reason,
    matchState: sub.matchState,
    tacticalNote: sub.tacticalNote
  }));

  // Merge and sort chronologically
  const timeline = [
    ...normalizedCards,
    ...normalizedGoals,
    ...normalizedSubs
  ].sort((a, b) => {
    // Primary sort: minute
    if (a.minute !== b.minute) {
      return a.minute - b.minute;
    }
    // Secondary sort: timestamp (if same minute)
    return new Date(a.timestamp) - new Date(b.timestamp);
  });

  return timeline;
}

module.exports = { getMatchTimeline };

