const mongoose = require('mongoose');

const goalInvolvementSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  contributionType: {
    type: String,
    enum: ['pre-assist', 'space-creation', 'defensive-action', 'set-piece-delivery', 'pressing-action', 'other'],
    required: true
  }
}, { _id: false });

const goalSchema = new mongoose.Schema({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true,
    index: true
  },
  goalNumber: {
    type: Number,
    required: true,
    min: 1
  },
  minute: {
    type: Number,
    required: true,
    min: 1,
    max: 120
  },
  
  // Goal type: team goal or opponent goal
  isOpponentGoal: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Goal relationships (only for team goals)
  scorerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: function() {
      return !this.isOpponentGoal; // Not required for opponent goals
    },
    index: true
  },
  assistedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null,
    index: true
  },
  
  // Goal involvement (indirect contributors)
  goalInvolvement: [goalInvolvementSchema],
  
  // Goal context
  goalType: {
    type: String,
    enum: ['open-play', 'set-piece', 'penalty', 'counter-attack', 'own-goal'],
    default: 'open-play'
  },
  matchState: {
    type: String,
    enum: ['winning', 'drawing', 'losing'],
    default: 'drawing'
  }
}, {
  timestamps: true
});

// Compound index for efficient game-level queries sorted by goal number
goalSchema.index({ gameId: 1, goalNumber: 1 });

// Index for timeline analysis
goalSchema.index({ gameId: 1, minute: 1 });

// Validation: Scorer and assister cannot be the same (only for team goals)
goalSchema.pre('save', function(next) {
  if (!this.isOpponentGoal && this.assistedById && this.scorerId && this.scorerId.equals(this.assistedById)) {
    const error = new Error('Scorer and assister cannot be the same player');
    return next(error);
  }
  next();
});

// Validation: Goal involvement players cannot include scorer or assister (only for team goals)
goalSchema.pre('save', function(next) {
  if (!this.isOpponentGoal && this.goalInvolvement && this.goalInvolvement.length > 0) {
    for (const involvement of this.goalInvolvement) {
      if (this.scorerId && involvement.playerId.equals(this.scorerId)) {
        return next(new Error('Goal involvement cannot include the scorer'));
      }
      if (this.assistedById && involvement.playerId.equals(this.assistedById)) {
        return next(new Error('Goal involvement cannot include the assister'));
      }
    }
  }
  next();
});

const Goal = mongoose.model('Goal', goalSchema);

module.exports = Goal;

