const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema({
  // Primary Key (equivalent to EventID formula in Airtable)
  eventID: {
    type: String,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  
  // Links to Player, Game, and User (Author)
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
  
  eventType: {
    type: String,
    required: true,
    enum: ['Game Report', 'Scout Report']
  },
  
  // Performance statistics
  minutesPlayed: {
    type: Number,
    default: 0,
    min: 0,
    max: 120
  },
  
  goals: {
    type: Number,
    default: 0,
    min: 0
  },
  
  assists: {
    type: Number,
    default: 0,
    min: 0
  },
  
  generalRating: {
    type: Number,
    default: 3,
    min: 1,
    max: 5
  },
  
  generalNotes: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
timelineEventSchema.index({ eventID: 1 });
timelineEventSchema.index({ player: 1 });
timelineEventSchema.index({ game: 1 });
timelineEventSchema.index({ author: 1 });
timelineEventSchema.index({ eventType: 1 });
timelineEventSchema.index({ date: -1 });

// Validation to ensure assists don't exceed goals
timelineEventSchema.pre('save', function(next) {
  if (this.assists > this.goals) {
    return next(new Error('Assists cannot be greater than goals'));
  }
  next();
});

module.exports = mongoose.model('TimelineEvent', timelineEventSchema);


