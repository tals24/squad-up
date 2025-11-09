const mongoose = require('mongoose');

const gameRosterSchema = new mongoose.Schema({
  // Primary Key (equivalent to GameRosterID formula in Airtable)
  gameRosterID: {
    type: String,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  
  // Links to Game and Player
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  
  status: {
    type: String,
    required: true,
    enum: ['Starting Lineup', 'Bench', 'Unavailable', 'Not in Squad'],
    default: 'Not in Squad'
  }
  
  // ✅ Removed denormalized fields: gameTitle, playerName, rosterEntry
  // Frontend now performs lookups from gamePlayers and game state
}, {
  timestamps: true
});

// Index for efficient queries
gameRosterSchema.index({ gameRosterID: 1 });
gameRosterSchema.index({ game: 1 });
gameRosterSchema.index({ player: 1 });
gameRosterSchema.index({ status: 1 });

// Compound index to ensure unique player per game
gameRosterSchema.index({ game: 1, player: 1 }, { unique: true });

// ✅ Removed pre-save hook - no longer needed without denormalized fields

module.exports = mongoose.model('GameRoster', gameRosterSchema);


