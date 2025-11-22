const mongoose = require('mongoose');

// Goal involvement schema (for team goals only)
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

// Base Goal schema - shared fields for all goal types
const goalSchema = new mongoose.Schema({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true,
    index: true
  },
  minute: {
    type: Number,
    required: true,
    min: 1,
    max: 120
  },
  // Analytics fields (calculated when game status = "Done")
  goalNumber: {
    type: Number,
    min: 1
  },
  matchState: {
    type: String,
    enum: ['winning', 'drawing', 'losing']
  }
}, {
  timestamps: true,
  discriminatorKey: 'goalCategory' // Use 'goalCategory' to distinguish between TeamGoal and OpponentGoal
  // Note: 'goalType' is a separate field for TeamGoal enum (open-play, set-piece, etc.)
});

// Compound index for efficient game-level queries sorted by goal number
goalSchema.index({ gameId: 1, goalNumber: 1 });

// Index for timeline analysis
goalSchema.index({ gameId: 1, minute: 1 });

// Base Goal model
const Goal = mongoose.model('Goal', goalSchema);

// TeamGoal discriminator - has scorer, assister, etc.
const teamGoalSchema = new mongoose.Schema({
  scorerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: false, // Optional for own goals
    index: true
  },
  assistedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null,
    index: true
  },
  goalInvolvement: [goalInvolvementSchema],
  goalType: {
    type: String,
    enum: ['open-play', 'set-piece', 'penalty', 'counter-attack', 'own-goal'],
    default: 'open-play'
  }
});

// Validation: Scorer and assister cannot be the same
teamGoalSchema.pre('save', function(next) {
  // Skip validation if scorerId is null (own goal)
  if (!this.scorerId) {
    return next();
  }
  
  if (this.assistedById && this.scorerId && this.scorerId.equals(this.assistedById)) {
    const error = new Error('Scorer and assister cannot be the same player');
    return next(error);
  }
  next();
});

// Validation: Goal involvement players cannot include scorer or assister
teamGoalSchema.pre('save', function(next) {
  // Skip validation if scorerId is null (own goal)
  if (!this.scorerId) {
    return next();
  }
  
  if (this.goalInvolvement && this.goalInvolvement.length > 0) {
    for (const involvement of this.goalInvolvement) {
      if (involvement.playerId.equals(this.scorerId)) {
        return next(new Error('Goal involvement cannot include the scorer'));
      }
      if (this.assistedById && involvement.playerId.equals(this.assistedById)) {
        return next(new Error('Goal involvement cannot include the assister'));
      }
    }
  }
  next();
});

// OpponentGoal discriminator - has minute and goalType (inherits from base)
const opponentGoalSchema = new mongoose.Schema({
  goalType: {
    type: String,
    enum: ['open-play', 'set-piece', 'penalty', 'counter-attack', 'own-goal'],
    default: 'open-play'
  }
  // All shared fields (gameId, minute, goalNumber, matchState) come from base schema
});

// Create discriminators
const TeamGoal = Goal.discriminator('TeamGoal', teamGoalSchema);
const OpponentGoal = Goal.discriminator('OpponentGoal', opponentGoalSchema);

module.exports = Goal;
module.exports.TeamGoal = TeamGoal;
module.exports.OpponentGoal = OpponentGoal;
