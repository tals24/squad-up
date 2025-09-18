const mongoose = require('mongoose');

const drillSchema = new mongoose.Schema({
  // Primary Key (equivalent to DrillID formula in Airtable)
  drillID: {
    type: String,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  
  drillName: {
    type: String,
    required: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  category: {
    type: String,
    required: true,
    enum: ['Warm-up', 'Technical', 'Tactical', 'Physical', 'Small-sided Games', 'Set Pieces']
  },
  
  targetAgeGroup: {
    type: [String],
    required: true,
    enum: ['U6', 'U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'Senior']
  },
  
  videoLink: {
    type: String,
    default: null
  },
  
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Additional fields for drill content
  instructions: {
    type: String,
    default: null
  },
  
  details: {
    type: String,
    default: null
  },
  
  // For drill layout data (JSON string as in Airtable)
  layoutData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // Drill metadata
  duration: {
    type: Number, // in minutes
    default: null
  },
  
  playersRequired: {
    type: Number,
    default: null
  },
  
  equipment: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Index for efficient queries
drillSchema.index({ drillID: 1 });
drillSchema.index({ category: 1 });
drillSchema.index({ targetAgeGroup: 1 });
drillSchema.index({ author: 1 });
drillSchema.index({ drillName: 1 });

module.exports = mongoose.model('Drill', drillSchema);


