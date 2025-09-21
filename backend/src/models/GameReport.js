const mongoose = require('mongoose');

const gameReportSchema = new mongoose.Schema({
  // Primary Key
  reportID: {
    type: String,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  
  // Required References
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Game-specific performance data
  minutesPlayed: {
    type: Number,
    required: true,
    min: 0,
    max: 120,
    default: 0
  },
  
  goals: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  assists: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  // Detailed rating system for game reports
  rating_physical: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 3
  },
  
  rating_technical: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 3
  },
  
  rating_tactical: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 3
  },
  
  rating_mental: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 3
  },
  
  // General notes
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
gameReportSchema.index({ reportID: 1 });
gameReportSchema.index({ player: 1 });
gameReportSchema.index({ game: 1 });
gameReportSchema.index({ author: 1 });
gameReportSchema.index({ date: -1 });

// Validation: assists cannot exceed goals
gameReportSchema.pre('save', function(next) {
  if (this.assists > this.goals) {
    return next(new Error('Assists cannot be greater than goals'));
  }
  next();
});

// Virtual for overall rating
gameReportSchema.virtual('overallRating').get(function() {
  return (this.rating_physical + this.rating_technical + this.rating_tactical + this.rating_mental) / 4;
});

module.exports = mongoose.model('GameReport', gameReportSchema, 'game_reports');
