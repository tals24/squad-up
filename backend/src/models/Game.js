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
  },

  // Draft lineup for Scheduled games (temporary storage before game starts)
  // Format: { playerId: status, ... } e.g., { "68ce9c940d0528dbba21e570": "Starting Lineup", ... }
  lineupDraft: {
    type: mongoose.Schema.Types.Mixed, // JSON object: { playerId: status, ... }
    default: null
  },

  // Draft reports for Played games (temporary storage before final submission)
  // Format: {
  //   teamSummary: { defenseSummary, midfieldSummary, attackSummary, generalSummary },
  //   finalScore: { ourScore, opponentScore },
  //   matchDuration: { regularTime, firstHalfExtraTime, secondHalfExtraTime },
  //   playerReports: { playerId: { rating_physical, rating_technical, rating_tactical, rating_mental, notes }, ... },
  //   playerMatchStats: { playerId: { foulsCommitted, foulsReceived }, ... }
  // }
  reportDraft: {
    type: mongoose.Schema.Types.Mixed, // JSON object: { teamSummary?, finalScore?, matchDuration?, playerReports? }
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
gameSchema.index({ status: 1, lineupDraft: 1 }); // For efficient draft queries
gameSchema.index({ status: 1, reportDraft: 1 }); // For efficient report draft queries

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


