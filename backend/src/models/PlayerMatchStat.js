const mongoose = require('mongoose');

const playerMatchStatSchema = new mongoose.Schema({
  gameId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Game', 
    required: true 
  },
  playerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Player', 
    required: true 
  },

  // 1. Fouls Ratings (1-5 Estimates) - Changed from counters
  fouls: {
    committedRating: { type: Number, min: 0, max: 5, default: 0 },
    receivedRating: { type: Number, min: 0, max: 5, default: 0 }
  },

  // 2. Shooting Ratings (1-5 Estimates)
  shooting: {
    volumeRating: { type: Number, min: 0, max: 5, default: 0 },
    accuracyRating: { type: Number, min: 0, max: 5, default: 0 }
  },

  // 3. Passing Ratings (1-5 Estimates)
  passing: {
    volumeRating: { type: Number, min: 0, max: 5, default: 0 },
    accuracyRating: { type: Number, min: 0, max: 5, default: 0 },
    keyPassesRating: { type: Number, min: 0, max: 5, default: 0 }
  },

  // 4. Duels Ratings (1-5 Estimates) - New
  duels: {
    involvementRating: { type: Number, min: 0, max: 5, default: 0 },
    successRating: { type: Number, min: 0, max: 5, default: 0 }
  }

}, { timestamps: true });

// Compound Index: Ensures one stat sheet per player per game
playerMatchStatSchema.index({ gameId: 1, playerId: 1 }, { unique: true });

module.exports = mongoose.model('PlayerMatchStat', playerMatchStatSchema);

