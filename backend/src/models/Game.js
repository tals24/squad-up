const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  // Primary Key (equivalent to GameID formula in Airtable)
  gameID: {
    type: String,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  
  // Formula field (equivalent to GameTitle formula in Airtable)
  gameTitle: {
    type: String,
    required: true
  },
  
  // Link to Team
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  
  // Lookup fields (equivalent to Season and TeamName lookups in Airtable)
  season: {
    type: String,
    required: true
  },
  
  teamName: {
    type: String,
    required: true
  },
  
  date: {
    type: Date,
    required: true
  },
  
  opponent: {
    type: String,
    required: true
  },
  
  location: {
    type: String,
    default: null
  },
  
  status: {
    type: String,
    required: true,
    enum: ['Scheduled', 'Played', 'Done', 'Postponed'],
    default: 'Scheduled'
  },
  
  ourScore: {
    type: Number,
    default: null
  },
  
  opponentScore: {
    type: Number,
    default: null
  },
  
  // Formula field (equivalent to FinalScore_Display formula in Airtable)
  finalScoreDisplay: {
    type: String,
    default: null
  },
  
  // Summary fields
  defenseSummary: {
    type: String,
    default: null
  },
  
  midfieldSummary: {
    type: String,
    default: null
  },
  
  attackSummary: {
    type: String,
    default: null
  },
  
  generalSummary: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
gameSchema.index({ gameID: 1 });
gameSchema.index({ team: 1 });
gameSchema.index({ date: 1 });
gameSchema.index({ status: 1 });
gameSchema.index({ season: 1 });

// Pre-save middleware to generate gameTitle and finalScoreDisplay
gameSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('opponent') || this.isModified('season') || this.isModified('teamName')) {
    this.gameTitle = `${this.season} ${this.teamName} vs ${this.opponent}`;
  }
  
  if (this.ourScore !== null && this.opponentScore !== null) {
    this.finalScoreDisplay = `${this.ourScore} - ${this.opponentScore}`;
  }
  
  next();
});

module.exports = mongoose.model('Game', gameSchema);


