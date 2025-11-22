const mongoose = require('mongoose');

const playerMatchStatSchema = new mongoose.Schema({
  gameId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Game', 
    required: true 
  },
  playerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Player', 
    required: true 
  },
  
  // 1. Disciplinary Stats (Moved from DisciplinaryAction)
  disciplinary: {
    foulsCommitted: { type: Number, default: 0, min: 0 },
    foulsReceived: { type: Number, default: 0, min: 0 }
  },

  // 2. Shot Tracking (Future Extensibility)
  shooting: {
    shotsOnTarget: { type: Number, default: 0 },
    shotsOffTarget: { type: Number, default: 0 },
    blockedShots: { type: Number, default: 0 },
    hitWoodwork: { type: Number, default: 0 }
  },

  // 3. Passing (Future Extensibility)
  passing: {
    totalPasses: { type: Number, default: 0 },
    completedPasses: { type: Number, default: 0 },
    keyPasses: { type: Number, default: 0 }
  }

  // ... add more stat categories as needed (corners, duels, etc.)
}, { timestamps: true });

// Compound Index: Ensures one stat sheet per player per game
playerMatchStatSchema.index({ gameId: 1, playerId: 1 }, { unique: true });

module.exports = mongoose.model('PlayerMatchStat', playerMatchStatSchema);

