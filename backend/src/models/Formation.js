const mongoose = require('mongoose');

const formationSchema = new mongoose.Schema({
  // Primary Key (equivalent to FormationID formula in Airtable)
  formationID: {
    type: String,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  
  formationName: {
    type: String,
    required: true
  },
  
  gameSize: {
    type: String,
    required: true,
    enum: ['9-a-side', '11-a-side']
  },
  
  // Formation layout stored as JSON string (as in Airtable)
  formationLayout: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Link to Team
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  
  // Additional metadata
  description: {
    type: String,
    default: null
  },
  
  isDefault: {
    type: Boolean,
    default: false
  },
  
  // Track who created/modified the formation
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
formationSchema.index({ formationID: 1 });
formationSchema.index({ team: 1 });
formationSchema.index({ gameSize: 1 });
formationSchema.index({ isDefault: 1 });

module.exports = mongoose.model('Formation', formationSchema);


