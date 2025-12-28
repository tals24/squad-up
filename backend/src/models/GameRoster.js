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
  },
  
  // Indicates if player actually played in the game
  // true if: status === 'Starting Lineup' OR (status === 'Bench' AND was subbed in)
  playedInGame: {
    type: Boolean,
    default: false
  },
  
  // Player's jersey number at the time of the game
  playerNumber: {
    type: Number,
    default: null
  },
  
  // Formation data (position-to-player mapping)
  // e.g., { gk: "playerId1", lb: "playerId2", rm: "playerId3", ... }
  // Stored in ALL roster records for redundancy (all have same formation)
  formation: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // Formation type (e.g., "1-4-4-2", "1-4-3-3")
  formationType: {
    type: String,
    default: null
  }
  
}, {
  timestamps: true
});

// Index for efficient queries
gameRosterSchema.index({ gameRosterID: 1 });
gameRosterSchema.index({ game: 1 });
gameRosterSchema.index({ player: 1 });
gameRosterSchema.index({ status: 1 });
gameRosterSchema.index({ playedInGame: 1 });

// Compound index to ensure unique player per game
gameRosterSchema.index({ game: 1, player: 1 }, { unique: true });


module.exports = mongoose.model('GameRoster', gameRosterSchema);


