const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
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
  
  // Timeline Data
  minute: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 120 
  },
  cardType: { 
    type: String, 
    enum: ['yellow', 'red', 'second-yellow'], 
    required: true 
  },
  
  // Context
  reason: { 
    type: String, 
    maxlength: 200 
  }
}, { timestamps: true });

// Indexes
cardSchema.index({ gameId: 1, minute: 1 }); // Timeline order
cardSchema.index({ gameId: 1, playerId: 1 }); // Player cards per game

module.exports = mongoose.model('Card', cardSchema);

