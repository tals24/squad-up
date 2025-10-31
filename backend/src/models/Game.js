const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  // Primary Key (equivalent to GameID formula in Airtable)
  gameID: {
    type: String,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  
  // Formula field (equivalent to GameTitle formula in Airtable)
  // Removed: gameTitle is now calculated dynamically
  // gameTitle: {
  //   type: String,
  //   required: true
  // },
  
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
  },
  
  // Match duration tracking
  matchDuration: {
    regularTime: { 
      type: Number, 
      default: 90 
    },
    firstHalfExtraTime: { 
      type: Number, 
      default: 0 
    },
    secondHalfExtraTime: { 
      type: Number, 
      default: 0 
    }
  },
  
  // Calculated total match duration
  totalMatchDuration: {
    type: Number,
    default: 90
  },
  
  // Match type (for different validation rules)
  matchType: {
    type: String,
    enum: ['league', 'cup', 'friendly'],
    default: 'league'
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

// Virtual field for gameTitle (calculated dynamically)
gameSchema.virtual('gameTitle').get(function() {
  return `${this.teamName} vs ${this.opponent}`;
});

// Ensure virtual fields are included in JSON output
gameSchema.set('toJSON', { virtuals: true });
gameSchema.set('toObject', { virtuals: true });

// Pre-save middleware to generate finalScoreDisplay and calculate totalMatchDuration
gameSchema.pre('save', async function(next) {
  // Generate final score display
  if (this.ourScore !== null && this.opponentScore !== null) {
    this.finalScoreDisplay = `${this.ourScore} - ${this.opponentScore}`;
  }
  
  // Calculate total match duration
  if (this.matchDuration) {
    this.totalMatchDuration = 
      (this.matchDuration.regularTime || 90) +
      (this.matchDuration.firstHalfExtraTime || 0) +
      (this.matchDuration.secondHalfExtraTime || 0);
  } else {
    // Set default match duration if not present
    this.matchDuration = {
      regularTime: 90,
      firstHalfExtraTime: 0,
      secondHalfExtraTime: 0
    };
    this.totalMatchDuration = 90;
  }
  
  next();
});

module.exports = mongoose.model('Game', gameSchema, 'games');


