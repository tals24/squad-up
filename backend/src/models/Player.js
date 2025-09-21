const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  // Primary Key (equivalent to PlayerRecordID formula in Airtable)
  playerRecordID: {
    type: String,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  
  fullName: {
    type: String,
    required: true
  },
  
  kitNumber: {
    type: Number,
    required: true
  },
  
  position: {
    type: String,
    required: true,
    enum: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Wing-back', 'Striker']
  },
  
  dateOfBirth: {
    type: Date,
    required: true
  },
  
  profileImage: {
    type: String,
    default: null
  },
  
  // Link to Team
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  
  // Lookup field (equivalent to TeamRecordID lookup in Airtable)
  teamRecordID: {
    type: String,
    required: true
  },
  
  // Additional fields
  nationalID: {
    type: String,
    default: null
  },
  
  phoneNumber: {
    type: String,
    default: null
  },
  
  email: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
playerSchema.index({ playerRecordID: 1 });
playerSchema.index({ team: 1 });
playerSchema.index({ teamRecordID: 1 });
playerSchema.index({ fullName: 1 });

// Virtual for age calculation
playerSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

module.exports = mongoose.model('Player', playerSchema, 'players');


