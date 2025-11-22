const mongoose = require('mongoose');

const disciplinaryActionSchema = new mongoose.Schema({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true,
    index: true
  },
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true,
    index: true
  },
  
  // Card details
  cardType: {
    type: String,
    enum: ['yellow', 'red', 'second-yellow'],
    required: true,
    index: true
  },
  minute: {
    type: Number,
    required: true,
    min: 1,
    max: 120
  },
  
  // Foul tracking (aggregate ranges stored as representative values)
  // 0-2 fouls stored as 1, 3-5 stored as 4, 6+ stored as 7
  foulsCommitted: {
    type: Number,
    default: 0,
    min: 0
  },
  foulsReceived: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Context
  reason: {
    type: String,
    maxlength: 200
  }
}, {
  timestamps: true
});

// Compound index for efficient game-level queries
disciplinaryActionSchema.index({ gameId: 1, playerId: 1 });

// Index for card statistics
disciplinaryActionSchema.index({ playerId: 1, cardType: 1 });

const DisciplinaryAction = mongoose.model('DisciplinaryAction', disciplinaryActionSchema);

module.exports = DisciplinaryAction;

