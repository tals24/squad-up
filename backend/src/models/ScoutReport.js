const mongoose = require('mongoose');

const scoutReportSchema = new mongoose.Schema({
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
  
  // Scout-specific fields
  title: {
    type: String,
    required: false,
    maxlength: 200
  },
  
  content: {
    type: String,
    required: false,
    maxlength: 1000
  },
  
  // General rating (1-5 scale)
  generalRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 3
  },
  
  // Detailed scouting notes
  notes: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  // Optional: Link to specific game if scouting during a game
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: false
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
scoutReportSchema.index({ reportID: 1 });
scoutReportSchema.index({ player: 1 });
scoutReportSchema.index({ author: 1 });
scoutReportSchema.index({ date: -1 });
scoutReportSchema.index({ game: 1 });

module.exports = mongoose.model('ScoutReport', scoutReportSchema, 'scout_reports');
