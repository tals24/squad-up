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
  
  // Lookup fields (equivalent to GameTitle and PlayerName lookups in Airtable)
  gameTitle: {
    type: String,
    required: true
  },
  
  playerName: {
    type: String,
    required: true
  },
  
  // Formula field (equivalent to RosterEntry formula in Airtable)
  rosterEntry: {
    type: String,
    required: true
  }
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

// Pre-save middleware to generate lookup fields and formula
gameRosterSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('game') || this.isModified('player')) {
    // Populate the game and player to get their names
    await this.populate('game player');
    
    if (this.game) {
      this.gameTitle = this.game.gameTitle;
    }
    
    if (this.player) {
      this.playerName = this.player.fullName;
    }
    
    // Generate roster entry
    this.rosterEntry = `${this.gameTitle} - ${this.playerName}`;
  }
  
  next();
});

module.exports = mongoose.model('GameRoster', gameRosterSchema);


