const mongoose = require('mongoose');

const substitutionSchema = new mongoose.Schema({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true,
    index: true
  },
  
  // Substitution details
  playerOutId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true,
    index: true
  },
  playerInId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true,
    index: true
  },
  minute: {
    type: Number,
    required: true,
    min: 1,
    max: 120
  },
  
  // Substitution context
  reason: {
    type: String,
    enum: ['tactical', 'tired', 'injury', 'yellow-card-risk', 'poor-performance', 'other'],
    default: 'tactical'
  },
  matchState: {
    type: String,
    enum: ['winning', 'drawing', 'losing'],
    default: 'drawing'
  },
  
  // Optional coaching notes
  tacticalNote: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Compound index for efficient game-level queries sorted by minute
substitutionSchema.index({ gameId: 1, minute: 1 });

// Validation: playerOut and playerIn cannot be the same
substitutionSchema.pre('save', function(next) {
  if (this.playerOutId.equals(this.playerInId)) {
    const error = new Error('Player coming in and going out cannot be the same');
    return next(error);
  }
  next();
});

const Substitution = mongoose.model('Substitution', substitutionSchema);

module.exports = Substitution;

